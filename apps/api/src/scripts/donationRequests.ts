import { google, sheets_v4 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { getUniqueRequestId } from '../helpers/utils';
import { UserRepository } from '../repo/userRepo';
import { GiftCardRequestCreationAttributes, GiftCardRequestStatus } from '../models/gift_card_request';
import { GiftCardsRepository } from '../repo/giftCardsRepo';
import { User } from '../models/user';
import { PlotRepository } from '../repo/plotRepo';
import GiftRequestHelper from '../helpers/giftRequests';
import { AlbumRepository } from '../repo/albumRepo';
import { GiftRequestUserCreationAttributes } from '../models/gift_request_user';

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

class GoogleSpreadsheet {
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

export async function processAndUpdateSheet(options: ProcessOptions): Promise<void> {
    const { spreadsheetId, sheetName, processRow, extraColumns } = options;
    const googleSheets = new GoogleSpreadsheet();

    const getRes = await googleSheets.getSpreadsheetData(spreadsheetId, sheetName);

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
    await googleSheets.updateRowDataInSheet(spreadsheetId, sheetName, updatedValues);
    console.log('Sheet updated successfully.');
}

async function processDonationData(data: any, createdBy: number): Promise<number | string> {

    const requestId = getUniqueRequestId();

    const sponsorName = data["Name"];
    const sponsorEmail = data["Email"];
    if (!sponsorName || !sponsorEmail) {
        return 'Missing Sponsor name or email.';
    }
    // create sponsorUser
    const user = await UserRepository.upsertUser({ name: sponsorName, email: sponsorEmail });

    const treesCountStr = data["Vivek Trees to Assign"];
    if (!treesCountStr || isNaN(parseInt(treesCountStr)) || parseInt(treesCountStr) <= 0) {
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
        created_by: createdBy,
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

export async function getBatchToPlotMapping(spreadsheetId: string) {
    const batchPlotSheetName = 'Plotwise Count 15th Feb';

    const googleSheets = new GoogleSpreadsheet();
    const getRes = await googleSheets.getSpreadsheetData(spreadsheetId, batchPlotSheetName);
    if (!getRes) return;
    const rows = getRes.data.values;
    if (!rows || rows.length === 0) {
        console.log('No data found.');
        return;
    }

    const headerRow = rows[0];
    const plotIdx = headerRow.findIndex(header => header === "Name");
    const batchIdx = headerRow.findIndex(header => header === "Latest Batch Assignmemnt");

    if (plotIdx === -1 || batchIdx === -1) {
        console.log("[ERROR]", "Plot name index or batch name index not found.");
        return;
    }

    const batchToPlotMap: Record<string, string[]> = {};
    const distinctPlotsMap: Record<string, boolean> = {};
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][batchIdx] && rows[i][plotIdx]) {
            distinctPlotsMap[rows[i][plotIdx]] = true;
            const batchString: string = rows[i][batchIdx];
            const batches = batchString.split(",").map(item => item.trim()).filter(item => item);
            batches.forEach(batch => {
                if (!batchToPlotMap[batch]) batchToPlotMap[batch] = [];
                batchToPlotMap[batch].push(rows[i][plotIdx]);
            })
        }
    }

    console.log(JSON.stringify(batchToPlotMap, null, 2));

    const distinctPlots = Object.keys(distinctPlotsMap);
    const plotsResp = await PlotRepository.getPlots(0, -1, [{
        columnField: 'name',
        operatorValue: 'isAnyOf',
        value: distinctPlots,
    }])

    const plotNameToIdMap: Record<string, number> = {};
    for (const plot of plotsResp.results) {
        plotNameToIdMap[plot.name] = plot.id;
    }

    const batchToPlotIdMap: Record<string, number[]> = {};
    for (const [batch, plotNames] of Object.entries(batchToPlotMap)) {
        batchToPlotIdMap[batch] = [];
        for (const plotName of plotNames) {
            if (!plotNameToIdMap[plotName]) {
                console.log("[WARN]", "Plot id not found for plot", plotName);
                continue;
            }
            batchToPlotIdMap[batch].push(plotNameToIdMap[plotName]);
        }
    }

    console.log(JSON.stringify(batchToPlotIdMap, null, 2));
    return batchToPlotIdMap;
}

async function reserverTreesForDonationRequest(requestId: number, plotIds: number[]) {
    await GiftCardsRepository.addGiftCardPlots(requestId, plotIds);

    return await GiftRequestHelper.autoBookTreesForGiftRequest(requestId, true, true, false);
}

async function addRecipients(assigneesStr: string, requestId: number) {

    let requests: GiftRequestUserCreationAttributes[] = []
    const userNames = assigneesStr.split(",")
    for (const userName of userNames) {
        const parts = userName.split("-");
        const name = parts[0].trim();
        let trees = 1;
        if (parts.length === 2) {
            trees = parseInt(parts[1].trim())
        }

        const user = await UserRepository.upsertUser({ name: name, email: name.toLowerCase().split(" ").join(".") + ".donor@14trees" })

        requests.push({
            recipient: user.id,
            assignee: user.id,
            gift_request_id: requestId,
            gifted_trees: trees,
            created_at: new Date(),
            updated_at: new Date(),
        })
    }
    return await GiftCardsRepository.addGiftRequestUsers(requests, true) || []
}

async function assignTreesForDonationRequest(data: any, requestId: number) {
    const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: requestId }]);
    if (resp.results.length === 0) {
        return;
    }
    const giftCardRequest = resp.results[0];

    let memoryImageUrls: string[] | null = null;
    if (giftCardRequest.album_id) {
        const albums = await AlbumRepository.getAlbums({ id: giftCardRequest.album_id });
        if (albums.length === 1) memoryImageUrls = albums[0].images;
    }

    let users = await GiftCardsRepository.getGiftRequestUsers(requestId);
    const existingTreesResp = await GiftCardsRepository.getBookedTrees(requestId, 0, -1);
    if (users.length === 0) {

        if (data["Assignees"]) {
            users = await addRecipients(data["Assignees"], requestId)
        } else {
            users = await GiftCardsRepository.addGiftRequestUsers([{
                recipient: giftCardRequest.user_id,
                assignee: giftCardRequest.user_id,
                gift_request_id: giftCardRequest.id,
                gifted_trees: giftCardRequest.no_of_cards,
                created_at: new Date(),
                updated_at: new Date(),
            }], true) || []
        }
    }

    if (users.length < 1) return;

    await GiftRequestHelper.autoAssignTrees(giftCardRequest, users, existingTreesResp.results, memoryImageUrls);

    const updatedResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: requestId }]);
    const giftRequest: any = updatedResp.results[0];

    if (giftRequest.no_of_cards == Number(giftRequest.assigned)) {
        giftRequest.status = GiftCardRequestStatus.completed;
    } else if (giftRequest.no_of_cards == Number(giftRequest.booked)) {
        giftRequest.status = GiftCardRequestStatus.pendingAssignment;
    } else {
        giftRequest.status = GiftCardRequestStatus.pendingPlotSelection;
    }

    giftRequest.validation_errors = null;
    giftRequest.updated_at = new Date();
    await GiftCardsRepository.updateGiftCardRequest(giftRequest);
}

