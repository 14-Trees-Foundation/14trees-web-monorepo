import { QueryTypes, WhereOptions} from 'sequelize';
import { sequelize } from '../config/postgreDB';
import { Group, GroupAttributes, GroupCreationAttributes, GroupType} from '../models/group';
import { PaginatedResponse, FilterItem }from '../models/pagination';
import { getSqlQueryExpression } from "../controllers/helper/filters";
import { SortOrder } from "../models/common"; 
import { getSchema } from '../helpers/utils';

export class GroupRepository {
    public static async addGroup(data: any): Promise<Group> {
        let obj: GroupCreationAttributes = {
            name: data.name as string,
            type: data.type as GroupType,
            description: data.description ? data.description as string : undefined,
            logo_url: data.logo_url ? data.logo_url : null,
            address: data.address ? data.address : null,
            billing_email: data.billing_email?.trim() ? data.billing_email.trim() : null,
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

    public static async getGroups(offset: number, limit: number,  filters: FilterItem[], orderBy: SortOrder[] = []): Promise<PaginatedResponse<Group & { sponsored_trees: number }>> {
        let whereCondition = "";
        let replacements: any = {};
        
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                const { condition, replacement } = getSqlQueryExpression(
                    `g.${filter.columnField}`, 
                    filter.operatorValue, 
                    filter.columnField, 
                    filter.value
                );
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement };
            });
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }
    
        const orderByClause = orderBy && orderBy.length > 0 
        ? `ORDER BY ${orderBy.map(o => `${o.column} ${o.order}`).join(', ')}` 
            : 'ORDER BY g.id DESC';
    
        const query = `
            SELECT 
                g.*,
                (SELECT COUNT(*) FROM "${getSchema()}".trees t WHERE t.mapped_to_group = g.id) AS reserved_trees,
                (SELECT COUNT(*) FROM "${getSchema()}".trees t WHERE t.sponsored_by_group = g.id) AS sponsored_trees
            FROM 
                "${getSchema()}".groups g
            ${whereCondition ? `WHERE ${whereCondition}` : ''}
            ${orderByClause}
            ${limit > 0 ? `LIMIT ${limit} OFFSET ${offset}` : ''}
        `;
    
        const countQuery = `
            SELECT COUNT(*) as count
            FROM "${getSchema()}".groups g
            ${whereCondition ? `WHERE ${whereCondition}` : ''}
        `;
    
        const [groups, resp] = await Promise.all([
            sequelize.query<Group & { sponsored_trees: number }>(query, {
                type: QueryTypes.SELECT,
                replacements
            }),
            sequelize.query<{ count: string }>(countQuery, {
                type: QueryTypes.SELECT,
                replacements
            })
        ]);
    
        return { offset: offset, total: parseInt(resp[0]?.count ?? '0', 10), results: groups };
    }

    public static async getGroup(id: number): Promise<Group | null> {
        return await Group.findByPk(id);
    }

    public static async deleteGroup(id: number): Promise<number> {
        const resp = await Group.destroy({ where: { id: id } });
        return resp;
    }
}
