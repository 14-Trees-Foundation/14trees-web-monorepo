import cron from 'node-cron';
import { LogsInfoRepository } from '../repo/logsInfoRepo';
import sendDiscordMessage from './webhook';
import PlantTypeTemplateRepository from '../repo/plantTypeTemplateRepo';
import { deleteUnwantedSlides } from '../controllers/helper/slides';
import { TreeCountAggregationsRepo } from '../repo/treeCountAggregationsRepo';
import { sequelize } from '../config/postgreDB';
import { QueryTypes } from 'sequelize';
import { PlotPlantTypeRepository } from '../repo/plotPlantTypesRepo';
import { PlotPlantTypeCreationAttributes } from '../models/plot_plant_type';
import { TreesSnapshotRepository } from '../repo/treesSnapshotsRepo';
import { GoogleSpreadsheet } from './google';

export function startAppV2ErrorLogsCronJob() {
    const task = cron.schedule('0 * * * *', async () => {
        try {
            const logs = await LogsInfoRepository.getLogsInfo(Date.now() - 60 * 60 * 1000);
    
            for (const log of logs) {
                if (log.logs.includes('Network Error')) continue;
                if (log.logs.includes("Cannot read property 'location' of undefined")) continue;
                if (log.logs.includes("No location provider available")) continue;
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

export function recalculateAggregatedData() {
    const task = cron.schedule('*/10 4-14 * * *', async () => {
        await TreeCountAggregationsRepo.checkAndRecalculateData();
    });
}

export function updatePlotPlantTypes() {
    const task = cron.schedule('0 * * * *', async () => {
        try {

            // fetch distinct plot plant types
            const query = `
                SELECT DISTINCT t.plot_id, t.plant_type_id
                FROM "14trees".trees t
                WHERE t.plot_id is not null and t.plant_type_id is not null;
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

    const task = cron.schedule('0 * * * *', async () => {
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
                treeRow.push(tree.image_date ? tree.image_date : ''); 
            
                auditedTreesValues.push(treeRow);    
            }
            
            await spreadSheetClient.updateRowDataInSheet(spreadsheetId, auditedTreesSheetName, auditedTreesValues);

        } catch (error) {
            console.log('[ERROR]', 'CRON::updateTheAuditReport', error);
        }
    });
}