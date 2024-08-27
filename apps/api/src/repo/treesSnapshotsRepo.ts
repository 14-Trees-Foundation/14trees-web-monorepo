import { sequelize } from '../config/postgreDB';
import { PaginatedResponse } from '../models/pagination';
import { TreesSnapshot, TreesSnapshotCreationAttributes } from '../models/trees_snapshots';
import { Op, QueryTypes, WhereOptions } from 'sequelize'
export class TreesSnapshotRepository {

    static async addTreesSnapshot(data: TreesSnapshotCreationAttributes): Promise<TreesSnapshot> {
        return await TreesSnapshot.create(data);
    }

    static async bulkAddTreesSnapshots(data: TreesSnapshotCreationAttributes[]): Promise<TreesSnapshot[]> {
        return await TreesSnapshot.bulkCreate(data);
    }

    static async getTreesSnapshots(offset: number, limit: number, whereClause: WhereOptions): Promise<PaginatedResponse<TreesSnapshot>> {
        return {
            offset: offset,
            results: await TreesSnapshot.findAll({ where: whereClause, offset: offset, limit: limit }),
            total: await TreesSnapshot.count({ where: whereClause }),
        }
    }

    public static async getDeletedTreesSnapshotsFromList(treeSnapshotIds: number[]): Promise<number[]> {
        const query = `SELECT num
            FROM unnest(array[:tree_snapshot_ids]::int[]) AS num
            LEFT JOIN "14trees_2".trees_snapshots AS v
            ON num = v.id
            WHERE v.id IS NULL;`

        const result = await sequelize.query(query, {
            replacements: { tree_snapshot_ids: treeSnapshotIds },
            type: QueryTypes.SELECT
        })

        return result.map((row: any) => row.num);
    }

    public static async deleteTreeSnapshots(imageIds: number[]): Promise<void> {
        await TreesSnapshot.destroy({ where: { id: { [Op.in]: imageIds } } })
    }
}