export async function processDonationRequestSheet(spreadsheetId: string): Promise<void> {
    const sheetName = 'All Donations';
    const extraColumns = ['System ReqId', 'System Status', 'System Message'];

    const systemUserEmail = 'automation@14trees';
    let user: User | null = null;
    const userResp = await UserRepository.getUsers(0, 1, [{ columnField: 'email', operatorValue: 'equals', value: systemUserEmail }]);
    if (userResp.results.length === 1) {
        user = userResp.results[0];
    } else {
        user = await UserRepository.addUser({
            name: 'Automation',
            email: systemUserEmail,
        })
    }

    await processAndUpdateSheet({
        spreadsheetId: spreadsheetId,
        sheetName: sheetName,
        extraColumns,
        processRow: async (row): Promise<Record<string, any>> => {

            const update: any = {};
            if (row["Vivek To process"] === "Y" && !row["System ReqId"]) {
                const resp = await processDonationData(row, user.id);
                update["System ReqId"] = typeof resp === 'string' ? '' : resp;
                update["System Status"] = typeof resp === 'string' ? 'Failed' : 'Success';
                update["System Message"] = typeof resp === 'string' ? resp : 'Pending tree reservation';
            }
            return update;
        },
    })

    const batchToPlotIdMap = await getBatchToPlotMapping(spreadsheetId);
    if (!batchToPlotIdMap) return;

    const batchColumn = "Graduation year (or year you left IITK campus or retirement year for faculty/staff members; for integrated/longer courses suggest to pick the year of passing out for your batch. Eg, for the 5 year 95-00 Maths program enter 1999)"
    await processAndUpdateSheet({
        spreadsheetId: spreadsheetId,
        sheetName: sheetName,
        extraColumns,
        processRow: async (row): Promise<Record<string, any>> => {

            const update: any = {};
            if (row["Vivek To process"] === "Y" && row["System ReqId"]) {
                const requestId = parseInt(row["System ReqId"]);
                const batch: string = row[batchColumn].trim();
                let message: string | void = 'Plots not found for batch.'
                if (batchToPlotIdMap[batch]) {
                    message = await reserverTreesForDonationRequest(requestId, batchToPlotIdMap[batch]);
                }
                update["System ReqId"] = requestId;
                update["System Status"] = typeof message === 'string' ? 'Failed' : 'Success';
                update["System Message"] = typeof message === 'string' ? message : '';
            }
            return update;
        },
    })


    await processAndUpdateSheet({
        spreadsheetId: spreadsheetId,
        sheetName: sheetName,
        extraColumns,
        processRow: async (row): Promise<Record<string, any>> => {

            const update: any = {};
            if (row["Vivek To process"] === "Y" && row["System ReqId"]) {
                const requestId = parseInt(row["System ReqId"]);
                if (row["Assignees"] !== "Later") await assignTreesForDonationRequest(row, requestId);
                update["System ReqId"] = requestId;
            }
            return update;
        },
    })
}


export async function revertDonationRequestSheet(spreadsheetId: string): Promise<void> {
    const sheetName = 'All Donations';
    const extraColumns = ['System ReqId', 'System Status', 'System Message'];

    await processAndUpdateSheet({
        spreadsheetId: spreadsheetId,
        sheetName: sheetName,
        extraColumns,
        processRow: async (row): Promise<Record<string, any>> => {

            const update: any = {};
            if (row["Vivek To process"] === "Y" && row["System ReqId"]) {
                const requestId = parseInt(row["System ReqId"]);
                let message = ''
                try {
                    await GiftRequestHelper.deleteGiftCardRequest(requestId);
                } catch(error: any) {
                    message = error.message
                }
                update["System Status"] = message ? 'Failed' : 'Success';
                update["System Message"] = message ? message : 'Deleted gift request';
                update["System ReqId"] = message ? requestId : '';
            }
            return update;
        },
    })
}