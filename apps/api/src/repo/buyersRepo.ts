// src/repositories/buyer.repository.ts
import { QueryTypes, WhereOptions } from 'sequelize';
import { sequelize } from '../config/postgreDB';
import { Buyer, BuyerAttributes, BuyerCreationAttributes } from '../models/buyers';
import { PaginatedResponse, FilterItem } from '../models/pagination';
import { getSqlQueryExpression } from "../controllers/helper/filters";
import { SortOrder } from "../models/common";

export class BuyerRepository {
    public static async createBuyer(data: BuyerCreationAttributes): Promise<Buyer> {
        const buyer = await Buyer.create({
            code: data.code,
            buyer_name: data.buyer_name,
            contact_person: data.contact_person || null,
            email: data.email || null,
            country: data.country || null,
            adaptor_license_key: data.adaptor_license_key || null,
            web_link: data.web_link || null,
            import_path: data.import_path || null,
            export_path: data.export_path || null
        });
        return buyer;
    }

    public static async updateBuyer(code: string, data: Partial<BuyerAttributes>): Promise<Buyer> {
        const buyer = await Buyer.findByPk(code);
        if (!buyer) {
            throw new Error("Buyer not found");
        }
        const updatedBuyer = await buyer.update(data);
        return updatedBuyer;
    }

    public static async getBuyers(
        offset: number,
        limit: number,
        filters: FilterItem[] = [],
        orderBy: SortOrder[] = [{ column: 'code', order: 'ASC' }]
    ): Promise<PaginatedResponse<Buyer>> {
        let whereCondition = "";
        let replacements: any = {};
        
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                const { condition, replacement } = getSqlQueryExpression(
                    `b.${filter.columnField}`, 
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
            ? `ORDER BY ${orderBy.map(o => `b.${o.column} ${o.order}`).join(', ')}` 
            : 'ORDER BY b.code ASC';
    
        const query = `
            SELECT 
                b.*
            FROM 
                "14trees_2".buyers b
            ${whereCondition ? `WHERE ${whereCondition}` : ''}
            ${orderByClause}
            ${limit > 0 ? `LIMIT ${limit} OFFSET ${offset}` : ''}
        `;
    
        const countQuery = `
            SELECT COUNT(*) as count
            FROM "14trees_2".buyers b
            ${whereCondition ? `WHERE ${whereCondition}` : ''}
        `;
    
        const [buyers, countResult] = await Promise.all([
            sequelize.query<Buyer>(query, {
                type: QueryTypes.SELECT,
                replacements
            }),
            sequelize.query<{ count: string }>(countQuery, {
                type: QueryTypes.SELECT,
                replacements
            })
        ]);
    
        return { 
            offset: offset, 
            total: parseInt(countResult[0]?.count ?? '0', 10), 
            results: buyers 
        };
    }

    public static async getBuyerByCode(code: string): Promise<Buyer | null> {
        return await Buyer.findByPk(code);
    }

    public static async deleteBuyer(code: string): Promise<number> {
        const result = await Buyer.destroy({ where: { code } });
        return result;
    }

    public static async buyerExists(code: string): Promise<boolean> {
        const count = await Buyer.count({ where: { code } });
        return count > 0;
    }
}

export default BuyerRepository;