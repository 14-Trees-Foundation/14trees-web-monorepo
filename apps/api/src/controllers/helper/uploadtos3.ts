const fs = require("fs");
const AWS = require('aws-sdk');
const { removeSpecialCharacters } = require("../../helpers/utils");
const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID_S3,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_S3
});

var destImg = process.env.DEST_IMG_FOLDER;

function getNewUploadObjectKey(objectName: string) {
    return Date.now().toString() + "_" + removeSpecialCharacters(objectName);
}

export const UploadFileToS3 = async (filename: string, type: string, folder_name :string = "") => {
    const readStream = fs.createReadStream(destImg + filename);
    let bucket;

    if (type === "plant_type") {
        bucket = process.env.BUCKET_PLANT_TYPES
    } else if (type === "users") {
        bucket = process.env.BUCKET_USERS
    } else if (type === "memories") {
        bucket = process.env.BUCKET_MEMORIES
    } else if (type === "activities") {
        bucket = process.env.ACTIVITY_MEMORIES
    } else if (type === 'trees') {
        bucket = process.env.BUCKET_TREES
    } else if (type === 'ponds') {
        bucket = process.env.BUCKET_PONDS + "/" + folder_name
    } else if (type === 'albums') {
        bucket = process.env.BUCKET_MEMORIES + "/" + folder_name
    } else if (type === 'logos') {
        bucket = process.env.BUCKET_LOGOS
    } else if (type === 'tree_update') {
        bucket = process.env.BUCKET_TREE_UPDATE
    }

    const params = {
        Bucket: bucket,
        Key: getNewUploadObjectKey(filename),
        Body: readStream
    };

    try {
        let res = await s3.upload(params).promise();
        return res.Location;
    } catch (err) {
        console.error("Failed to upload file to s3 bucket. ", err);
        return ""
    }
}