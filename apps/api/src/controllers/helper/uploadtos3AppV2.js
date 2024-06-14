const fs = require("fs");
const AWS = require('aws-sdk');
import { base64ToReadableStream } from "../../helpers/utilsAppV2";
const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID_S3,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_S3
});

export const uploadBase64DataToS3 = async (filename, type, base64data, meta, folder_name = "") => {
    const readStream = base64ToReadableStream(base64data);
    const bucket = getBucketFromTypeAndFolderName(type, folder_name);
    const params = {
        Bucket: bucket,
        Key: filename,
        Body: readStream,
        Metadata: meta
    };

    const response = {
        success: false,
        location: '',
        error: {},
    }
    try {

        let res = await s3.upload(params).promise();

        response.success = true;
        response.location = res.Location;
    } catch (error) {
        response.success = false;
        response.error = error;
    }
    return response;
}

function getBucketFromTypeAndFolderName(type, folder_name) {
    let bucket;
    if (type === "treetype") {
        bucket = process.env.BUCKET_TREE_TYPES;
    } else if (type === "users") {
        bucket = process.env.BUCKET_USERS;
    } else if (type === "memories") {
        bucket = process.env.BUCKET_MEMORIES;
    } else if (type === "activities") {
        bucket = process.env.ACTIVITY_MEMORIES;
    } else if (type === 'trees') {
        bucket = process.env.BUCKET_TREES;
    } else if (type === 'ponds') {
        bucket = process.env.BUCKET_PONDS + "/" + folder_name;
    } else if (type === 'albums') {
        bucket = process.env.BUCKET_MEMORIES + "/" + folder_name;
    } else if (type === 'logos') {
        bucket = process.env.BUCKET_LOGOS;
    } else if (type === 'tree_update') {
        bucket = process.env.BUCKET_TREE_UPDATE;
    }
    return bucket;
}
function getObjectKeyFromURL(url) {
    url = decodeURIComponent(url);//get rid of uri encoding: %20, etc.
    url = url.split('https://')[1];//trim https:// off.
    const key = url.split('/').slice(1,).join('/');//trim away domain name.
    return key;

}
function getBaseBucket(bucket) {
    return bucket.split('/')[0];
}

export const deleteFileByUrl = async (s3FileUrl, type, folder_name = "") => {
    const response = {
        success: false,
        error: null,
    }
    try {
        const bucket = getBaseBucket(getBucketFromTypeAndFolderName(type, folder_name));
        let objectKey = getObjectKeyFromURL(s3FileUrl);
        // console.log('to delete: ',bucket,objectKey)
        const deleteResponse = await s3.deleteObject({ Bucket: bucket, Key: objectKey }).promise()
        // console.log(deleteResponse)
        response.success = true;
        return response;
    }
    catch (err) {
        response.success = false;
        response.error = err;
    }
    return response;
}
const emptyImageMetaData = {
    capturetimestamp: (new Date(0)).toISOString(),//default date to start of time.
    remark: ''
}
export const attachMetaData = async (images, type, folder_name = "") => {
    let ans = [];

    for (let imageURL of images) {
        const bucket = getBaseBucket(getBucketFromTypeAndFolderName(type, folder_name));
        let objectKey = getObjectKeyFromURL(imageURL);
        try {
            const updated = {
                name: imageURL,
                meta: emptyImageMetaData
            }
            const data = await s3.headObject({ Bucket: bucket, Key: objectKey }).promise();
            const metaData = data.Metadata;
            if (metaData && Object.keys(metaData).length > 0) {
                updated.meta = metaData;
            }
            ans.push(updated)
        }
        catch (err) {
            console.log('s3 meta data error: ', err);
            //TODO study errors as they occur and code.
        }
    }
    return ans;
}