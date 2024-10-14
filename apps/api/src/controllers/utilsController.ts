import { Request, Response } from "express"
import AWS from 'aws-sdk';


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