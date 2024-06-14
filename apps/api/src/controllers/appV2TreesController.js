import { status } from "../helpers/status";
import OnSiteStaff from "../models/onsitestaff";
import PlotModel from "../models/plot";
import TreeModel from "../models/tree";
import TreeTypeModel from "../models/treetype";
import { uploadBase64DataToS3, deleteFileByUrl, attachMetaData } from "./helper/uploadtos3AppV2";
const S3_UPLOAD_TYPE = 'trees';
import UserModel from "../models/user";
import ShiftModel from "../models/shifts";
import LogsModel from "../models/logs";
import TreesSnapshotModel from "../models/trees_snapshot";
const CryptoJS = require('crypto-js');
import { outerTryCatch } from "../helpers/utilsAppV2";
import Roles from "./helper/roles";

const getSaplingById = async (saplingID, adminID) => {
    const response = {
        success: false,
        data: null,
        error: null,
        status: status.bad
    };
    try {
        if (!adminID) {
            response.success = false;
            response.error = 'Please provide an adminID in the body.';
            response.status = status.bad;
            return response;
        }
        let admin = await OnSiteStaff.findOne({ _id: adminID });
        if (!admin) {
            response.success = false;
            response.error = `No onSiteStaff (admin) found with _id: ${adminID}`;
            response.status = status.unauthorized;
            return response;
        }
        //admin is valid:
        if (!saplingID) {
            response.success = false;
            response.error = `Please pass a saplingID in the body.`;
            return response;
        }
        let sapling = await TreeModel.findOne({ sapling_id: saplingID });
        if (!sapling) {
            response.success = false;
            response.error = `No sapling found with sapling_id: ${saplingID}`;
            return response;
        }
        console.log('sapling found-----', sapling)
        sapling = await formatTreeDataForApp(sapling);
        response.success = true;

        response.data = sapling;
        return response;
    }
    catch (err) {
        console.log(err)
        response.success = false;
        response.error = err;
        response.status = status.error
        return response;

    }
}
const updateSaplingByAdmin = async (sapling, adminID) => {
    const response = {
        success: false,
        error: null,
        data: null,
        status: status.bad
    }
    const responseStatus = {};
    try {
        if (!adminID || !sapling) {
            response.success = false;
            response.status = status.bad;
            response.error = 'Include both adminID and sapling fields in the body.';
            return response;
        }
        /*
        sapling:{
            data:{
                //tree object fields....
            },
            newImages:[
                {
                    name:"",
                    meta:{
                        capturetimestamp:"",
                        remark:""
                    }
                    data:"",
                }
            ],
            deletedImages:[
                //s3 urls
            ]//may be empty
        }        
        */
        let admin = await OnSiteStaff.findOne({ _id: adminID });
        if (!admin) {
            response.success = false;
            response.status = status.unauthorized;
            response.error = `No onSiteStaff found with _id: ${adminID}`;
            return response;
        }
        //valid admin.
        const saplingID = sapling.data.sapling_id;
        let existingSapling = await TreeModel.findOne({ sapling_id: saplingID });
        if (!existingSapling) {
            response.success = false;
            response.status = status.bad;
            response.error = `Sapling with sapling_id: ${saplingID} does not exist.`
            return response;
        }



        let treetype = await TreeTypeModel.findOne({ tree_id: sapling.data.tree_id });
        let plot = await PlotModel.findOne({ plot_id: sapling.data.plot_id })
        sapling.data.plot_id = plot._id;
        sapling.data.tree_id = treetype._id;
        if (sapling.data.user_id) {
            delete sapling.data.user_id;
        }
        //DO NOT copy over old list of image urls
        // sapling.data.image = existingSapling.image;
        //prunes images which are not found.
        console.log(sapling.data.image)
        responseStatus[saplingID] = {
            dataUploaded: false,
            imagesUploaded: [],
            imagesFailed: [],
        }
        const imagesToDelete = sapling.deletedImages;//list of s3 urls to delete.
        const newImages = sapling.newImages;//format same as the one used during upload
        const newImageUrls = await uploadImages(newImages, responseStatus, saplingID);
        const deletedUrls = await deleteImages(imagesToDelete, saplingID);
        console.log('deleted urls', deletedUrls);
        for (let url of deletedUrls) {
            const urlIndex = sapling.data.image.indexOf(url);
            sapling.data.image.splice(urlIndex, 1);
        }
        for (let url of newImageUrls) {
            sapling.data.image.push(url);
        }
        console.log(sapling.data)
        console.log(newImageUrls);
        //updated sapling.images array.
        await TreeModel.updateOne({ sapling_id: saplingID }, sapling.data);
        response.success = true;
        const savedData = await TreeModel.findOne({ sapling_id: saplingID });
        response.data = await formatTreeDataForApp(savedData);
        return response;
    }
    catch (err) {
        console.log(err)
        response.success = false;
        response.error = err;
        response.status = status.error;
        return response;
    }
}
async function formatTreeDataForApp(sapling) {
    sapling = JSON.parse(JSON.stringify(sapling));
    let treetype = await TreeTypeModel.findOne({ _id: sapling.tree_id });
    let plot = await PlotModel.findOne({ _id: sapling.plot_id });
    sapling.tree_id = treetype.tree_id;
    sapling.plot_id = plot.plot_id;
    sapling.image = await attachMetaData(sapling.image, S3_UPLOAD_TYPE);
    return sapling;
}

