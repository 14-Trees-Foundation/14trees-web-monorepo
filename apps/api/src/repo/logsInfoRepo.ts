import { Op, where } from 'sequelize';
import { LogsInfo, LogsInfoAttributes, LogsInfoCreationAttributes } from '../models/logs_info';

export class LogsInfoRepository {

    static async addLogsInfo(data: LogsInfoCreationAttributes): Promise<LogsInfo> {
        return await LogsInfo.create(data);
    }

    static async getLogsInfo(timestamp: number): Promise<LogsInfo[]> {

        return await LogsInfo.findAll({
            where: {
                timestamp: {[Op.gte]: timestamp}
            }
        });
    }
}
