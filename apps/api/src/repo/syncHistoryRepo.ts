import { WhereOptions } from "sequelize";
import { SyncHistory, SyncHistoryCreationAttributes } from "../models/sync_history";
import { PaginatedResponse } from "../models/pagination";

export class SyncHistoriesRepository {

    static async addSyncHistory(data: SyncHistoryCreationAttributes): Promise<SyncHistory> {
        return await SyncHistory.create(data);
    }

    static async upsertSyncHistory(data: SyncHistoryCreationAttributes): Promise<SyncHistory> {
        const history = await SyncHistory.findOne({ where: { synced_at: data.synced_at } });
        if (history) return await history.update(data);
        else return await SyncHistory.create(data);
    }

    static async getSyncHistories(offset: number, limit: number, whereClause: WhereOptions): Promise<PaginatedResponse<SyncHistory>> {
        return {
            offset: offset,
            results: await SyncHistory.findAll({ where: whereClause, offset: offset, limit: limit, order: [['synced_at', 'ASC']] }),
            total: await SyncHistory.count({ where: whereClause }),
        }
    }

}
