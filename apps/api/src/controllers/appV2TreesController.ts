import { Request, Response } from "express";
import CryptoJS from 'crypto-js';
import * as jwt from 'jsonwebtoken';
import TreeRepository from "../repo/treeRepo";
import PlantTypeRepository from "../repo/plantTypeRepo";
import { PlotRepository } from "../repo/plotRepo";
import { attachMetaData, uploadBase64DataToS3 } from "./helper/uploadtos3";
import { UserRepository } from "../repo/userRepo";
import { LogsInfoRepository } from "../repo/logsInfoRepo";
import { status } from "../helpers/status";
import { UpdateTreeRequest } from "../models/app_v2";
import { GroupRepository } from "../repo/groupRepo";
import { UserGroupRepository } from "../repo/userGroupRepo";
import { PlantType } from "../models/plant_type";
import { Plot } from "../models/plot";
import { ShiftRepository } from "../repo/shiftRepo";
import { Shift, ShiftCreationAttributes } from "../models/shift";
import { TreesSnapshotCreationAttributes } from "../models/trees_snapshots";
import { TreesSnapshotRepository } from "../repo/treesSnapshotsRepo";
import { Tree, TreeCreationAttributes } from "../models/tree";
import { isValidDateString } from "../helpers/utils";
import { SiteRepository } from "../repo/sitesRepo";
import { Op, WhereOptions } from "sequelize";
import { VisitRepository } from "../repo/visitsRepo";
import { VisitImagesRepository } from "../repo/visitImagesRepo";
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { SyncHistoriesRepository } from "../repo/syncHistoryRepo";

export const healthCheck = async (req: Request, res: Response) => {
    return res.status(status.success).send('reachable');
}

// TODO: Only admin should be able to make calls to this controller
export const getTreeBySaplingId = async (req: Request, res: Response) => {
    const { sapling_id } = req.body;
    if (!sapling_id || sapling_id === '') {
        res.status(status.bad).send('Please pass a sapling_id in the body.');
        return;
    }

    try {
        let tree = await TreeRepository.getTreeBySaplingId(sapling_id);
        if (!tree) {
            res.status(status.notfound).send('Tree not found for sapling_id: ' + sapling_id);
            return;
        }

        const parsedTree = JSON.parse(JSON.stringify(tree));
        let response: any = {
            ...parsedTree
        }

        const metadata = await attachMetaData(tree.image, 'trees');
        if (metadata.length > 0) response.image = metadata[0];
        res.status(status.success).json(response);
    } catch(err: any) {
        console.log("[ERROR]", "appV2::getTreeBySaplingId: ", err);
        res.status(status.error).send({ error: "Something went wrong!" });
    }
}

export const uploadTrees = async (req: Request, res: Response) => {

    const trees = req.body;
    console.log("trees: ", trees);
    const treeUploadStatuses = {} as any;
    for (let tree of trees) {
        const saplingID = tree.sapling_id;
        treeUploadStatuses[saplingID] = {
            dataUploaded: false,
            imagesUploaded: [],
            imagesFailed: [],
        }
        let existingMatch = await TreeRepository.getTreeBySaplingId(saplingID)
        if (existingMatch) {
            treeUploadStatuses[saplingID].dataUploaded = true;
            treeUploadStatuses[saplingID].treeId = existingMatch.id;
            continue;
        }

        let imageUrl = await uploadImage(tree.images, treeUploadStatuses, saplingID);
        let userTreeImageUrl = await uploadImage([tree.user_tree_image], treeUploadStatuses, saplingID);
        let userTreeCardUrl = await uploadImage([tree.user_card_image], treeUploadStatuses, saplingID);
        const location = {
            type: "Point",
            coordinates: tree.coordinates
        }

        const treeObj: TreeCreationAttributes = {
            sapling_id: saplingID,
            plant_type_id: tree.plant_type_id,
            plot_id: tree.plot_id,
            image: imageUrl,
            location: location,
            planted_by: tree.planted_by,
            tree_status: tree.tree_status,
            assigned_at: tree.assigned_at,
            assigned_to: tree.assigned_to,
            user_tree_image: userTreeImageUrl,
            user_card_image: userTreeCardUrl,
            visit_id: tree.visit_id,
            created_at: new Date(),
            updated_at: new Date(),
        }

        try {
            const tree = await TreeRepository.addTreeObject(treeObj);
            treeUploadStatuses[saplingID].dataUploaded = true;
            treeUploadStatuses[saplingID].treeId = tree.id;
        }
        catch (err) {
            console.log(err)
            treeUploadStatuses[saplingID].dataUploaded = false;
            treeUploadStatuses[saplingID].dataSaveError = err;
        }
    }
    console.log('uploadstatuses: ', treeUploadStatuses);
    return res.status(status.success).send(treeUploadStatuses);
}

