import { Op, QueryTypes } from 'sequelize';
import { VisitUsers, VisitUsersCreationAttributes } from '../models/visit_users';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { User } from '../models/user';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { sequelize } from '../config/postgreDB';

export class VisitUsersRepository {

    static async getVisitUsers(visitId: number, offset: number, limit: number, filters: FilterItem[]): Promise<PaginatedResponse<User>> {
        // const results = await VisitUsers.findAll({
        //     where: { user_id: userId, visit_id: visitId },
        // });
        // return results;

        let whereConditions: string = "";
        let replacements: any = {}

        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "u." + filter.columnField
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereConditions = whereConditions + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereConditions = whereConditions.substring(0, whereConditions.length - 3);
        }

        const getQuery = `
            SELECT u.*, vg.created_at as visit_user_created_at 
            FROM "14trees_2".users u 
            JOIN "14trees_2".visit_users vg ON u.id = vg.user_id
            WHERE vg.visit_id = ${visitId} ${whereConditions !== "" ? "AND " + whereConditions : ""}
            ORDER BY u.id DESC
            OFFSET ${offset} LIMIT ${limit};
        `

        const countQuery = `
            SELECT COUNT(*) 
            FROM "14trees_2".users u 
            JOIN "14trees_2".visit_users vg ON u.id = vg.user_id
            WHERE vg.visit_id = ${visitId} ${whereConditions !== "" ? "AND " + whereConditions : ""};
        `

        const users: any = await sequelize.query(getQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })

        const countUsers: any = await sequelize.query(countQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        const totalResults = parseInt(countUsers[0].count)

        return {
            offset: offset,
            total: totalResults,
            results: users
        };
    }

    static async addUser(userId: number, visitId: number): Promise<VisitUsers> {
        const visitUserGroupData: VisitUsersCreationAttributes = {
            user_id: userId,
            visit_id: visitId,
            created_at: new Date(),
        };

        const response = VisitUsers.create(visitUserGroupData);
        return response;
    }

    static async bulkAddVisitUsers(userIds: number[], visitId: number): Promise<VisitUsers[]> {
        const visituserGroupsData: VisitUsersCreationAttributes[] = [];
        userIds.forEach(userId => {
            visituserGroupsData.push({

                visit_id: visitId,
                user_id: userId,
                created_at: new Date(),
            })
        });

        const response = VisitUsers.bulkCreate(visituserGroupsData);
        return response;
    }

    static async deleteVisitUsers(userIds: number[], visitId: number): Promise<number> {
        const response = await VisitUsers.destroy({ where: { user_id: { [Op.in]: userIds }, visit_id: visitId } });
        return response;
    }

    public static async changeUser(primaryUser: number, secondaryUser: number): Promise<void> {
        const primaryUsersVisits = await VisitUsers.findAll({ where: { user_id: primaryUser } });
        const secondaryUsersVisits = await VisitUsers.findAll({ where: { user_id: secondaryUser } });

        for (const visit of secondaryUsersVisits) {
            const idx = primaryUsersVisits.findIndex(userVisit => userVisit.visit_id === visit.visit_id);
            if (idx === -1) {
                const visitId = visit.visit_id
                const date = visit.created_at
                

                const visitUserGroupData: VisitUsersCreationAttributes = {
                    user_id: primaryUser,
                    visit_id: visitId,
                    created_at: date,
                };
        
                await VisitUsers.create(visitUserGroupData);
            }

            await visit.destroy()
        }
    }

}