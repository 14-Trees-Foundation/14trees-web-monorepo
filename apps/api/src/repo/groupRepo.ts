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
            name_key: data.name_key?.trim() || undefined,
            type: data.type as GroupType,
            description: data.description ? data.description as string : undefined,
            logo_url: data.logo_url ? data.logo_url : null,
            address: data.address ? data.address : null,
            billing_email: data.billing_email?.trim() ? data.billing_email.trim() : null,
            created_at: new Date(),
            updated_at: new Date(),
        };
        // If name_key is not provided, generate a unique slug from the name
        if (!obj.name_key) {
            const base = GroupRepository.slugify(obj.name || `group-${Date.now()}`);
            let candidate = base;
            let suffix = 1;
            // ensure uniqueness
            while (await Group.findOne({ where: { name_key: candidate } })) {
                candidate = `${base}-${suffix}`;
                suffix++;
            }
            (obj as any).name_key = candidate;
        }

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

    public static async getGroupByKey(nameKey: string): Promise<Group | null> {
        return await Group.findOne({ where: { name_key: nameKey } });
    }

    public static async deleteGroup(id: number): Promise<number> {
        const resp = await Group.destroy({ where: { id: id } });
        return resp;
    }

    private static slugify(input: string): string {
        if (!input) return 'group';
        let s = input.toLowerCase();
        s = s.normalize('NFKD').replace(/\p{Diacritic}/gu, '');
        s = s.replace(/[^a-z0-9]+/g, '-');
        s = s.replace(/-+/g, '-');
        s = s.replace(/(^-|-$)/g, '');
        if (s.length === 0) s = 'group';
        if (s.length > 64) s = s.substring(0, 64).replace(/(^-|-$)/g, '');
        return s;
    }
}
