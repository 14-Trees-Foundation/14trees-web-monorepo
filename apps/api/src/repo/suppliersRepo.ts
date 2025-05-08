import { QueryTypes, WhereOptions } from 'sequelize';
import { sequelize } from '../config/postgreDB';
import { Supplier, SupplierAttributes, SupplierCreationAttributes } from '../models/suppliers'
import { PaginatedResponse, FilterItem } from '../models/pagination';
import { getSqlQueryExpression } from "../controllers/helper/filters";
import { SortOrder } from "../models/common";

export class SupplierRepository {
    public static async createSupplier(data: SupplierCreationAttributes): Promise<Supplier> {
        const supplier = await Supplier.create({
            code: data.code,
            name: data.name,
            address: data.address || null,
            city: data.city || null,
            email: data.email || null,
            country: data.country || null,
            company_group_code: data.company_group_code || null,
            import_path: data.import_path || null,
            export_path: data.export_path || null,
            supplier_formats: data.supplier_formats || null,
            server: data.server || null
        });
        return supplier;
    }

    public static async updateSupplier(code: string, data: Partial<SupplierAttributes>): Promise<Supplier> {
        const supplier = await Supplier.findByPk(code);
        if (!supplier) {
            throw new Error("Supplier not found");
        }
        const updatedSupplier = await supplier.update(data);
        return updatedSupplier;
    }

    public static async getSuppliers(
        offset: number,
        limit: number,
        filters: FilterItem[] = [],
        orderBy: SortOrder[] = [{ column: 'code', order: 'ASC' }]
    ): Promise<PaginatedResponse<Supplier>> {
        let whereCondition = "";
        let replacements: any = {};
        
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                const { condition, replacement } = getSqlQueryExpression(
                    `s.${filter.columnField}`, 
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
            ? `ORDER BY ${orderBy.map(o => `s.${o.column} ${o.order}`).join(', ')}` 
            : 'ORDER BY s.code ASC';
    
        const query = `
            SELECT 
                s.*
            FROM 
                "14trees_2".suppliers s
            ${whereCondition ? `WHERE ${whereCondition}` : ''}
            ${orderByClause}
            ${limit > 0 ? `LIMIT ${limit} OFFSET ${offset}` : ''}
        `;
    
        const countQuery = `
            SELECT COUNT(*) as count
            FROM "14trees_2".suppliers s
            ${whereCondition ? `WHERE ${whereCondition}` : ''}
        `;
    
        const [suppliers, countResult] = await Promise.all([
            sequelize.query<Supplier>(query, {
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
            results: suppliers 
        };
    }

    public static async getSupplierByCode(code: string): Promise<Supplier | null> {
        return await Supplier.findByPk(code);
    }

    public static async deleteSupplier(code: string): Promise<number> {
        const result = await Supplier.destroy({ where: { code } });
        return result;
    }

    public static async supplierExists(code: string): Promise<boolean> {
        const count = await Supplier.count({ where: { code } });
        return count > 0;
    }
}