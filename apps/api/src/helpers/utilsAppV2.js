import { status } from './status';
const { Readable } = require('stream');

export const base64ToReadableStream = function base64ToReadableStream(base64Data) {
    const buffer = Buffer.from(base64Data, 'base64');
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null); // Indicates the end of the stream
    return readableStream;
}

export const outerTryCatch = async function (res, task) {
    try {
        await task();
        //task is expected to return a response.
    }
    catch (err) {
        console.log("error found: ", err);
        res.status(status.error).send({ taskName: res.req.route.path, error: err })
    }
}