import { google, sheets_v4 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { getUniqueRequestId } from '../helpers/utils';
import { UserRepository } from '../repo/userRepo';
import { GiftCardRequestCreationAttributes, GiftCardRequestStatus } from '../models/gift_card_request';
import { GiftCardsRepository } from '../repo/giftCardsRepo';

export const defaultGiftMessages = {
    primary: 'We are immensely delighted to share that a tree has been planted in your name at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, rejuvenating ecosystems, supporting biodiversity, and helping offset the harmful effects of climate change.',
    birthday: 'We are immensely delighted to share that a tree has been planted in your name on the occasion of your birthday at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, helping offset the harmful effects of climate change.',
    memorial: 'A tree has been planted in the memory of <name here> at the 14 Trees Foundation reforestation site. For many years, this tree will help rejuvenate local ecosystems, support local biodiversity and offset the harmful effects of climate change and global warming.',
    secondary: 'We invite you to visit 14 Trees and firsthand experience the growth and contribution of your tree towards a greener future.',
    logo: 'Gifted by 14 Trees in partnership with'
}


interface ProcessOptions {
    spreadsheetId: string;
    sheetName: string;
    processRow: (row: any) => Promise<Record<string, any>>; // Return the updated value for the column
    extraColumns: string[];
}

export async function processAndUpdateSheet(options: ProcessOptions): Promise<void> {
    const { spreadsheetId, sheetName, processRow, extraColumns } = options;

    // Load service account credentials
    const credentialsPath = path.resolve(process.env.GOOGLE_APP_CREDENTIALS || '');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Read existing sheet data
    const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetName,
    }).catch(error => {
        if (error?.response?.data) {
            console.log(JSON.stringify(error.response.data));
        } else {
            console.log(error);
        }
    });

    if (!getRes) return;

    const rows = getRes.data.values;
    if (!rows || rows.length === 0) {
        console.log('No data found.');
        return;
    }

    const extraColumnIdxs: Record<string, number> = {};
    const headerRow = rows[0];
    for (const columnToUpdate of extraColumns) {
        let columnIndex = headerRow.indexOf(columnToUpdate);

        // If the column does not exist, add it at the end
        if (columnIndex === -1) {
            columnIndex = headerRow.length;
            headerRow.push(columnToUpdate);
        }
        extraColumnIdxs[columnToUpdate] = columnIndex;
    }
    rows[0] = headerRow;

    // Update each row with processed value
    const updatedValues: string[][] = [headerRow];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        const rowData: any = {};
        headerRow.forEach((header, idx) => {
            if (idx < row.length) rowData[header] = row[idx];
            else rowData[header] = null;
        })
        const processedValue = await processRow(rowData);

        for (const [column, value] of Object.entries(processedValue)) {

            const columnIndex = extraColumnIdxs[column];
            while (row.length <= columnIndex) {
                row.push('');
            }
            row[columnIndex] = value;
        }

        updatedValues.push(row);
        console.log("Processoed row number:", i);
    }

    // Write updated values back to the sheet
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}`,
        valueInputOption: 'RAW',
        requestBody: {
            values: updatedValues,
        },
    });

    console.log('Sheet updated successfully.');
}

async function processDonationData(data: any): Promise<number | string> {


    const requestId = getUniqueRequestId();

    const sponsorName = data["Name"];
    const sponsorEmail = data["Email"];
    const sponsorPhone = data["Contact phone number"];
    if (!sponsorName || !sponsorEmail) {
        return 'Missing Sponsor name or email.';
    }
    // create sponsorUser
    const user = await UserRepository.upsertUser({ name: sponsorName, email: sponsorEmail, phone: sponsorPhone });

    const treesCountStr = data["Number of trees I would like to support."];
    if (!treesCountStr || isNaN(parseInt(treesCountStr))) {
        return 'Invalid number of sponsored trees.'
    }

    const receiptNum = data["Donation receipt number"];
    const donationReceiptNumber = receiptNum && receiptNum !== "NA" ? receiptNum : null;
    const amount = parseInt(data["Amount Actually received"]);
    const amountReceived = isNaN(amount) ? null : amount;

    const request: GiftCardRequestCreationAttributes = {
        user_id: user.id,
        group_id: null,
        no_of_cards: parseInt(treesCountStr),
        is_active: false,
        logo_url: null,
        primary_message: defaultGiftMessages.primary,
        secondary_message: defaultGiftMessages.secondary,
        event_name: null,
        event_type: null,
        planted_by: null,
        logo_message: defaultGiftMessages.logo,
        status: GiftCardRequestStatus.pendingPlotSelection,
        category: 'Foundation',
        grove: null,
        gifted_on: new Date(),
        created_by: 16791,  // Automation
        request_type: 'Normal Assignment',
        created_at: new Date(),
        updated_at: new Date(),
        request_id: requestId,
        donation_receipt_number: donationReceiptNumber,
        amount_received: amountReceived,
        payment_id: null,
        validation_errors: ['MISSING_USER_DETAILS'],
        tags: ["Backlog"],
    }

    const cardRequest = await GiftCardsRepository.createGiftCardRequest(request);
    return cardRequest.id;
}

export async function processDonationRequestSheet(): Promise<void> {
    const spreadsheetId = '1swIXOGQJM1jOuOXAr-yz6Xq3bB2ad5UtjE2s1XvkK9c';
    const sheetName = 'All Donations';
    const extraColumns = ['System ReqId', 'System Status', 'System Message']

    processAndUpdateSheet({
        spreadsheetId: spreadsheetId,
        sheetName: sheetName,
        extraColumns,
        processRow: async(row): Promise<Record<string, any>> => {

            const update: any = {};
            if (row["Vivek To process"] === "Y" && !row["System ReqId"]) {
                const resp = await processDonationData(row);
                update["System ReqId"] = typeof resp === 'string' ? '' : resp;
                update["System Status"] = typeof resp === 'string' ? 'Failed' : 'Success';
                update["System Message"] = typeof resp === 'string' ? resp : '';
            } 
            return update;
        },
    })
}