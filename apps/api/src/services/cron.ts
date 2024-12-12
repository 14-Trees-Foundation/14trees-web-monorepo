import cron from 'node-cron';
import { LogsInfoRepository } from '../repo/logsInfoRepo';
import sendDiscordMessage from './webhook';
import PlantTypeTemplateRepository from '../repo/plantTypeTemplateRepo';
import { deleteUnwantedSlides } from '../controllers/helper/slides';
import { TreeCountAggregationsRepo } from '../repo/treeCountAggregationsRepo';

export function startAppV2ErrorLogsCronJob() {
    const task = cron.schedule('0 * * * *', async () => {
        try {
            const logs = await LogsInfoRepository.getLogsInfo(Date.now() - 60 * 60 * 1000);
    
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

export function recalculateAggregatedData() {
    const task = cron.schedule('*/10 4-14 * * *', async () => {
        await TreeCountAggregationsRepo.checkAndRecalculateData();
    });
}