async function uploadImage(images: any, status: any, saplingID: string) {
    if (!images || images.length === 0 || !images[0]) {
        return null;
    }
    const image = images[0];
    const imageName = image.name; //must be passed.

    const data = image.data; //base64 encoding.
    const metadata = image.meta ? {
        capturetimestamp: image.meta.capturetimestamp,
        uploadtimestamp: (new Date()).toISOString(),

        //convertible to Date object using: new Date(Date.parse(timestamp));
        remark: image.meta.remark,
    } : null;
    const imageUploadResponse = await uploadBase64DataToS3(imageName, 'trees', data, metadata);
    if (imageUploadResponse.success) {
        status[saplingID].imagesUploaded.push({
            name: imageName,
            location: imageUploadResponse.location
        });
        return imageUploadResponse.location;
    }
    else {
        status[saplingID].imagesFailed.push({
            name: imageName,
            error: imageUploadResponse.error
        });
        return null;
    }
}

/*
    AppV2 logs controller
    - Receives logs from appV2 and stores them in the database
*/

export const uploadLogs = async (req: Request, res: Response) => {
    const logsArray = req.body;

    if (!logsArray) {
        console.log("[INFO] appV2::uploadLogs:", "No logs found in request body!");
        return res.status(status.bad).send({ error: "No logs found in request body!" });
    }

    try {
        for (const logData of logsArray) {
            let { user_id, device_info, phone_info, logs, timestamp } = logData;

            if (phone_info == null) {
                phone_info = "not found";
            }

            try {
                await LogsInfoRepository.addLogsInfo({
                    user_id: user_id,
                    device_info: device_info,
                    phone_info: phone_info,
                    logs: logs,
                    timestamp: new Date(timestamp),
                })
            } catch(err: any) {
                console.log("[ERROR] appV2::uploadLogs:", err);
                console.log("LOGS_INFO:", logData);
            }
        }

        console.log("[INFO] appV2::uploadLogs:", "Logs inserted successfully!");
        res.status(status.success).send({ success: true, message: 'Logs inserted successfully' });
    } catch (error: any) {
        console.log('[ERROR] appV2::uploadLogs:', 'Error inserting logs:', error);
        res.status(status.error).send({ success: false, message: 'Error inserting logs' });
    }
}

export const updateSaplingByAdmin = async (req: Request, res: Response) => {
    const sapling: UpdateTreeRequest = req.body;

    if (!sapling) {
        const message = 'Please pass a sapling details in the body.'
        console.log('[INFO] appV2::updateSaplingByAdmin:', message);
        return res.status(status.bad).send({ success: false, message: message });
    }

    try {
        
        const saplingId = sapling.tree.sapling_id;
        let existingTree = await TreeRepository.getTreeBySaplingId(saplingId);
        if (!existingTree) {
            const message = `Tree with sapling id ${saplingId} not found`;
            console.log('[INFO] appV2::updateSaplingByAdmin:', message);
            return res.status(status.notfound).send(message);
        }


        // DO NOT copy over old list of image urls
        // sapling.data.image = existingSapling.image;
        // prunes images which are not found.

        const imageToDelete = sapling.delete_image; //s3 url to delete.
        const newImage = sapling.new_image; // format same as the one used during upload

        if (newImage) {
            const metadata = newImage.meta ? {
                capturetimestamp: newImage.meta.capturetimestamp,
                uploadtimestamp: (new Date()).toISOString(),
                remark: newImage.meta.remark,
            } : null;
            const imageUploadResponse = await uploadBase64DataToS3(newImage.name, "trees", newImage.data, metadata);
            if (imageUploadResponse.success) {
                sapling.tree.image = imageUploadResponse.location;
            } else {
                console.log("[ERROR] appV2::updateSaplingByAdmin: Image upload failed.", imageUploadResponse.error);
            }
        }
        
        // TODO: delete old image from S3?
        
        sapling.tree.updated_at = new Date();
        const savedData = await existingTree.update(sapling.tree);
        const str = JSON.stringify(savedData);
        const json = JSON.parse(str);
        let response: any = {
            ...json,
        }

        res.status(status.success).json(response);
    } catch (err) {
        console.log("[ERROR] appV2::updateSaplingByAdmin:", err, sapling);
        res.status(status.error).send({ success: false, message: 'Error updating sapling' });
    }
}

