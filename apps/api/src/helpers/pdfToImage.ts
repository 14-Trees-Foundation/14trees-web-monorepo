import { fromBuffer } from "pdf2pic";
import { uploadFileToS3 } from "../controllers/helper/uploadtos3";
import { Readable } from "stream";
import { Convert } from "pdf2pic/dist/types/convert";
import runWithConcurrency, { Task } from "./consurrency";

// sudo dnf install ghostscript
// sudo dnf install graphicsmagick

const extractImage = async (convert: Convert, s3Key: string, result: any, page: number) => {
    try {
        const resp = await convert(page, { responseType: 'base64' })
        // Buffer to readable
        if (resp.base64) {
            const buffer = Buffer.from(resp.base64, 'base64');
            const readableStream = new Readable();
            readableStream.push(buffer);
            readableStream.push(null); // Indicates the end of the stream

            const location = await uploadFileToS3('cards', readableStream, s3Key);
            result[s3Key] = location;
        }

    } catch (error) {
        console.log(error);
        result[s3Key] = false;
    }
}


export const convertPdfToImage = async (pdfData: Buffer, s3Keys: string[]) => {
    const options = {
        quality: 100,
        density: 200,
        savePath: "/home/onrush-dev/Downloads",
        format: "png",
        width: 1600,
        height: 1200
    };
    const convert = fromBuffer(pdfData, options);
    
    const result: any = {};
    const tasks: Task<void>[] = []
    for (let i = 0; i < s3Keys.length; i++) {
        tasks.push(() => extractImage(convert, s3Keys[i], result, i+1));
    }

    await runWithConcurrency(tasks, 50);
    return result;
}