async function uploadImages(images, status, saplingID) {
    let imageUrls = [];

    for (const image of images) {
        const imageName = image.name; //must be passed.

        const data = image.data; //base64 encoding.
        const metadata = {
            capturetimestamp: image.meta.capturetimestamp,
            uploadtimestamp: (new Date()).toISOString(),

            //convertible to Date object using: new Date(Date.parse(timestamp));
            remark: image.meta.remark,
        };
        const imageUploadResponse = await uploadBase64DataToS3(imageName, S3_UPLOAD_TYPE, data, metadata);
        if (imageUploadResponse.success) {
            imageUrls.push(imageUploadResponse.location);
            status[saplingID].imagesUploaded.push({
                name: imageName,
                location: imageUploadResponse.location
            });
        }
        else {
            status[saplingID].imagesFailed.push({
                name: imageName,
                error: imageUploadResponse.error
            });
        }
    }
    return imageUrls;
}
async function deleteImages(imagesToDelete) {
    const deletedUrls = [];
    for (let url of imagesToDelete) {
        const deleteResponse = await deleteFileByUrl(url, S3_UPLOAD_TYPE);
        if (deleteResponse.success) {
            deletedUrls.push(url);
        }
        else {
            console.log('failed to delete: ', url, '\nWith error: ', deleteResponse.error);
        }
    }
    return deletedUrls;
}

export const uploadLogs = async (req, res) => {
    console.log("------uploading logs-----------");
    outerTryCatch(res, async () => {
        //console.log("logs: ", req.body);
        try {
            const logsArray = req.body;
            let count = 0, logCount = 0;

            for (const logData of logsArray) {
                let { userid, deviceinfo, phoneinfo, logs, timestamp } = logData;

                if (phoneinfo == null) {
                    phoneinfo = "not found";
                }

                // Check if the logs already exist in the collection
                const existingLog = await LogsModel.findOne({
                    userid,
                    deviceinfo,
                    phoneinfo,
                    logs,
                    timestamp
                });

                // If the log already exists, skip inserting it
                if (existingLog) {
                    console.log(`Log already exists: `, ++logCount);
                } else {
                    // Create a new log document
                    console.log("inserting logs--------");
                    const newLog = new LogsModel({
                        userid,
                        deviceinfo,
                        phoneinfo,
                        logs,
                        timestamp
                    });

                    // Save the log document to the collection
                    await newLog.save();
                    console.log("logs inserted successfully---------------", ++count);

                }

            }

            console.log("-----------All logs inserted successfully---------------");
            res.send({ success: true, message: 'All logs inserted successfully' });
        } catch (error) {
            console.error('Error inserting logs:', error);
            res.send({ success: false, message: 'Error inserting logs' });
        }
    });
}

