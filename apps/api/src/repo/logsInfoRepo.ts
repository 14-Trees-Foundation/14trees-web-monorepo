import { LogsInfo, LogsInfoAttributes, LogsInfoCreationAttributes } from '../models/logs_info';

export class LogsInfoRepository {

    static async addLogsInfo(data: LogsInfoCreationAttributes): Promise<LogsInfo> {
        return await LogsInfo.create(data);
    }
}
