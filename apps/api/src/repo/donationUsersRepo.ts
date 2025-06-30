import { QueryTypes, WhereOptions, where } from "sequelize";
import { sequelize } from "../config/postgreDB";
import { DonationUser, DonationUserAttributes, DonationUserCreationAttributes } from "../models/donation_user";
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { getSqlQueryExpression } from "../controllers/helper/filters";
import { getSchema } from '../helpers/utils';

export class DonationUserRepository {
  static async getDonationUsers(offset: number, limit: number, filters?: FilterItem[]): Promise<PaginatedResponse<DonationUser>> {
    let whereConditions: string = "";
    let replacements: any = {}

    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        let columnField = "du." + filter.columnField
        if (filter.columnField === "recipient_name") {
          columnField = "ru.name"
        } else if (filter.columnField === "recipient_name") {
          columnField = "ru.name"
        } else if (filter.columnField === "assignee_name") {
          columnField = "au.name"
        } else if (filter.columnField === "assignee_email") {
          columnField = "au.email"
        }
        const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
        whereConditions = whereConditions + " " + condition + " AND";
        replacements = { ...replacements, ...replacement }
      })
      whereConditions = whereConditions.substring(0, whereConditions.length - 3);
    }

    const getQuery = `
      SELECT du.*, 
      ru."name" as recipient_name, ru.email as recipient_email, ru.phone as recipient_phone,
      au."name" as assignee_name, au.email as assignee_email, au.phone as assignee_phone,
      ur.relation, count(t.id) as assigned_trees
      FROM "${getSchema()}".donation_users du 
      JOIN "${getSchema()}".users ru ON ru.id = du.recipient
      JOIN "${getSchema()}".users au ON au.id = du.assignee
      LEFT JOIN "${getSchema()}".user_relations ur ON ur.primary_user = du.recipient AND ur.secondary_user = du.assignee
      LEFT JOIN "${getSchema()}".trees t ON t.gifted_to = du.recipient AND t.assigned_to = du.assignee AND t.donation_id = du.donation_id
      WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
      GROUP BY du.id, ru.id, au.id, ur.id
      ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
    `;

    const countQuery = `
      SELECT count(distinct du.id)
      FROM "${getSchema()}".donation_users du 
      JOIN "${getSchema()}".users ru ON ru.id = du.recipient
      JOIN "${getSchema()}".users au ON au.id = du.assignee
      LEFT JOIN "${getSchema()}".user_relations ur ON ur.primary_user = du.recipient AND ur.secondary_user = du.assignee
      LEFT JOIN "${getSchema()}".trees t ON t.gifted_to = du.recipient AND t.assigned_to = du.assignee AND t.donation_id = du.donation_id
      WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
    `;

    const [donationUsers, countResp] = await Promise.all([
      sequelize.query(getQuery, {
        type: QueryTypes.SELECT,
        replacements
      }),
      sequelize.query(countQuery, {
        type: QueryTypes.SELECT,
        replacements,
      })
    ]);
    
    return {
      offset: offset,
      total: parseInt((countResp[0] as any).count),
      results: donationUsers as any[],
    };
  }

  static async getAllDonationUsers(donationId: number) {
    const resp = await this.getDonationUsers(0, -1, [{ columnField: 'donation_id', operatorValue: 'equals', value: donationId }]) 
    return resp.results;
  }

  static async createDonationUsers(data: DonationUserCreationAttributes[], returning: boolean = false) {
    data.forEach(item => {
      item.created_at = new Date();
      item.updated_at = new Date();
    })
    return await DonationUser.bulkCreate(data, { returning: returning });
  }

  static async updateDonationUsers(fields: Partial<DonationUserAttributes>, whereClause: WhereOptions<DonationUser>) {
    await DonationUser.update(fields, { where: whereClause });
  }

  static async deleteDonationUsers(whereClause: WhereOptions<DonationUser>) {
    await DonationUser.destroy({ where: whereClause }); 
  }

}
