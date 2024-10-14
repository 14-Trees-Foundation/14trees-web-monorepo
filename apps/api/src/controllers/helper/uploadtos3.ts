import fs from "fs";
import axios from 'axios';
import AWS from 'aws-sdk';
import { Readable } from 'stream';
import { removeSpecialCharacters } from "../../helpers/utils";
const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID_S3,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_S3
});

var destImg = process.env.DEST_IMG_FOLDER;

function getNewUploadObjectKey(objectName: string) {
    return Date.now().toString() + "_" + removeSpecialCharacters(objectName);
}

export const UploadFileToS3 = async (filename: string, type: string, folder_name: string = ""): Promise<string> => {
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
    } else if (type === 'sites') {
        bucket = process.env.BUCKET_TREES + "/" + folder_name
    } else if (type === 'ponds') {
        bucket = process.env.BUCKET_PONDS + "/" + folder_name
    } else if (type === 'albums') {
        bucket = process.env.BUCKET_MEMORIES + "/" + folder_name
    } else if (type === 'gift_cards') {
        bucket = process.env.BUCKET_GIFT_CARDS + "/" + folder_name
    } else if (type === 'tree_update') {
        bucket = process.env.BUCKET_TREE_UPDATE
    }

    if (!bucket) {
        console.log("[ERROR] UploadFileToS3: bucket not found for type: ", type);
        return "";
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

export const base64ToReadableStream = function base64ToReadableStream(base64Data: any) {
    const buffer = Buffer.from(base64Data, 'base64');
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null); // Indicates the end of the stream
    return readableStream;
}

export const uploadBase64DataToS3 = async (filename: string, type: string, base64data: any, meta: any, folder_name = "") => {
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
        error: {} as any,
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

function getBucketFromTypeAndFolderName(type: string, folder_name: string) {
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
    } else if (type === 'visits') {
        bucket = process.env.BUCKET_MEMORIES + "/" + folder_name;
    } else if (type === 'logos') {
        bucket = process.env.BUCKET_LOGOS;
    } else if (type === 'tree_update') {
        bucket = process.env.BUCKET_TREE_UPDATE;
    } else if (type === 'cards') {
        bucket = process.env.BUCKET_CARDS;
    }
    return bucket as string;
}
function getObjectKeyFromURL(url: string) {
    url = decodeURIComponent(url);//get rid of uri encoding: %20, etc.
    url = url.split('https://')[1];//trim https:// off.
    const key = url.split('/').slice(1,).join('/');//trim away domain name.
    return key;

}
function getBaseBucket(bucket: string) {
    return bucket.split('/')[0];
}

export const deleteFileByUrl = async (s3FileUrl: string, type: string, folder_name = "") => {
    const response = {
        success: false,
        error: null as any,
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

export const attachMetaData = async (imageURL: string, type: string, folder_name = "") => {
    let ans = [];

    const bucket = getBaseBucket(getBucketFromTypeAndFolderName(type, folder_name));
    let objectKey = getObjectKeyFromURL(imageURL);
    try {
        const updated = {
            name: imageURL,
            meta: emptyImageMetaData as any
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
    return ans;
}

export async function uploadCardTemplateToS3(
    cardUrl: string,
    saplingId: string,
): Promise<string> {
    try {
        const bucketName = getBucketFromTypeAndFolderName('trees', '');
        const imageResponse = await axios.get(cardUrl, {
            responseType: 'arraybuffer', // Download as binary data
        });

        // Generate a unique file name for the thumbnail
        const fileName = `thumbnails/${saplingId}.jpg`;

        // Step 3: Upload the image to S3
        const uploadParams = {
            Bucket: bucketName,
            Key: fileName,
            Body: imageResponse.data,
            ContentType: 'image/jpeg',
            ACL: 'public-read',
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        console.log('File uploaded successfully:', uploadResult.Location);

        return uploadResult.Location;
    } catch (error) {
        console.error('Error uploading slide thumbnail to S3:', error);
        throw error;
    }
}