export const uploadShifts = async (req, res) => {
    outerTryCatch(res, async () => {
        const shiftArray = req.body;
        console.log("request body upload shifts: ", shiftArray);
        let shiftUploadStatuses = {};

        for (const shift of shiftArray) {
            const { shift_id, id, user_id, shifttype, saplings, treesplanted, starttime, plotselected, timetaken, endtime, timestamp } = shift;
            console.log("shiftid--", shift_id, "saplings arr---", saplings, "id---", id);

            const shiftData = {
                start_time: starttime,
                end_time: endtime,
                user_id: user_id,
                saplings,
                shift_type: shifttype,
                plot_selected: plotselected,
                time_taken: timetaken,
                trees_planted: treesplanted,
                timestamp
            };

            try {
                if (shift_id) {
                    // const shiftD = await ShiftModel.findOne({ _id: shift_id });
                    // console.log("shiftndata found---", shiftD);

                    console.log("updating the shift document----");
                    const result = await ShiftModel.updateOne({ _id: shift_id }, shiftData);
                    shiftUploadStatuses[id] = { shiftID: shift_id, shiftUploaded: true, message: 'Shift updated successfully' };
                } else {
                    console.log("inserting into the shift document----");
                    const newShift = new ShiftModel(shiftData);
                    const savedShift = await newShift.save();
                    shiftUploadStatuses[id] = { shiftID: savedShift._id, shiftUploaded: true, message: 'Shift inserted successfully' };
                }

            } catch (error) {
                console.log("error inserting shift---" , error);
                shiftUploadStatuses[id] = { shiftID: shift_id, shiftUploaded: false, message: 'Error inserting/updating shift', dataSaveError : error };
            }
        }

        console.log("shift upload statuses--- ", shiftUploadStatuses);

        res.send(shiftUploadStatuses);
    });
};


export const uploadTrees = async (req, res) => {
    //There are no checks for valid plot, user, type, as 
    //the app is expected to make the right selections.
    outerTryCatch(res, async () => {
        const trees = req.body;
        console.log("trees: ", trees);
        const treeUploadStatuses = {};
        for (let tree of trees) {
            let treetype = await TreeTypeModel.findOne({ tree_id: tree.type_id });
            let plot = await PlotModel.findOne({ plot_id: tree.plot_id })
            console.log("plot--", plot, "treetype: ", treetype);
            const saplingID = tree.sapling_id;
            treeUploadStatuses[saplingID] = {
                dataUploaded: false,
                imagesUploaded: [],
                imagesFailed: [],
            }
            let existingMatch = await TreeModel.findOne({ sapling_id: saplingID })
            if (existingMatch) {
                treeUploadStatuses[saplingID].dataUploaded = true;
                treeUploadStatuses[saplingID].treeId = existingMatch._id;
                continue;
            }
            let user = await OnSiteStaff.findOne({ _id: tree.user_id });
            let imageUrls = await uploadImages(tree.images, treeUploadStatuses, saplingID);
            const location = {
                type: "Point",
                coordinates: tree.coordinates
            }
            const treeObj = {
                sapling_id: saplingID,
                tree_id: treetype._id,
                plot_id: plot._id,
                image: imageUrls,
                location: location,
                user_id: user._id,
                date_added: (new Date()).toISOString(),
            }
            //console.log("final tree treeOBj----", treeObj); //{"23123" :{ dataUploaded: false, imagesUploaded: [], imagesFailed: [], existsInDb -> false}}
            const treeInstance = new TreeModel(treeObj)
            try {
                await treeInstance.save();
                treeUploadStatuses[saplingID].dataUploaded = true;
                treeUploadStatuses[saplingID].treeId = (await TreeModel.find({ sapling_id: saplingID }))._id;
            }
            catch (err) {
                console.log(err)
                treeUploadStatuses[saplingID].dataUploaded = false;
                treeUploadStatuses[saplingID].dataSaveError = err;
            }
        }
        console.log('uploadstatuses: ', treeUploadStatuses);
        return res.send(treeUploadStatuses);
    })
}

