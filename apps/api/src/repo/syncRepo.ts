

import { WhereOptions } from "sequelize";
import DuplicateTreeSync, { DuplicateTreeSyncAttributes, DuplicateTreeSyncCreationAttributes } from "../models/duplicate_tree_sync";

export class SyncRepo {

    static async addDuplicateTreeSync(data: DuplicateTreeSyncCreationAttributes): Promise<DuplicateTreeSync> {
        return await DuplicateTreeSync.create(data);
    }

    static async updateDuplicateTreeSync(fields: Partial<DuplicateTreeSyncAttributes>, whereClause: WhereOptions<DuplicateTreeSyncAttributes>): Promise<void> {
        await DuplicateTreeSync.update(fields, {
            where: whereClause,
        });
    }

}
