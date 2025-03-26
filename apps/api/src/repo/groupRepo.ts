import { QueryTypes, WhereOptions} from 'sequelize';
import { sequelize } from '../config/postgreDB';
import { Group, GroupAttributes, GroupCreationAttributes, GroupType} from '../models/group';
import { PaginatedResponse } from '../models/pagination';

export class GroupRepository {
    public static async addGroup(data: any): Promise<Group> {
        let obj: GroupCreationAttributes = {
            name: data.name as string,
            type: data.type as GroupType,
            description: data.description ? data.description as string : undefined,
            logo_url: data.logo_url ? data.logo_url : null,
            address: data.address ? data.address : null,
            created_at: new Date(),
            updated_at: new Date(),
        };
        const group = await Group.create(obj);
        return group;
    }

    public static async updateGroup(data: GroupAttributes): Promise<Group> {
        const group = await Group.findByPk(data.id);
        if (!group) {
            throw new Error("Group not found")
        }
        data.updated_at = new Date();
        const updatedGroup = await group.update(data);
        return updatedGroup;
    }

    public static async getGroups(offset: number, limit: number, whereClause: WhereOptions): Promise<PaginatedResponse<Group & { sponsored_trees: number }>> {
        
        const query = `
            SELECT 
                g.*,
                COUNT(t.id) as sponsored_trees
            FROM 
                "14trees_2".groups g
            LEFT JOIN 
                "14trees_2".trees t ON t.mapped_to_group = g.id
            GROUP BY 
                g.id
            ORDER BY 
                g.id DESC
            LIMIT ${limit}
            OFFSET ${offset}
        `;

        const countQuery = `
        SELECT COUNT(*) as count
        FROM "14trees_2".groups
        `;

        const [groups, resp] = await Promise.all([
            sequelize.query<Group & { sponsored_trees: number }>(query, {
                type: QueryTypes.SELECT
            }),
            sequelize.query<{ count: string }>(countQuery, {
                type: QueryTypes.SELECT
            })
        ]);

        return {offset: offset, total: parseInt(resp[0]?.count ?? '0', 10), results: groups};
    }

    public static async getGroup(id: number): Promise<Group | null> {
        return await Group.findByPk(id);
    }

    public static async deleteGroup(id: number): Promise<number> {
        const resp = await Group.destroy({ where: { id: id } });
        return resp;
    }
}