export const login = async (req: Request, res: Response) => {
    
    const credentials = req.body;
    let { phone, pinNumber } = credentials;

    console.log("[INFO] appV2::login: Authenticating user with credentials: ", credentials);

    const response: any = {
        success: false,
        user: null,
        error: null
    }

    if (!phone) {
        console.log("[INFO] appV2::login: Phone not found");
        response.error = {
            errorCode: 2,
            errorMsg: "Please fill all fields."
        };
        return res.status(status.bad).send(response);
    }

    if (phone.startsWith("91") && phone.length > 10) phone = phone.substring(2);

    let userCheck = await UserRepository.getUsers(0, 1, [{ columnField: 'phone', value: phone, operatorValue: 'equals'}]);
    if (userCheck.results.length === 0) {
        response.error = {
            errorCode: 2,
            errorMsg: "Incorrect User"
        }
        console.log("[INFO] appV2::login: User not found for given phone number");
        return res.status(status.notfound).send(response);
    }

    const user = userCheck.results[0];
    response.user = {
        id: user.id,
        name: user.name,
        user_id: user.user_id,
        phone: user.phone,
        email: user.email,
        roles: user.roles,
        token: ""
    }
    const groupCheck = await GroupRepository.getGroups(0, 1, {
        type: "onsite_staff"
    });
    let isAuthorized = false;
    if (groupCheck.results.length !== 0) {
        const userGroup = await UserGroupRepository.getUserGroup(user.id, groupCheck.results[0].id);
        if (userGroup) isAuthorized = true;
    }

    if (user.roles?.includes("admin")) isAuthorized = true;
    if (user.roles?.includes("treelogging")) isAuthorized = true;

    if (!isAuthorized) {
        console.log("[INFO] appV2::login: User is not part of onsite staff group.");
        response.error = {
            errorCode: 2,
            errorMsg: `user not authorized to access app. contact admin`
        }
        return res.status(status.success).send(response);
    } else if ( user.pin !== pinNumber) {
        console.log("[INFO] appV2::login: Incorrect pin number");
        response.error = {
            errorCode: 2,
            errorMsg: `Incorrect pin number`
        }
        return res.status(status.success).send(response);
    }

    const jwtToken = jwt.sign({ user_id: user.id, roles: user.roles }, process.env.SECRET_KEY as string);

    response.user.token = jwtToken;
    response.success = true;
    return res.status(status.success).send(response);
};

export const fetchHelperData = async (req: Request, res: Response) => {
    
    const { last_hash } = req.body;

    const helperData = {
        plant_types: [] as PlantType[],
        plots: [] as Plot[],
        sapling_ids: [] as {sapling_id: string}[],
    }
    const plantTypeResp = await PlantTypeRepository.getPlantTypes(0, -1, {});
    helperData.plant_types = plantTypeResp.results;
    const plotResp = await PlotRepository.getPlots(0, -1, []);
    helperData.plots = plotResp.results;
    // const treeResponse = await TreeRepository.getTrees(0, -1, [])
    // helperData.sapling_ids = treeResponse.results.map(doc => ({ sapling_id: doc.sapling_id }))

    const currentHash = CryptoJS.MD5(JSON.stringify(helperData)).toString();
    const response = {
        data: helperData as any,
        hash: currentHash,
    }

    if (last_hash === currentHash) {
        //empty data from response payload:
        response.data = null;
    }
    return res.send(response);
}


