import cron from 'node-cron';
import { LogsInfoRepository } from '../repo/logsInfoRepo';
import sendDiscordMessage from './webhook';
import PlantTypeTemplateRepository from '../repo/plantTypeTemplateRepo';
import { deleteUnwantedSlides } from '../controllers/helper/slides';
import { sequelize } from '../config/postgreDB';
import { QueryTypes } from 'sequelize';
import { PlotPlantTypeRepository } from '../repo/plotPlantTypesRepo';
import { PlotPlantTypeCreationAttributes } from '../models/plot_plant_type';
import { TreesSnapshotRepository } from '../repo/treesSnapshotsRepo';
import { GoogleSpreadsheet } from './google';
import { ContributionOption_CSR, ContributionOption_VOLUNTEER, Donation, DonationMailStatus_Accounts, DonationMailStatus_BackOffice, DonationMailStatus_CSR, DonationMailStatus_Volunteer } from '../models/donation';
import { DonationService } from '../facade/donationService';
import { DonationRepository } from '../repo/donationsRepo';
import { FilterItem } from '../models/pagination';
import { UserRepository } from '../repo/userRepo';
import GiftCardsService from '../facade/giftCardsService';
import { GiftCardRequest, GiftReqMailStatus_Accounts, GiftReqMailStatus_BackOffice, GiftReqMailStatus_CSR, GiftReqMailStatus_Volunteer } from '../models/gift_card_request';
import { GiftCardsRepository } from '../repo/giftCardsRepo';
import { updateInventoryStates } from '../facade/autoProcessInventory';

export function startAppV2ErrorLogsCronJob() {
    const task = cron.schedule('0 * * * *', async () => {
        try {
            const logs = await LogsInfoRepository.getLogsInfo(Date.now() - 10 * 24 * 60 * 60 * 1000);

            for (const log of logs) {
                if (log.logs.includes('Network Error')) continue;
                await sendDiscordMessage(JSON.stringify(log, null, 2));
            }
        } catch (error) {
            console.log('[ERROR]', 'CRON::startAppV2ErrorLogsCronJob', error);
        }
    });
}

export function cleanUpGiftCardLiveTemplates() {
    const task = cron.schedule('0 20 * * *', async () => {
        const livePresentationId = process.env.LIVE_GIFT_CARD_PRESENTATION_ID;
        if (!livePresentationId) {
            console.log('[ERROR]', 'CRON::cleanUpGiftCardLiveTemplates', 'Missing live gift card template presentation id in ENV variables.')
            return;
        }

        try {
            const templates = await PlantTypeTemplateRepository.getAll();
            const slideIds = templates.map(template => template.template_id);
            if (slideIds.length > 0) {
                await deleteUnwantedSlides(livePresentationId, slideIds);
            }
        } catch (error) {
            console.log('[ERROR]', 'CRON::cleanUpGiftCardLiveTemplates', error);
        }
    });
}