export const uploadNewImages = async (req, res) => {
    outerTryCatch(res, async () => {
        const treesWithImages = req.body;
        console.log("---------treesWithImages:--------------------- ", treesWithImages);
        const treeUploadStatuses = {};

        for (let tree of treesWithImages) {
            const saplingID = tree.sapling_id;
            treeUploadStatuses[saplingID] = {
                dataUploaded: false,
                imagesUploaded: [],
                imagesFailed: [],
            }

            let existingMatch = await TreeModel.findOne({ sapling_id: saplingID })
            if (!existingMatch) {
                treeUploadStatuses[saplingID].dataUploaded = false;
                continue;
            }
            let user = await OnSiteStaff.findOne({ _id: tree.user_id });

            let imageUrl = await uploadImages([tree.image], treeUploadStatuses, saplingID);

            const location = {
                type: "Point",
                coordinates: { lat: tree.lat, lng: tree.lng }
            }
            const treesnapshotObj = {
                sapling_id: saplingID,
                image: imageUrl[0],
                location: location,
                user_id: user._id,
                date_added: (new Date()).toISOString(),
            }

            const newTreesnapshotInstance = new TreesSnapshotModel(treesnapshotObj) //treesnapshotObj
            try {
                await newTreesnapshotInstance.save();
                treeUploadStatuses[saplingID].dataUploaded = true;
            }
            catch (err) {
                treeUploadStatuses[saplingID].dataUploaded = false;
                treeUploadStatuses[saplingID].dataSaveError = err;
            }
        }
        console.log('uploadstatuses: ', treeUploadStatuses);
        return res.send(treeUploadStatuses);
    })
}

export const treesUpdatePlot = async (req, res) => {
    outerTryCatch(res, async () => {
        const trees = req.body;
        console.log("uploadTreesNewPlot: ", trees);
        const treeUploadStatuses = {};

        for (let tree of trees) {
            const saplingID = tree.sapling_id;
            treeUploadStatuses[saplingID] = { dataUploaded: false, message: "" };  // Initialize the status object

            let existingMatch = await TreeModel.findOne({ sapling_id: saplingID });

            if (!existingMatch) {
                treeUploadStatuses[saplingID].message = "Invalid sapling id";
                continue;
            }

            let plot = await PlotModel.findOne({ plot_id: tree.old_plot }); //old plot

            //check uuid are same
            const id1 = existingMatch.plot_id;
            const id2 = plot._id;
            let correctPlot = id1.equals(id2);

            console.log("correct plot---", plot, correctPlot, id1, id2);

            if (!correctPlot) {
                treeUploadStatuses[saplingID].message = `${saplingID} doesnot belong to plot ${plot.name}`; //Sapling id does not belong to the old plot
                continue;
            }

            let user = await OnSiteStaff.findOne({ _id: tree.user_id });
            let newPlot = await PlotModel.findOne({ plot_id: tree.new_plot });

            console.log("newPlot plot---", newPlot);

            const treesUpdatePlotObj = {
                plot_id: newPlot._id, //update the old plot with new one
            };

            // user_id: user._id,
            // date_added: new Date(),

            try {
                await TreeModel.updateOne({ sapling_id: saplingID }, { $set: treesUpdatePlotObj });
                treeUploadStatuses[saplingID].dataUploaded = true;
                treeUploadStatuses[saplingID].message = "plot updated successfully";

            } catch (err) {
                console.log(err);
                treeUploadStatuses[saplingID].dataSaveError = err;
                treeUploadStatuses[saplingID].message = "plot updation failed";
            }
        }

        console.log('uploadstatuses: ', treeUploadStatuses);

        return res.send(treeUploadStatuses);
    })
}


