import { Request, Response } from "express"
import AWS from 'aws-sdk';
import axios from 'axios'
import { load } from "cheerio";
import { status } from "../helpers/status";
import { getObjectKeysForPrefix, uploadImageUrlToS3 } from "./helper/uploadtos3";
import { processDonationRequestSheet, revertDonationRequestSheet } from "../scripts/donationRequests";

const getObjectKey = (type: string, subKey: string) => {
    switch (type) {
        case 'gift-request':
            return `cards/${subKey}`
        case 'payment':
            return `payments/${subKey}`
        default:
            return ''
    }
}

export const getS3UploadSignedUrl = async (req: Request, res: Response) => {
    const query = req.query;
    const key = query.key as string;
    const objectType = query.type as string;
    const objectKey = getObjectKey(objectType, key);
    if (!key || !objectType || !objectKey) {
        res.status(status.bad).send({
            status: status.bad,
            message: 'Invalid key or type!'
        })
        return;
    }

    const s3 = new AWS.S3({
        accessKeyId: process.env.ACCESS_KEY_ID_S3,
        secretAccessKey: process.env.SECRET_ACCESS_KEY_S3,
        region: 'ap-south-1'
    });

    s3.getSignedUrl('putObject', {
        Bucket: process.env.BUCKET_GIFT_CARDS?.split('/')[0],
        Key: objectKey,
        Expires: 120 // 2 mins
    }, (err, url) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        return res.json({ url });
    })

}

export const scrapImages = async (req: Request, res: Response) => {
    const { url, request_id: requestId } = req.body;

    if (!url || !requestId || !url.startsWith('https://')) {
        res.status(status.bad).send({
            status: status.bad,
            message: 'Invalid request!'
        })
        return;
    }

    let html: any;
    try {
        const { data } = await axios.get(url);
        html = data;
    } catch (error) {
        console.log("[ERROR]", "UtilsController::scrapImages", error);
        res.status(status.bad).send({
            message: "Failed to load page! Is the webpage publicly accessible?",
        });
        return;
    }
    try {

        const $ = load(html);
        const imageUrls: string[] = [];
        $('img').each((_, element) => {
            const src = $(element).attr('src');
            if (src) {
                const fullUrl = new URL(src, url).href;
                imageUrls.push(fullUrl);
            }
        });

        const s3Urls: string[] = [];
        for (const imageUrl of imageUrls) {
            try {
                const headResponse = await axios.head(imageUrl);
                const contentType = headResponse.headers['content-type'];
                // Check if the Content-Type is an image
                if (contentType && contentType.startsWith('image/')) {
                    const imageName = imageUrl.split('/').slice(-1)[0];
                    const location = await uploadImageUrlToS3(imageUrl, `cards/${requestId}/${imageName}`)
                    if (location) s3Urls.push(location);
                }
            } catch (error) {
                console.log("[ERROR]", "UtilsController::scrapImages", error);
            }
        }

        res.status(status.success).send({
            urls: s3Urls
        })
    } catch (error) {
        console.log("[ERROR]", "UtilsController::scrapImages", error);
        res.status(status.error).send({
            message: "Error while scrapping images!",
        });
    }
}

export const getImageUrlsForKeyPrefix = async (req: Request, res: Response) => {
    const { request_id: requestId } = req.params;
    const prefix = `cards/${requestId}/`


    const { keys, bucket } = await getObjectKeysForPrefix(prefix)

    res.status(status.success).send({ urls: keys.filter(key => !key.endsWith('.csv')).map(key => `https://${bucket}.s3.amazonaws.com/` + key) })
}

export const handleDonationSheetRequests = async (req: Request, res: Response) => {
    const { spreadsheetId } = req.body;
    if (!spreadsheetId) {
        res.status(status.bad).send({ message: "Invalid spreadsheetId." });
        return;
    }
    res.status(status.created).send("Processing your request!");

    await processDonationRequestSheet(spreadsheetId);
}

export const handleRevertDonationSheetRequests = async (req: Request, res: Response) => {
    const { spreadsheetId } = req.body;
    if (!spreadsheetId) {
        res.status(status.bad).send({ message: "Invalid spreadsheetId." });
        return;
    }
    res.status(status.created).send("Processing your request!");

    await revertDonationRequestSheet(spreadsheetId);
}
