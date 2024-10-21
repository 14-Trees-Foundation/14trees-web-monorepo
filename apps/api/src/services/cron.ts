import cron from 'node-cron';
import { LogsInfoRepository } from '../repo/logsInfoRepo';
import sendDiscordMessage from './webhook';

export function startAppV2ErrorLogsCronJob() {
    const task = cron.schedule('0 * * * *', async () => {
        const logs = await LogsInfoRepository.getLogsInfo(Date.now() - 60 * 60 * 1000);

        for (const log of logs) {
            if (log.logs.includes('Network Error')) continue;
            await sendDiscordMessage(JSON.stringify(log, null, 2));
        }
    });
}