export function updatePlotPlantTypes() {
    const task = cron.schedule('0 * * * *', async () => {
        try {

            // fetch distinct plot plant types
            const query = `
                SELECT DISTINCT plot_id, plant_type_id
                FROM "14trees_2".trees;
            `

            const plotPlantTypes: any[] = await sequelize.query(query, { type: QueryTypes.SELECT });
            const existanceMap: Map<string, boolean> = new Map();

            for (const plotPlantType of plotPlantTypes) {
                const key = `${plotPlantType.plot_id}_${plotPlantType.plant_type_id}`;
                if (existanceMap.has(key)) continue;
                existanceMap.set(key, true);
            }

            // fetch exising plot plant types
            const existingPlotPlantTypes = await PlotPlantTypeRepository.getPlotPlantTypes({});
            const existingMap: Map<string, boolean> = new Map();
            for (const plotPlantType of existingPlotPlantTypes) {
                const key = `${plotPlantType.plot_id}_${plotPlantType.plant_type_id}`;
                if (existingMap.has(key)) continue;
                existingMap.set(key, true);
            }

            // delete plot plant types that are not in the trees table
            for (const plotPlantType of existingPlotPlantTypes) {
                const key = `${plotPlantType.plot_id}_${plotPlantType.plant_type_id}`;
                if (!existanceMap.has(key)) {
                    await plotPlantType.destroy();
                }
            }

            // add plot plant types that are not in the plot plant types table
            const newPlotPlantTypes: PlotPlantTypeCreationAttributes[] = [];
            for (const plotPlantType of plotPlantTypes) {
                const key = `${plotPlantType.plot_id}_${plotPlantType.plant_type_id}`;
                if (!existingMap.has(key)) {
                    newPlotPlantTypes.push({
                        plot_id: plotPlantType.plot_id,
                        plant_type_id: plotPlantType.plant_type_id,
                        sustainable: true,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            }

            await PlotPlantTypeRepository.addPlotPlantTypes(newPlotPlantTypes);

        } catch (error) {
            console.log('[ERROR]', 'CRON::updatePlotPlantTypes', error);
        }
    });
}


export function updateTheAuditReport() {
    const spreadsheetId = "1xGrvZkrOwGTXTQObSvUnP0Xl3vrigElRYh0Rm01DaXQ";
    const sheetName = "Automation"
    const aggSheetName = "Agg. Audit Report"
    const auditedTreesSheetName = "Plot Audit Report"; // Updated sheet name

    const task = cron.schedule('*/5 * * * *', async () => {
        try {

            const spreadSheetClient = new GoogleSpreadsheet();
            const getRes = await spreadSheetClient.getSpreadsheetData(spreadsheetId, sheetName);
            if (!getRes) return;

            const rows = getRes.data.values;
            if (!rows || rows.length === 0) {
                console.log('No data found.');
                return;
            }

            const headerRow = rows[0];
            const updatedValues: string[][] = [headerRow];

            const auditData = await TreesSnapshotRepository.getAuditReport();
            for (const data of auditData) {
                const row: any[] = [];
                row.push(data['user_name'])
                row.push(data['plot_name'])
                row.push(data['trees_audited'])
                row.push(data['audit_date'])
                row.push(data['site_name'])
                updatedValues.push(row);
            }

            await spreadSheetClient.updateRowDataInSheet(spreadsheetId, sheetName, updatedValues);

            const aggHeader = ['Staff Name', 'Audit Date', 'Total Trees Audited'];
            const aggUpdatedValues: string[][] = [aggHeader];

            const aggAuditData = await TreesSnapshotRepository.getAggregatedAuditReport();
            for (const data of aggAuditData) {
                const aggRow: any[] = [];
                aggRow.push(data['user_name']);
                aggRow.push(data['audit_date']);
                aggRow.push(data['total_trees_audited']);
                aggUpdatedValues.push(aggRow);
            }

            await spreadSheetClient.updateRowDataInSheet(spreadsheetId, aggSheetName, aggUpdatedValues);

            const auditedTreesHeader = ['Plot ID', 'Plot Name', 'Sapling ID', 'Audit Date'];
            const auditedTreesValues: string[][] = [auditedTreesHeader];

            const auditedTreesData = await TreesSnapshotRepository.getPlotsWithAuditedTrees();
            for (const tree of auditedTreesData) {
                const treeRow: any[] = [];
                treeRow.push(tree.plot_id);
                treeRow.push(tree.plot_name);
                treeRow.push(tree.sapling_id);
                treeRow.push(tree.audit_date ? tree.audit_date : '');

                auditedTreesValues.push(treeRow);
            }

            await spreadSheetClient.updateRowDataInSheet(spreadsheetId, auditedTreesSheetName, auditedTreesValues);

        } catch (error) {
            console.log('[ERROR]', 'CRON::updateTheAuditReport', error);
        }
    });
}


export function sendDonationMails() {

    const task = cron.schedule('*/5 * * * *', async () => {

        let donations: Donation[] = [];
        try {
            const filters: FilterItem[] = [
                { columnField: 'created_at', operatorValue: 'greaterThan', value: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
            ]
            const donationsResp = await DonationRepository.getDonations(0, -1, filters)
            donations = donationsResp.results;
        } catch (error: any) {
            console.log("[ERROR]", 'CRON::sendDonationMails', error);
            return;
        }

        for (const donation of donations) {
            const sponsor: any = {
                name: (donation as any).user_name,
                email: (donation as any).user_email,
                phone: (donation as any).user_phone,
            };

            try {
                if (!donation.mail_status?.includes(DonationMailStatus_BackOffice)) {
                    try {
                        await DonationService.sendDonationNotificationToBackOffice(donation.id, sponsor);
                    } catch (error) {
                        console.error("[ERROR] Failed to send donation notification to accounts:", error);
                    }
                }

                if (!donation.mail_status?.includes(DonationMailStatus_Accounts)) {
                    try {
                        await DonationService.sendDonationNotificationToAccounts(donation.id, sponsor);
                    } catch (error) {
                        console.error("[ERROR] Failed to send donation notification to accounts:", error);
                    }
                }

                if (
                    donation.contribution_options?.includes(ContributionOption_VOLUNTEER) &&
                    !donation.mail_status?.includes(DonationMailStatus_Volunteer)
                ) {
                    try {
                        await DonationService.sendDonationNotificationForVolunteers(donation.id, sponsor);
                    } catch (error) {
                        console.error("[ERROR] Failed to send donation notification for volunteers:", error);
                    }
                }

                if (
                    donation.contribution_options?.includes(ContributionOption_CSR) &&
                    !donation.mail_status?.includes(DonationMailStatus_CSR)
                ) {
                    try {
                        await DonationService.sendDonationNotificationForCSR(donation.id, sponsor);
                    } catch (error) {
                        console.error("[ERROR] Failed to send donation notification for CSR:", error);
                    }
                }
            } catch (error) {
                console.error("[ERROR] Failed to process donation:", error);
            }
        }
    });
}

export function sendGiftCardMails() {
    const task = cron.schedule('*/1 * * * *', async () => {
        let giftCardRequests: GiftCardRequest[] = [];
        try {
            const filters: FilterItem[] = [
                { columnField: 'created_at', operatorValue: 'greaterThan', value: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
                { columnField: 'request_type', operatorValue: 'equals', value: 'Gift Cards' },
            ]
            const giftCardsResp = await GiftCardsRepository.getGiftCardRequests(0, -1, filters)
            giftCardRequests = giftCardsResp.results;
        } catch (error: any) {
            console.log("[ERROR]", 'CRON::sendGiftCardMails', error);
            return;
        }

        for (const giftCardRequest of giftCardRequests) {
            const sponsor: any = {
                name: (giftCardRequest as any).user_name,
                email: (giftCardRequest as any).user_email,
                phone: (giftCardRequest as any).user_phone,
            };

            try {
                if (!giftCardRequest.mail_status?.includes(GiftReqMailStatus_BackOffice)) {
                    try {
                        await GiftCardsService.sendGiftingNotificationToBackOffice(giftCardRequest.id, sponsor);
                    } catch (error) {
                        console.error("[ERROR] Failed to send gift card notification to backoffice:", error);
                    }
                }

                if (!giftCardRequest.mail_status?.includes(GiftReqMailStatus_Accounts)) {
                    try {
                        await GiftCardsService.sendGiftingNotificationToAccounts(giftCardRequest.id, sponsor);
                    } catch (error) {
                        console.error("[ERROR] Failed to send gift card notification to accounts:", error);
                    }
                }

                if (
                    giftCardRequest.contribution_options?.includes(ContributionOption_VOLUNTEER) &&
                    !giftCardRequest.mail_status?.includes(GiftReqMailStatus_Volunteer)
                ) {
                    try {
                        await GiftCardsService.sendGiftingNotificationForVolunteers(giftCardRequest.id, sponsor);
                    } catch (error) {
                        console.error("[ERROR] Failed to send gift card notification for volunteers:", error);
                    }
                }

                if (
                    giftCardRequest.contribution_options?.includes(ContributionOption_CSR) &&
                    !giftCardRequest.mail_status?.includes(GiftReqMailStatus_CSR)
                ) {
                    try {
                        await GiftCardsService.sendGiftingNotificationForCSR(giftCardRequest.id, sponsor);
                    } catch (error) {
                        console.error("[ERROR] Failed to send gift card notification for CSR:", error);
                    }
                }
            } catch (error) {
                console.error("[ERROR] Failed to process gift card request:", error);
            }
        }
    });
}

export function updateAutoProcessReqInventory() {
    const task = cron.schedule('*/5 * * * *', async () => {
        try {
            await updateInventoryStates();
        } catch(error) {
            console.error("[ERROR] Failed to update auto process req inventory:", error);
        }
    });
}