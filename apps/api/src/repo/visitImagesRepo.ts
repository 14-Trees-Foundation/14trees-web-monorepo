import { QueryTypes, WhereOptions } from "sequelize";
import { VisitImage, VisitImageCreationAttributes } from "../models/visit_images";
import { sequelize } from "../config/postgreDB";
import { PaginatedResponse } from "../models/pagination";

export class VisitImagesRepository {

    static async addVisitImages(data: VisitImageCreationAttributes[]): Promise<VisitImage[]> {
        return await VisitImage.bulkCreate(data);
    }

    static async getVisitImages(offset: number, limit: number, whereClause: WhereOptions): Promise<PaginatedResponse<VisitImage>> {
        return {
            offset: offset,
            results: await VisitImage.findAll({ where: whereClause, offset: offset, limit: limit }),
            total: await VisitImage.count({ where: whereClause }),
        }
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
}
