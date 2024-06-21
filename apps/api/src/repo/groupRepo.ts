import { Op, WhereOptions } from 'sequelize';
import { Group, GroupAttributes, GroupCreationAttributes, GroupType} from '../models/group';
import { PaginatedResponse } from '../models/pagination';

export class GroupRepository {
    public static async addGroup(data: any): Promise<Group> {
        let obj: GroupCreationAttributes = {
            name: data.name as string,
            type: data.type as GroupType,
            description: data.description ? data.description as string : undefined,
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

    public static async getGroups(offset: number, limit: number, whereClause: WhereOptions): Promise<PaginatedResponse<Group>> {
        return {
            offset: offset,
            total: await Group.count({ where: whereClause }),
            results: await Group.findAll({
                where: whereClause,
                offset,
                limit
            })
        };
    }

    public static async getGroup(id: number): Promise<Group | null> {
        return await Group.findByPk(id);
    }

    public static async deleteGroup(id: number): Promise<number> {
        const resp = await Group.destroy({ where: { id: id } });
        return resp;
    }
}
