import { Op } from 'sequelize';
import { Group, GroupAttributes, GroupCreationAttributes, GroupType} from '../models/group';

export class GroupRepository {
    public static async addGroup(data: any): Promise<Group> {
        let obj: GroupCreationAttributes = {
            name: data.name as string,
            type: data.type as GroupType,
            description: data.description as string,
        };
        const group = await Group.create(obj);
        return group;
    }

    public static async updateGroup(data: GroupAttributes): Promise<Group> {
        const group = await Group.findByPk(data.id);
        if (!group) {
        throw new Error("Group not found")
        }
        const updatedGroup = await group.update(data);
        return updatedGroup;
    }

    public static async getGroups(query: any, offset: number, limit: number): Promise<Group[]> {
        const whereClause: Record<string, any> = {};
        if (query.name) {
            whereClause.name = { [Op.iLike]: `%${query.name}%` };
        }
        if (query.type) {
            whereClause.type = { [Op.iLike]: `%${query.type}%` };
        }
    
        return await Group.findAll({
            where: whereClause,
            offset,
            limit,
        });
    }

    public static async getGroup(id: string): Promise<Group | null> {
        return await Group.findByPk(id);
    }

    public static async deleteGroup(id: string): Promise<number> {
        const resp = await Group.destroy({ where: { id: id } });
        return resp;
    }
}
