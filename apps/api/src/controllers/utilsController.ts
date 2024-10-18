import { Request, Response } from "express"
import AWS from 'aws-sdk';
import axios from 'axios'
import { load } from "cheerio";
import { status } from "../helpers/status";
import { getObjectKeysForPrefix, uploadImageUrlToS3 } from "./helper/uploadtos3";
import { copyFile } from "../services/google";


export const getS3UploadSignedUrl =  async (req: Request, res: Response) => {
    const s3 = new AWS.S3({
        accessKeyId: process.env.ACCESS_KEY_ID_S3,
        secretAccessKey: process.env.SECRET_ACCESS_KEY_S3,
        region: 'ap-south-1'
    });

    s3.getSignedUrl('putObject', {
        Bucket: process.env.BUCKET_GIFT_CARDS?.split('/')[0],
        Key: process.env.BUCKET_GIFT_CARDS?.split('/')[1] + "/" + req.params.requestId + "/" + req.query.filename,
        Expires: 120
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

    const { data: html } = await axios.get(url);
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
        const imageName = imageUrl.split('/').slice(-1)[0];
        const location = await uploadImageUrlToS3(imageUrl, `gift-card-requests/${requestId}/${imageName}`)
        if (location) s3Urls.push(location);
    }

    res.status(status.success).send({
        urls: s3Urls
    })
}

export const getImageUrlsForKeyPrefix = async (req: Request, res: Response) => {
    const { request_id: requestId } = req.params;
    const prefix = `gift-card-requests/${requestId}/`


    const {keys, bucket} = await getObjectKeysForPrefix(prefix)

    res.status(status.success).send({ urls: keys.filter(key => !key.endsWith('.csv')).map(key => `https://${bucket}.s3.amazonaws.com/` + key) })
}