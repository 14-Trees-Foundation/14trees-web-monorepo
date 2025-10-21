import { Op, QueryTypes, WhereOptions } from "sequelize";
import { VisitorImage, VisitorImageCreationAttributes } from "../models/visitor_images";
import { sequelize } from "../config/postgreDB";
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { getSqlQueryExpression } from "../controllers/helper/filters";
import { getSchema } from '../helpers/utils';

export class VisitorImagesRepository {

    static async addVisitorImages(data: VisitorImageCreationAttributes[]): Promise<VisitorImage[]> {
        return await VisitorImage.bulkCreate(data);
    }

    static async getVisitorImages(offset: number, limit: number, filters: FilterItem[]): Promise<PaginatedResponse<VisitorImage>> {
        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "vi." + filter.columnField
                let valuePlaceHolder = filter.columnField
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        let query = `
            SELECT vi.*
            FROM "${getSchema()}".visitor_images vi
            WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
            ORDER BY vi.id DESC
        `

        if (limit > 0) { query += `OFFSET ${offset} LIMIT ${limit};` }

        const images: any = await sequelize.query(query, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })

        const countQuery = `
            SELECT count(*) as count
            FROM "${getSchema()}".visitor_images vi
            WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        `
        const resp = await sequelize.query(countQuery, {
            replacements: replacements,
        });
        return { offset: offset, total: (resp[0][0] as any)?.count, results: images as VisitorImage[] };
    }

    static async getVisitorImagesBySaplingId(sapling_id: string): Promise<VisitorImage[]> {
        return await VisitorImage.findAll({
            where: { sapling_id: sapling_id }
        });
    }

    static async deleteVisitorImages(imageIds: number[]): Promise<void> {
        await VisitorImage.destroy({ where: { id: { [Op.in]: imageIds } } })
    }
}