export const fetchPlotSaplings = async (req, res) => {
    outerTryCatch(res, async () => {
        const { userId, lastHash } = req.body;
        if (!userId) {
            return res.status(status.bad).send("Must supply _id of onsite staff for helper data")
        }
        const user = await OnSiteStaff.findOne({ _id: userId });
        if (!user) {
            return res.status(status.unauthorized).send("No onsite staff found with supplied _id.");
        }
        const plots = await PlotModel.find();
        console.log('Fetching plot saplings');
        let plotSaplings = await Promise.all((plots).map(async (plot) => {
            const plotData = {
                plot_id: plot.plot_id,
                saplings: []
            }
            plotData.saplings = (await TreeModel.find({ plot_id: plot })).filter((sapling) => {
                return sapling.location && (sapling.location.coordinates[0] + sapling.location.coordinates[1] > 0)
            }).map((sapling) => {
                return [
                    sapling.sapling_id,
                    sapling.location.coordinates[0],
                    sapling.location.coordinates[1],
                ]
            })
            if (plotData.saplings.length > 0) {
                plotData.saplings.sort((a, b) => (a[0] < b[0]));
                return plotData;
            }
            return null
        }));

        plotSaplings = plotSaplings.filter((data) => (data !== null));
        plotSaplings.sort((plot1, plot2) => (plot1.plot_id < plot2.plot_id))
        const currentHash = CryptoJS.MD5(JSON.stringify(plotSaplings)).toString();

        const response = {
            data: plotSaplings,
            hash: currentHash,
        }
        if (lastHash === currentHash) {
            //empty data from response payload:
            response.data = null;
        }
        console.log('sending response, ', response.data ? response.data.length : null);
        return res.send(response);
    })
}
export const fetchHelperData = async (req, res) => {
    console.log("inside fetch Helper")
    outerTryCatch(res, async () => {
        console.log("----inside fetchHelper Data :-----", req.body.userId)
        const { userId, lastHash } = req.body;
        if (!userId) {
            return res.status(status.bad).send("Must supply _id of onsite staff for helper data")
        }
        // const user = await onSiteStaff.findOne({ _id: userId });
        // if (!user) {
        //     return res.status(status.unauthorized).send("No onsite staff found with supplied _id.");
        // }
        const helperData = {};
        helperData.treeTypes = await TreeTypeModel.find();
        helperData.plots = await PlotModel.find();
        const saplings = await TreeModel.find()

        helperData.saplings = saplings.map(doc => ({ sapling_id: doc.sapling_id }))
        //console.log("saplings ",helperData.saplings)
        const currentHash = CryptoJS.MD5(JSON.stringify(helperData)).toString();
        const response = {
            data: helperData,
            hash: currentHash,
        }

        if (lastHash === currentHash) {
            //empty data from response payload:
            response.data = null;
        }
        return res.send(response);
    })
}

export const fetchShifts = async (req, res) => {
    console.log("inside fetch Shifts")
    outerTryCatch(res, async () => {
        console.log("----inside fetchSHift :-----", req.body.userId)
        const { userId, lastHash } = req.body;
        if (!userId) {
            return res.status(status.bad).send("Must supply _id of onsite staff for fething shifts")
        }
        const userShifts = await ShiftModel.find({ user_id: userId });

        //console.log("-------------userShifts----------", userShifts)
        // if (!userShifts) {
        //     return res.status(status.notfound).send("No shifts found for given user_id.");
        // }

        const currentHash = CryptoJS.MD5(JSON.stringify(userShifts)).toString();

        const response = {
            data: userShifts,
            hash: currentHash,
        }

        console.log("current hash shifts-----", currentHash);
        if (lastHash === currentHash) {
            //empty data from response payload:
            response.data = null;
        }
        return res.send(response);

    })
}