/*
    Sifts: Onsite staff shift details
*/

export const fetchShifts = async (req: Request, res: Response) => {

    const { user_id, last_hash } = req.body;
    if (!user_id) {
        const message = "User id of onsite staff is required."
        console.log("[INFO] appV2::fetchShifts: " + message);
        res.status(status.bad).send({ error: message });
        return;
    }

    try {
        let userShifts: any[] = await ShiftRepository.getShifts({ user_id: user_id });
        userShifts = JSON.parse(JSON.stringify(userShifts))
        console.log(userShifts)
        const currentHash = CryptoJS.MD5(JSON.stringify(userShifts)).toString();
        const response = {
            data: userShifts.map(shift => {
                let timestamp = shift.timestamp.split('T')[0];
                timestamp = timestamp.split('-').reverse().join('-');
                return { ...shift, timestamp: timestamp };
            }) as any,
            hash: currentHash,
        }
    
        //empty data from response payload:
        if (last_hash === currentHash) response.data = null;
        res.status(status.success).send(response);
    } catch (err: any) {
        const message = "Error fetching shifts."
        console.log("[ERROR] appV2::fetchShifts: " + message, err);
        res.status(status.error).send({ error: message });
    }
}

export const uploadShifts = async (req: Request, res: Response) => {
    
    const shiftArray = req.body;
    let shiftUploadStatuses: any = {};

    for (const shift of shiftArray) {
        const { shift_id, id, user_id, shift_type, saplings, trees_planted, start_time, plot_selected, time_taken, end_time, timestamp } = shift;

        let time = new Date();
        if (timestamp) {
            const date = (timestamp as string).split('-');
            if (date.length === 3) {
                const dt = new Date(`${date[2]}-${date[1]}-${date[0]}T00:00:00.000Z`);
                if (!isNaN(dt.getTime())) time = dt;
            }
        }
        console.log(shift)
        const shiftData: ShiftCreationAttributes | Shift = {
            start_time: start_time,
            end_time: end_time,
            user_id: user_id,
            saplings,
            shift_type: shift_type,
            plot_selected: plot_selected,
            time_taken: time_taken,
            trees_planted: parseInt(trees_planted),
            timestamp: time,
        };

        try {
            if (shift_id) {
                shiftData.id = shift_id;
                await ShiftRepository.updateSift(shiftData as Shift);
                shiftUploadStatuses[id] = { shiftID: shift_id, shiftUploaded: true, message: 'Shift updated successfully' };
            } else {
                const result= await ShiftRepository.addShift(shiftData)
                shiftUploadStatuses[id] = { shiftID: result.id, shiftUploaded: true, message: 'Shift inserted successfully' };
            }
        } catch (err: any) {
            console.log("[ERROR] appV2::uploadShifts: ", shift, err);
            shiftUploadStatuses[id] = { shiftID: shift_id, shiftUploaded: false, message: 'Error inserting/updating shift' };
        }
    }
    res.send(shiftUploadStatuses);
};

export const uploadNewImages = async (req: Request, res: Response) => {
    const treesWithImages = req.body;
    const treeUploadStatuses: any = {};

    for (let tree of treesWithImages) {
        console.log(JSON.stringify(tree, null, 2))
        const saplingId = tree.sapling_id;
        treeUploadStatuses[saplingId] = {
            dataUploaded: false,
            imagesUploaded: [],
            imagesFailed: [],
        }

        let existingMatch = await TreeRepository.getTreeBySaplingId(saplingId)
        if (existingMatch) {    
            let imageUrl = await uploadImage([tree.image], treeUploadStatuses, saplingId);
            if (imageUrl) {
                const treeSnapshotObj: TreesSnapshotCreationAttributes = {
                    sapling_id: saplingId,
                    image: imageUrl,
                    image_date: new Date(),
                    tree_status: tree.tree_status,
                    user_id: tree.user_id,
                    created_at: new Date(),
                    is_active: true,
                }
        
                try {
                    await TreesSnapshotRepository.addTreesSnapshot(treeSnapshotObj);
                    treeUploadStatuses[saplingId].dataUploaded = true;
                }
                catch (err) {
                    treeUploadStatuses[saplingId].dataUploaded = false;
                    treeUploadStatuses[saplingId].dataSaveError = err;
                }
            }
            
        }
    }
    console.log('uploadstatuses: ', JSON.stringify(treeUploadStatuses));
    return res.send(treeUploadStatuses);
}

