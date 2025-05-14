import { google, sheets_v4, docs_v1 } from 'googleapis';
import path from 'path';
import * as fs from 'fs';
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

export async function downloadSlide(fileId: string, mimeType: string): Promise<Readable> {
    const response = await drive.files.export(
        {
            fileId,
            mimeType,
        },
        { responseType: 'stream' }
    );

    // const chunks: Buffer[] = [];
    return response.data as Readable;

    // Accumulate the data chunks
    // return new Promise<Buffer>((resolve, reject) => {
    //     stream.on('data', (chunk) => chunks.push(chunk));
    //     stream.on('end', () => resolve(Buffer.concat(chunks)));
    //     stream.on('error', (error) => reject(error));
    // });
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

export class GoogleSpreadsheet {
    private sheets: sheets_v4.Sheets;

    constructor() {
        // Load service account credentials
        const credentialsPath = path.resolve(process.env.GOOGLE_APP_CREDENTIALS || '');
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
    }


    public async getSpreadsheetData(spreadsheetId: string, sheetName: string) {
        // Read existing sheet data
        return await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: sheetName,
        }).catch(error => {
            if (error?.response?.data) {
                console.log(JSON.stringify(error.response.data));
            } else {
                console.log(error);
            }
        });
    }

    public async insertRowData(spreadsheetId: string, sheetName: string, rowData: string[]) {
        try {
            await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: sheetName,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: [rowData],
                },
            });
            console.log("Row inserted successfully.");
        } catch (error: any) {
            if (error?.response?.data) {
                console.log("Insert error:", JSON.stringify(error.response.data));
            } else {
                console.log("Insert error:", error);
            }
        }
    }



    public async updateRowDataInSheet(spreadsheetId: string, sheetName: string, updatedValues: string[][]) {
        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: updatedValues,
            },
        });
    }
}

export class GoogleDoc {
    private docs: docs_v1.Docs;

    constructor() {
        // Load service account credentials
        const credentialsPath = path.resolve(process.env.GOOGLE_APP_CREDENTIALS || '');
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: [
                'https://www.googleapis.com/auth/documents',
            ],
        });

        this.docs = google.docs({ version: 'v1', auth });
    }

    public async get80GRecieptFileId(data: any, fileName: string) {

        const copiedDocId = await copyFile("1s9xCuSDICsrmX73lKar59CCIGcPob4v-Yaty4bT8OCk", fileName);

        const requests: any[] = Object.entries(data).map(([key, value]) => ({
            replaceAllText: {
                containsText: {
                    text: key,
                    matchCase: true,
                },
                replaceText: value,
            },
        }));

        await this.docs.documents.batchUpdate({
            documentId: copiedDocId,
            requestBody: { requests },
        });

        return copiedDocId;
    }

    public async download(fileId: string) {
        const response = await drive.files.export(
            {
                fileId,
                mimeType: "application/pdf",
            },
            { responseType: 'stream' }
        );
    
        // const chunks: Buffer[] = [];
        return response.data as Readable;
    }
}