export const getSapling = async (req, res) => {
    outerTryCatch(res, async () => {
        const { adminID, saplingID } = req.body;
        const saplingData = await getSaplingById(saplingID, adminID);
        if (saplingData.success) {
            console.log(saplingData.data)
            return res.send(saplingData.data);
        }
        else {
            return res.status(saplingData.status).send(saplingData.error);
        }
    })
}
export const updateSapling = async (req, res) => {
    outerTryCatch(res, async () => {
        const { adminID, sapling } = req.body;
        const updateResponse = await updateSaplingByAdmin(sapling, adminID);
        if (updateResponse.success) {
            return res.send(updateResponse.data);
        }
        else {
            return res.status(updateResponse.status).send(updateResponse.error);
        }
    })
}

export const login = async (req, res) => {
    console.log("in login");

    outerTryCatch(res, async () => {
        const credentials = req.body;
        console.log(req.body)
        let { phone, pinNumber } = credentials;

        console.log("phone: ", phone, "pin: ", pinNumber);

        const response = {
            success: false,
            user: null,
            error: null
        }

        if (!phone) {
            console.log(phone)
            response.error = {
                errorCode: 2,
                errorMsg: "Please fill all fields."
            };
            return res.send(response);
        }

        if (phone.startsWith("91") && phone.length > 10) {
            phone = phone.substring(2);
            console.log("phone: ", phone);
        }

        let userCheck = await UserModel.findOne({ phone: phone });
        console.log("user: ", userCheck);

        if (!userCheck) {
            response.error = {
                errorCode: 2,
                errorMsg: "Incorrect User"
            }
            console.log("error: ", response);
            return res.send(response);
        }

        let onsitestaff = await OnSiteStaff.findOne({ phone: phone });
        console.log("userCheck._id: ", userCheck._id);
        const userPin = userCheck.pin;
        console.log("userPin: ", userPin, typeof userPin, typeof pinNumber, typeof phone, typeof userCheck.phone);
        const pinNo = pinNumber !== undefined ? Number(pinNumber) : pinNumber;

        if (!onsitestaff) {
            response.user = {
                _id: userCheck._id,
                name: userCheck.name,
                userid: userCheck.userid,
                phone: userCheck.phone,
                email: userCheck.email,
                userRole: null
            };
            response.error = {
                errorCode: 2,
                errorMsg: `user not authorized to access app. contact admin`
            }
            return res.send(response);

        } else {
            //console.log("inside onsite staff table: ", onsitestaff);
            const userRole = onsitestaff.role;
            console.log("onsitestaffCheck: ", userRole);

            if (userRole === Roles.NO_ROLE || userRole === Roles.UNVERIFIED) {
                response.user = {
                    _id: userCheck._id,
                    name: userCheck.name,
                    userid: userCheck.userid,
                    phone: userCheck.phone,
                    email: userCheck.email,
                    userRole: userRole,
                };
                response.error = {
                    errorCode: 2,
                    errorMsg: "user not set up correctly. contact admin"
                }
            } else if (userRole === Roles.TREELOGGING && (pinNo === undefined || userPin === pinNo)) {
                response.success = true;
                response.user = {
                    _id: onsitestaff._id,
                    name: onsitestaff.name,
                    userid: onsitestaff.user_id,
                    phone: onsitestaff.phone,
                    email: onsitestaff.email,
                    userRole: userRole,
                    adminID: null
                };
                response.error = null;
            } else if (userRole === Roles.ADMIN && (pinNo === undefined || userPin === pinNo)) {
                response.success = true;
                response.user = {
                    _id: onsitestaff._id,
                    name: onsitestaff.name,
                    userid: onsitestaff.user_id,
                    phone: onsitestaff.phone,
                    email: onsitestaff.email,
                    userRole: userRole,
                    adminID: onsitestaff._id
                };
                response.error = null;
            } else {
                response.error = {
                    errorCode: 2,
                    errorMsg: "Incorrect User"
                }
                console.log("error: ", response);
                return res.send(response);
            }

            return res.send(response);
        }


    })
};

export const healthCheck = async (req, res) => {
    return res.send('reachable');
}
