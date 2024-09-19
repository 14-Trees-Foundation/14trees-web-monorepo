import { Op, QueryTypes, WhereOptions } from "sequelize";
import { VisitImage, VisitImageCreationAttributes } from "../models/visit_images";
import { sequelize } from "../config/postgreDB";
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { getSqlQueryExpression } from "../controllers/helper/filters";

export class VisitImagesRepository {

    static async addVisitImages(data: VisitImageCreationAttributes[]): Promise<VisitImage[]> {
        return await VisitImage.bulkCreate(data);
    }

    static async getVisitImages(offset: number, limit: number, filters: FilterItem[]): Promise<PaginatedResponse<VisitImage>> {
        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "vi." + filter.columnField
                let valuePlaceHolder = filter.columnField
                if (filter.columnField === "site_id") {
                    columnField = 'v.site_id'
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        let query = `
            SELECT vi.*
            FROM "14trees_2".visit_images vi
            JOIN "14trees_2".visits v ON v.id = vi.visit_id
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
            FROM "14trees_2".visit_images vi
            JOIN "14trees_2".visits v ON v.id = vi.visit_id
            WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        `
        const resp = await sequelize.query(countQuery, {
            replacements: replacements,
        });
        return { offset: offset, total: (resp[0][0] as any)?.count, results: images as VisitImage[] };
    }

    public static async getDeletedVisitImagesFromList(visitImageIds: number[]): Promise<number[]> {
        const query = `SELECT num
            FROM unnest(array[:visit_image_ids]::int[]) AS num
            LEFT JOIN "14trees_2".visit_images AS v
            ON num = v.id
            WHERE v.id IS NULL;`

        const result = await sequelize.query(query, {
            replacements: { visit_image_ids: visitImageIds },
            type: QueryTypes.SELECT
        })

        return result.map((row: any) => row.num);
    }

    static async deleteVisitImages(imageIds: number[]): Promise<void> {
        await VisitImage.destroy({ where: { id: { [Op.in]: imageIds } } })
    }
}
