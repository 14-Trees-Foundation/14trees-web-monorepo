const ActivityModel = require("../models/activity");

const uploadHelper = require("./helper/uploadtos3");
const csvhelper = require("./helper/uploadtocsv");
const { errorMessage, successMessage, status } = require("../helpers/status");

module.exports.getActivity = async (req, res) => {
    try {
        let result = await ActivityModel.find();
        res.status(status.success).send(result);
    } catch (error) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

module.exports.addActivity = async (req, res) => {

    try {
        if (!req.body.title) {
            throw new Error("Title required");
        }
        if (!req.body.type) {
            throw new Error("Activity Type required");
        }
        if (!req.body.date) {
            throw new Error("Date required");
        }
        if (!req.body.desc) {
            throw new Error("Activity Description required");
        }
    } catch (error) {
        res.status(status.bad).send({ error: error.message });
        return;
    }

    // Upload images to S3
    let images;
    let imageurls = [];
    if (req.body.images.length > 0) {
        images = req.body.images.split(',');
        for (const image in images) {
            await uploadHelper.UploadFileToS3(images[image], 'activities')
        }
        // Save the urls with S3 location prefixed for each image
        const s3url = "https://14treesplants.s3.ap-south-1.amazonaws.com/activities/";
        imageurls = images.map(x => s3url + x);
    }

    // Activity object to be saved in database
    let actObj = {
        title: req.body.title,
        type: req.body.type,
        date: req.body.date === "" ? new Date().toISOString() : new Date(req.body.date),
        desc: req.body.desc,
        author: req.body.author,
        video: req.body.videolink ? req.body.videolink : null,
        images: imageurls
    }
    const activity = new ActivityModel(actObj);

    let actRes;
    try {
        actRes = await activity.save();
    } catch (error) {
        res.status(status.error).send({
            error: error
        });
        return;
    }

    // Save the info into the sheet
    try {
        csvhelper.UpdateActivityCsv(actObj);
        res.status(status.created).send({
            activity: actRes,
            csvupload: "Success"
        });
    } catch (error) {
        res.status(status.error).send({
            activity: actRes,
            csvupload: "Failure"
        });
    }
}