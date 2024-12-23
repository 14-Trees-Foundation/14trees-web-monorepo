import { google } from 'googleapis';
import { Readable } from 'stream';

const KEY_FILE_PATH = process.env.GOOGLE_APP_CREDENTIALS || ''

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'],
});

// Initialize the Google Drive API
const drive = google.drive({ version: 'v3', auth });

export async function copyFile(fileId: string, fileName: string): Promise<string> {
    const response = await drive.files.copy({
        fileId: fileId,
        requestBody: {
            name: fileName,
            parents: ['1k-3bfz7ReFyYWWXytYlNGsiz09cq1r2B']
        },
    });

    if (!response.data.id) {
        throw new Error('Failed to create a file copy!')
    }

    const newFileId = response.data.id;

    await drive.permissions.create({
        fileId: newFileId,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    for (const email of ['admin@14trees.org', 'contact@14trees.org', 'vivayush@gmail.com']) {
        await drive.permissions.create({
            fileId: newFileId,
            requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: email,
            },
            sendNotificationEmail: false,
        });
    }

    return newFileId;
}

export async function downloadSlide(fileId: string, mimeType: string): Promise<Buffer> {
    const response = await drive.files.export(
        {
            fileId,
            mimeType,
        },
        { responseType: 'stream' }
    );

    const chunks: Buffer[] = [];
    const stream = response.data as Readable;

    // Accumulate the data chunks
    return new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (error) => reject(error));
    });
}

export async function downloadFile(fileId: string): Promise<Readable> {
    const response = await drive.files.get(
        {
            fileId,
            alt: 'media',
        },
        { responseType: 'stream' }
    );

    return response.data as Readable;
}