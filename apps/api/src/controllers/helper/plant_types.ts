import { downloadFile } from "../../services/google"
import { uploadFileToS3 } from "./uploadtos3";


export const streamIllustrationToS3 = async (driveLink: string, key: string) => {

    const fileId = driveLink.split('/d/')[1].split('/')[0]
    if (!fileId) {
        throw new Error('File ID not found')
    }

    const resp = await downloadFile(fileId);

    return await uploadFileToS3('trees', resp, key)
}