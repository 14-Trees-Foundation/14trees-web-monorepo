import { Request } from 'express';
import multer, { StorageEngine } from 'multer';

require("dotenv").config();

const destImg = process.env.DEST_IMG_FOLDER ?? "images";

const storage: StorageEngine = multer.diskStorage({
    destination: (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => {
        cb(null, destImg);
    },
    filename: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
        cb(null, file.originalname);
    }
});

export default multer({ storage });
