import { TreesSnapshots, TreesSnapshotsAttributes, TreesSnapshotsCreationAttributes } from '../models/trees_snapshots';
import { WhereOptions } from 'sequelize'
export class TreesSnapshotsRepository {

    static async addTreesSnapshots(data: TreesSnapshotsCreationAttributes): Promise<TreesSnapshots> {
        return await TreesSnapshots.create(data);
    }
}
