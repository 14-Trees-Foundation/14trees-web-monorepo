import { sequelize } from '../config/postgreDB';
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


    public static async addVisit(visitData: VisitCreationAttributes): Promise<Visit> {
        visitData.created_at = visitData.updated_at = new Date();
        const newVisit = Visit.create(visitData);
        return newVisit;
    }


    public static async getVisits(offset: number = 0, limit: number = 10, whereClause: WhereOptions): Promise<PaginatedResponse<Visit>> {

        const sites = await Visit.findAll({
            where: whereClause,
            offset: Number(offset),
            limit: Number(limit),
        });
        const count = await Visit.count({ where: whereClause });
        return { results: sites, total: count, offset: offset };
    }

    public static async deleteVisit(visitId: string): Promise<number> {
        const resp = await Visit.destroy({ where: { id: visitId } });
        return resp;
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