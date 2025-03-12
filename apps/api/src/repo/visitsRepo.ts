import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { Visit, VisitAttributes, VisitCreationAttributes } from '../models/visits';
import { QueryTypes, WhereOptions } from 'sequelize';

export class VisitRepository {
    public static async updateVisit(visitData: VisitAttributes): Promise<Visit> {
        const visit = await Visit.findByPk(visitData.id);
        if (!visit) {
            throw new Error("Visit doesn't exist");
        }

        visitData.updated_at = new Date();
        const updatedPlot = await visit.update(visitData);
        return updatedPlot;
    }

    public static async updateVisits(fields: any, whereClause: WhereOptions<Visit>): Promise<number> {
        const [resp] =  await Visit.update(fields, {
            where: whereClause,
            returning: false,
        })

        return resp;
    }


    public static async addVisit(visitData: VisitCreationAttributes): Promise<Visit> {
        visitData.created_at = visitData.updated_at = new Date();
        const newVisit = Visit.create(visitData);
        return newVisit;
    }


    public static async getVisits(offset: number = 0, limit: number = 10, filters: FilterItem[]): Promise<PaginatedResponse<Visit>> {
        let whereConditions: string = "";
        let replacements: any = {}

        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "v." + filter.columnField
                if (filter.columnField === "site_name") {
                    columnField = "s.name_english"
                } else if (filter.columnField === "group_name") {
                    columnField = "g.name"
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereConditions = whereConditions + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereConditions = whereConditions.substring(0, whereConditions.length - 3);
        }

        const getQuery = `
            SELECT v.*, s.name_english as site_name, g.name as group_name, array_agg(distinct(vi.image_url)) AS visit_images, count(DISTINCT vu.user_id) as user_count
            FROM "14trees_2".visits v
            LEFT JOIN "14trees_2".visit_images vi ON v.id = vi.visit_id
            LEFT JOIN "14trees_2".visit_users vu ON v.id = vu.visit_id
            LEFT JOIN "14trees_2".sites s ON s.id = v.site_id
            LEFT JOIN "14trees_2".groups g ON g.id = v.group_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            GROUP BY v.id, g.id, s.id
            ORDER BY v.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const countQuery = `
            SELECT COUNT(*) 
            FROM "14trees_2".visits v
            LEFT JOIN "14trees_2".sites s ON s.id = v.site_id
            LEFT JOIN "14trees_2".groups g ON g.id = v.group_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
        `

        let visits: any = await sequelize.query(getQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        // visit_images array might have null values
        visits = visits.map((visit: any) => {
            visit.visit_images = visit.visit_images.filter((image: any) => image !== null);
            return visit;
        })


        const countVisits: any = await sequelize.query(countQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        const totalResults = parseInt(countVisits[0].count)

        return {
            offset: offset,
            total: totalResults,
            results: visits
        };
    }

    public static async deleteVisit(visitId: string): Promise<number> {
        const resp = await Visit.destroy({ where: { id: visitId } });
        return resp;
    }

    public static async getVisit(id: number): Promise<Visit | null> {
        return await Visit.findByPk(id);
    }


    public static async getDeletedVisitsFromList(visitIds: number[]): Promise<number[]> {
        const query = `SELECT num
    FROM unnest(array[:visit_ids]::int[]) AS num
    LEFT JOIN "14trees_2".visits AS v
    ON num = v.id
    WHERE v.id IS NULL;`

        const result = await sequelize.query(query, {
            replacements: { visit_ids: visitIds },
            type: QueryTypes.SELECT
        })

        return result.map((row: any) => row.num);
    }

}