export const treesUpdatePlot = async (req: Request, res: Response) => {
    const trees = req.body;
    console.log("uploadTreesNewPlot: ", trees);
    const treeUploadStatuses: any = {};

    for (let tree of trees) {
        const saplingID = tree.sapling_id;
        treeUploadStatuses[saplingID] = { dataUploaded: false, message: "" };  // Initialize the status object

        let existingMatch = await TreeRepository.getTreeBySaplingId(saplingID);
        if (!existingMatch) {
            treeUploadStatuses[saplingID].message = "Invalid sapling id";
            continue;
        }

        if (existingMatch.plot_id != tree.old_plot) {
            treeUploadStatuses[saplingID].message = `${saplingID} does not belong to plot ${tree.old_plot} plot`; //Sapling id does not belong to the old plot
            continue;
        }

        existingMatch.plot_id = tree.new_plot;
        try {
            await existingMatch.save();
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
}

/*
    Users Helper Data
*/

export const getDeltaUsers = async (req: Request, res: Response) => {
    let  { timestamp, user_ids, offset, limit } = req.body;
    let lowerBound = new Date("1970-01-01T00:00:00.000Z");
    let userIds: number[] = [];

    if (!limit) limit = 1000;
    if (!offset) offset = 0;

    if (isValidDateString(timestamp)) lowerBound = new Date(timestamp);
    if (user_ids && user_ids.length > 0) userIds = user_ids;

    try {
        // fetch created and updated users after given time
        const result = await UserRepository.getUsers(offset, limit, [
            { columnField: "updated_at", operatorValue: "greaterThan", value: lowerBound.toISOString() },
        ])
    
        // fetch deleted users
        const deleted = await UserRepository.getDeletedUsersFromList(userIds);
        res.status(status.success).json({ total: result.total, users: result.results, deleted_user_ids: deleted });
    } catch(err: any) {
        console.log("[ERROR] appV2::getDeltaUsers: ", err);
        res.status(status.error).json({ error: "Something went wrong!" });
    }
}

export const getDeltaTrees = async (req: Request, res: Response) => {
    let { site_id, timestamp, tree_ids, offset, limit } = req.body;
    let lowerBound = new Date("1970-01-01T00:00:00.000Z");
    let treeIds: number[] = [];

    if (!limit) limit = 1000;
    if (!offset) offset = 0;

    if (isValidDateString(timestamp)) lowerBound = new Date(timestamp);
    if (tree_ids && tree_ids.length > 0) treeIds = tree_ids;
    const filters: FilterItem[] = [
        { columnField: "updated_at", operatorValue: "greaterThan", value: lowerBound.toISOString() },
    ]
    
    try {
        let plotIds: number[] = []
        if (site_id && !isNaN(site_id)) {
            const plots = await PlotRepository.getPlots(0, -1, [{ columnField: 'site_id', operatorValue: 'equals', value: site_id }])
            plotIds = plots.results.map(plot => plot.id);
            if (plotIds.length > 0) filters.push({ columnField: 'plot_id', operatorValue: 'isAnyOf', value: plotIds })
        }

        // fetch created and updated trees after given time
        let result: PaginatedResponse<Tree>;
        if (site_id && !isNaN(site_id) && plotIds.length === 0) {
            result = {
                total: 0,
                offset: offset,
                results: []
            }
        } else {
            result = await TreeRepository.getTrees(offset, limit, filters)
        }
    
        // fetch deleted trees
        const deleted = await TreeRepository.getDeletedTreesFromList(treeIds);
        res.status(status.success).json({ total: result.total, trees: result.results, deleted_tree_ids: deleted });
    } catch(err: any) {
        console.log("[ERROR] appV2::getDeltaTree: ", err);
        res.status(status.error).json({ error: "Something went wrong!" });
    }
}

export const getDeltaSites = async (req: Request, res: Response) => {
    let { timestamp, site_ids, offset, limit } = req.body;
    let lowerBound = new Date("1970-01-01T00:00:00.000Z");
    let siteIds: number[] = [];

    if (!limit) limit = 1000;
    if (!offset) offset = 0;

    if (isValidDateString(timestamp)) lowerBound = new Date(timestamp);
    if (site_ids && site_ids.length > 0) siteIds = site_ids;


    try {
        // fetch created and updated sites after given time
        const result = await SiteRepository.getSites(offset, limit, [
            { "updated_at": { [Op.gt]: lowerBound.toISOString() }},
        ])
    
        // fetch deleted sites
        const deleted = await SiteRepository.getDeletedSitesFromList(siteIds);
        res.status(status.success).json({ total: result.total, sites: result.results, deleted_site_ids: deleted });
    } catch(err: any) {
        console.log("[ERROR] appV2::getDeltaSites: ", err);
        res.status(status.error).json({ error: "Something went wrong!" });
    }
}

export const getDeltaPlots = async (req: Request, res: Response) => {
    let { site_id, timestamp, plot_ids, offset, limit } = req.body;
    let lowerBound = new Date("1970-01-01T00:00:00.000Z");
    let plotIds: number[] = [];

    if (!limit) limit = 1000;
    if (!offset) offset = 0;

    if (isValidDateString(timestamp)) lowerBound = new Date(timestamp);
    if (plot_ids && plot_ids.length > 0) plotIds = plot_ids;
    const filters = [
        { columnField: "updated_at", operatorValue: "greaterThan", value: lowerBound.toISOString() },
    ]
    if (site_id && !isNaN(site_id)) {
        filters.push({ columnField: 'site_id', operatorValue: 'equals', value: site_id })
    }

    try {
        // fetch created and updated plots after given time
        const result = await PlotRepository.getPlots(offset, limit, filters)
    
        // fetch deleted plots
        const deleted = await PlotRepository.getDeletedPlotsFromList(plotIds);
        res.status(status.success).json({ total: result.total, plots: result.results, deleted_plot_ids: deleted });
    } catch(err: any) {
        console.log("[ERROR] appV2::getDeltaPlots: ", err);
        res.status(status.error).json({ error: "Something went wrong!" });
    }
}

export const getDeltaVisits = async (req: Request, res: Response) => {
    let { timestamp, visit_ids, offset, limit } = req.body;
    let lowerBound = new Date("1970-01-01T00:00:00.000Z");
    let visitIds: number[] = [];

    if (!limit) limit = 1000;
    if (!offset) offset = 0;

    if (isValidDateString(timestamp)) lowerBound = new Date(timestamp);
    if (visit_ids && visit_ids.length > 0) visitIds = visit_ids;


    try {
        // fetch created and updated visits after given time
        const result = await VisitRepository.getVisits(offset, limit, [
            { columnField: "updated_at", operatorValue: "greaterThan", value: lowerBound.toISOString() },
        ])
    
        // fetch deleted visits
        const deleted = await VisitRepository.getDeletedVisitsFromList(visitIds);
        res.status(status.success).json({ total: result.total, visits: result.results, deleted_visit_ids: deleted });
    } catch(err: any) {
        console.log("[ERROR] appV2::getDeltaVisits: ", err);
        res.status(status.error).json({ error: "Something went wrong!" });
    }
}

export const getDeltaVisitImages = async (req: Request, res: Response) => {
    let { timestamp, visit_image_ids, offset, limit } = req.body;
    let lowerBound = new Date("1970-01-01T00:00:00.000Z");
    let visitImageIds: number[] = [];

    if (!limit) limit = 1000;
    if (!offset) offset = 0;

    if (isValidDateString(timestamp)) lowerBound = new Date(timestamp);
    if (visit_image_ids && visit_image_ids.length > 0) visitImageIds = visit_image_ids;


    try {
        // fetch created and updated visit images after given time
        const result = await VisitImagesRepository.getVisitImages(offset, limit, [
            { "created_at": { [Op.gt]: lowerBound.toISOString() } },
        ])
    
        // fetch deleted visit images
        const deleted = await VisitImagesRepository.getDeletedVisitImagesFromList(visitImageIds);
        res.status(status.success).json({ total: result.total, visit_images: result.results, deleted_visit_image_ids: deleted });
    } catch(err: any) {
        console.log("[ERROR] appV2::getDeltaVisitImages: ", err);
        res.status(status.error).json({ error: "Something went wrong!" });
    }
}

export const getDeltaTreeSnapshots = async (req: Request, res: Response) => {
    let { site_id, timestamp, tree_snapshot_ids, offset, limit } = req.body;
    let lowerBound = new Date("1970-01-01T00:00:00.000Z");
    let treeSnapshotIds: number[] = [];

    if (!limit) limit = 1000;
    if (!offset) offset = 0;

    if (isValidDateString(timestamp)) lowerBound = new Date(timestamp);
    if (tree_snapshot_ids && tree_snapshot_ids.length > 0) treeSnapshotIds = tree_snapshot_ids;
    const whereClause: WhereOptions = { "created_at": { [Op.gt]: lowerBound.toISOString() }};

    try {
        // fetch created and updated tree snapshots after given time
        const result = await TreesSnapshotRepository.getTreesSnapshots(offset, limit, whereClause)
    
        // fetch deleted tree snapshots
        const deleted = await TreesSnapshotRepository.getDeletedTreesSnapshotsFromList(treeSnapshotIds);
        res.status(status.success).json({ total: result.total, tree_snapshots: result.results, deleted_tree_snapshot_ids: deleted });
    } catch(err: any) {
        console.log("[ERROR] appV2::getDeltaTreeSnapshots: ", err);
        res.status(status.error).json({ error: "Something went wrong!" });
    }
}

export const getDeltaSyncHistories = async (req: Request, res: Response) => {
    let { user_id, timestamp, offset, limit } = req.body;
    let lowerBound = new Date("1970-01-01T00:00:00.000Z");

    if (!limit) limit = 1000;
    if (!offset) offset = 0;

    if (isValidDateString(timestamp)) lowerBound = new Date(timestamp);
    const whereClause: WhereOptions = { 
        "created_at": { [Op.gt]: lowerBound.toISOString() },
        "user_id": user_id,
    };

    try {
        const result = await SyncHistoriesRepository.getSyncHistories(offset, limit, whereClause)
        res.status(status.success).json({ total: result.total, sync_histories: result.results });
    } catch(err: any) {
        console.log("[ERROR] appV2::getDeltaSyncHistories: ", err);
        res.status(status.error).json({ error: "Something went wrong!" });
    }
}

/*
    Analytics
*/

export const treesCount = async (req: Request, res: Response) => {
    const { name } = req.query
    const year = new Date(new Date().getFullYear(), 0, 1);
    const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    try {
        const result = {
            total_trees_planted: await TreeRepository.treesCount(),
            trees_planted_this_year: await TreeRepository.treesCount({ created_at: { [Op.gte]:  year} }),
            trees_planted_this_month: await TreeRepository.treesCount({ created_at: { [Op.gte]:  month} }),
            trees_planted_by_you: name ? await TreeRepository.treesCount({ planted_by: name }) : 0,
        };
        res.status(status.success).json(result);
    } catch(err: any) {
        console.log("[ERROR] appV2::treesCount: ", err);
        res.status(status.error).json({ error: "Something went wrong!" });
    }
}

export const testUpload = async (req: Request, res: Response) => {
    console.log('[INFO]', 'appV2Controller::testUpload', 'received dummy file.')
    res.status(status.success).send();
}