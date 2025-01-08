import cron from 'node-cron';
import { LogsInfoRepository } from '../repo/logsInfoRepo';
import sendDiscordMessage from './webhook';
import PlantTypeTemplateRepository from '../repo/plantTypeTemplateRepo';
import { deleteUnwantedSlides } from '../controllers/helper/slides';
import { sequelize } from '../config/postgreDB';
import { QueryTypes } from 'sequelize';
import { PlotPlantTypeRepository } from '../repo/plotPlantTypesRepo';
import { PlotPlantTypeCreationAttributes } from '../models/plot_plant_type';

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