import { google, sheets_v4, docs_v1 } from 'googleapis';
import path from 'path';
import * as fs from 'fs';
import { Readable } from 'stream';

const KEY_FILE_PATH = process.env.GOOGLE_APP_CREDENTIALS || ''

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    clientOptions: {
        subject: 'dashboard@14trees.org'
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
});

// Initialize the Google Drive API
const drive = google.drive({ version: 'v3', auth });

export async function copyFile(fileId: string, fileName: string): Promise<string> {
    const response = await drive.files.copy({
        fileId: fileId,
        requestBody: {
            name: fileName,
            parents: ['1T_mBriFGk7hD7fxLqVeX22I8IGCiHYtC']
        },
    });

    if (!response.data.id) {
        throw new Error('Failed to create a file copy!')
    }

    const newFileId = response.data.id;

    await drive.permissions.create({
        fileId: newFileId,
        requestBody: {
            role: 'owner',
            type: 'user',
            emailAddress: 'dashboard@14trees.org',
        },
        transferOwnership: true,
    });

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
    private sheets: sheets_v4.Sheets | null = null;
    private isDevelopment: boolean;

    constructor() {
        // Check if we're in development mode
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        
        // Load service account credentials
        const credentialsPath = path.resolve(process.env.GOOGLE_APP_CREDENTIALS || '');
        
        if (!credentialsPath || !fs.existsSync(credentialsPath)) {
            if (this.isDevelopment) {
                console.log(`[WARN] Google credentials file not found at: ${credentialsPath}. Running in development mode - Google Sheets operations will be skipped.`);
                return; // Skip initialization in development
            } else {
                throw new Error(`Google credentials file not found at: ${credentialsPath}. Please check GOOGLE_APP_CREDENTIALS environment variable.`);
            }
        }
        
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            subject: 'dashboard@14trees.org',
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
    }


    public async getSpreadsheetData(spreadsheetId: string, sheetName: string) {
        if (this.isDevelopment && !this.sheets) {
            console.log(`[DEV] Skipping getSpreadsheetData for ${spreadsheetId}/${sheetName} - running in development mode`);
            return null;
        }
        
        // Read existing sheet data
        return await this.sheets!.spreadsheets.values.get({
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
        if (this.isDevelopment && !this.sheets) {
            console.log(`[DEV] Skipping insertRowData for ${spreadsheetId}/${sheetName} - running in development mode`);
            console.log(`[DEV] Would insert row:`, rowData);
            return;
        }
        
        try {
            await this.sheets!.spreadsheets.values.append({
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

    public async insertRowsData(spreadsheetId: string, sheetName: string, rowData: string[][]) {
        if (this.isDevelopment && !this.sheets) {
            console.log(`[DEV] Skipping insertRowsData for ${spreadsheetId}/${sheetName} - running in development mode`);
            console.log(`[DEV] Would insert rows:`, rowData);
            return;
        }
        
        try {
            await this.sheets!.spreadsheets.values.append({
                spreadsheetId,
                range: sheetName,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: rowData,
                },
            });
        } catch (error: any) {
            if (error?.response?.data) {
                console.log("Insert error:", JSON.stringify(error.response.data));
            } else {
                console.log("Insert error:", error);
            }
        }
    }

    public async updateRowDataInSheet(spreadsheetId: string, sheetName: string, updatedValues: string[][]) {
        if (this.isDevelopment && !this.sheets) {
            console.log(`[DEV] Skipping updateRowDataInSheet for ${spreadsheetId}/${sheetName} - running in development mode`);
            console.log(`[DEV] Would update with values:`, updatedValues);
            return;
        }
        
        await this.sheets!.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: updatedValues,
            },
        });
    }

    /**
     * Fetches a specific row from a spreadsheet based on a value in a specific column
     * @param spreadsheetId The ID of the spreadsheet
     * @param sheetName The name of the sheet
     * @param columnName The name of the column to match against
     * @param valueToMatch The value to match in the specified column
     * @returns The matching row as an array of values, or null if no match is found
     */
    public async getRowByColumnValue(
        spreadsheetId: string, 
        sheetName: string, 
        columnName: string, 
        valueToMatch: string
    ): Promise<{ rowData: string[], rowIndex: number } | null> {
        if (this.isDevelopment && !this.sheets) {
            console.log(`[DEV] Skipping getRowByColumnValue for ${spreadsheetId}/${sheetName} - running in development mode`);
            console.log(`[DEV] Would search for ${columnName}=${valueToMatch}`);
            return null;
        }
        
        try {
            // Get all data from the sheet
            const response = await this.sheets!.spreadsheets.values.get({
                spreadsheetId,
                range: sheetName,
            });

            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                console.log("No data found in the spreadsheet.");
                return null;
            }

            // Get the header row to find the column index
            const headers = rows[0];
            const columnIndex = headers.findIndex(
                (header: string) => header.trim().toLowerCase() === columnName.trim().toLowerCase()
            );

            if (columnIndex === -1) {
                console.log(`Column "${columnName}" not found in the spreadsheet.`);
                return null;
            }

            // Find the row with the matching value in the specified column
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row[columnIndex] === valueToMatch) {
                    return { rowData: row, rowIndex: i + 1 }; // +1 because Google Sheets is 1-indexed
                }
            }

            console.log(`No row found with value "${valueToMatch}" in column "${columnName}".`);
            return null;
        } catch (error: any) {
            if (error?.response?.data) {
                console.log("Error fetching row:", JSON.stringify(error.response.data));
            } else {
                console.log("Error fetching row:", error);
            }
            return null;
        }
    }
    
    /**
     * Updates specific cells in a row identified by a matching value in a specific column
     * @param spreadsheetId The ID of the spreadsheet
     * @param sheetName The name of the sheet
     * @param identifyColumnName The name of the column to match against for identifying the row
     * @param identifyValue The value to match in the identifying column
     * @param updateValues An object where keys are column names and values are the new values to set
     * @returns Boolean indicating success or failure
     */
    public async updateRowCellsByColumnValue(
        spreadsheetId: string,
        sheetName: string,
        identifyColumnName: string,
        identifyValue: string,
        updateValues: Record<string, string>
    ): Promise<boolean> {
        if (this.isDevelopment && !this.sheets) {
            console.log(`[DEV] Skipping updateRowCellsByColumnValue for ${spreadsheetId}/${sheetName} - running in development mode`);
            console.log(`[DEV] Would update row where ${identifyColumnName}=${identifyValue} with:`, updateValues);
            return true; // Return success in development mode
        }
        
        try {
            // First, get all data from the sheet to find the row and headers
            const response = await this.sheets!.spreadsheets.values.get({
                spreadsheetId,
                range: sheetName,
            });

            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                console.log("No data found in the spreadsheet.");
                return false;
            }

            // Get the header row
            const headers = rows[0];
            
            // Find the column index for identification
            const identifyColumnIndex = headers.findIndex(
                (header: string) => header.trim().toLowerCase() === identifyColumnName.trim().toLowerCase()
            );

            if (identifyColumnIndex === -1) {
                console.log(`Identify column "${identifyColumnName}" not found in the spreadsheet.`);
                return false;
            }

            // Find the row with the matching value
            let rowIndex = -1;
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row[identifyColumnIndex] === identifyValue) {
                    rowIndex = i + 1; // +1 because Google Sheets is 1-indexed
                    break;
                }
            }

            if (rowIndex === -1) {
                console.log(`No row found with value "${identifyValue}" in column "${identifyColumnName}".`);
                return false;
            }

            // Create a map of column indices to update
            const updateMap: Record<number, string> = {};
            for (const [columnName, newValue] of Object.entries(updateValues)) {
                const columnIndex = headers.findIndex(
                    (header: string) => header.trim().toLowerCase() === columnName.trim().toLowerCase()
                );
                
                if (columnIndex === -1) {
                    console.log(`Update column "${columnName}" not found in the spreadsheet.`);
                    continue;
                }
                
                updateMap[columnIndex] = newValue;
            }

            if (Object.keys(updateMap).length === 0) {
                console.log("No valid columns to update.");
                return false;
            }

            // Get the current row data
            const currentRow = rows[rowIndex - 1]; // -1 to convert back to 0-indexed for the array
            
            // Create the updated row by applying changes
            const updatedRow = [...currentRow];
            for (const [columnIndex, newValue] of Object.entries(updateMap)) {
                updatedRow[parseInt(columnIndex)] = newValue;
            }

            // Update the specific row
            if (!this.sheets) {
                throw new Error('Google Sheets service not initialized');
            }
            
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A${rowIndex}:${this.columnToLetter(headers.length)}${rowIndex}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [updatedRow],
                },
            });

            console.log(`Row ${rowIndex} updated successfully.`);
            return true;
        } catch (error: any) {
            if (error?.response?.data) {
                console.log("Update error:", JSON.stringify(error.response.data));
            } else {
                console.log("Update error:", error);
            }
            return false;
        }
    }
    
    /**
     * Converts a column number to a letter reference (e.g., 1 -> A, 27 -> AA)
     * @param columnNumber The column number (1-indexed)
     * @returns The column letter reference
     */
    private columnToLetter(columnNumber: number): string {
        let dividend = columnNumber;
        let columnName = '';
        let modulo;

        while (dividend > 0) {
            modulo = (dividend - 1) % 26;
            columnName = String.fromCharCode(65 + modulo) + columnName;
            dividend = Math.floor((dividend - modulo) / 26);
        }

        return columnName;
    }
}

export class GoogleDoc {
    private docs: docs_v1.Docs | null = null;
    private isDevelopment: boolean;

    constructor() {
        // Check if we're in development mode
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        
        // Load service account credentials
        const credentialsPath = path.resolve(process.env.GOOGLE_APP_CREDENTIALS || '');
        
        if (!credentialsPath || !fs.existsSync(credentialsPath)) {
            if (this.isDevelopment) {
                console.log(`[WARN] Google credentials file not found at: ${credentialsPath}. Running in development mode - Google Docs operations will be skipped.`);
                return; // Skip initialization in development
            } else {
                throw new Error(`Google credentials file not found at: ${credentialsPath}. Please check GOOGLE_APP_CREDENTIALS environment variable.`);
            }
        }
        
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            subject: 'dashboard@14trees.org',
            scopes: [
                'https://www.googleapis.com/auth/documents',
            ],
        });

        this.docs = google.docs({ version: 'v1', auth });
    }

    public async get80GRecieptFileId(data: any, fileName: string) {
        if (this.isDevelopment && !this.docs) {
            console.log(`[DEV] Skipping get80GRecieptFileId for ${fileName} - running in development mode`);
            console.log(`[DEV] Would create document with data:`, data);
            return 'dev-mock-file-id';
        }

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

        await this.docs!.documents.batchUpdate({
            documentId: copiedDocId,
            requestBody: { requests },
        });

        return copiedDocId;
    }

    public async download(fileId: string) {
        if (this.isDevelopment && !this.docs) {
            console.log(`[DEV] Skipping download for ${fileId} - running in development mode`);
            // Return a mock readable stream for development
            const { Readable } = require('stream');
            return new Readable({
                read() {
                    this.push('Mock PDF content for development');
                    this.push(null);
                }
            });
        }
        
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