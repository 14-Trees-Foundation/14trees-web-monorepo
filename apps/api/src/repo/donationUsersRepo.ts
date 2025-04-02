import { QueryTypes, WhereOptions, where } from "sequelize";
import { sequelize } from "../config/postgreDB";
import { DonationUser, DonationUserCreationAttributes } from "../models/donation_user";

export class DonationUserRepository {
  static async getDonationUsers(donationId: number): Promise<DonationUser[]> {
    const getQuery = `
            SELECT du.*, 
            ru."name" as recipient_name, ru.email as recipient_email, ru.phone as recipient_phone,
            au."name" as assignee_name, au.email as assignee_email, au.phone as assignee_phone,
            ur.relation, count(t.id) as assigned_trees
            FROM "14trees_2".donation_users du 
            JOIN "14trees_2".users ru ON ru.id = du.recipient
            JOIN "14trees_2".users au ON au.id = du.assignee
            LEFT JOIN "14trees_2".user_relations ur ON ur.primary_user = du.recipient AND ur.secondary_user = du.assignee
            LEFT JOIN "14trees_2".trees t ON t.gifted_to = du.recipient AND t.assigned_to = du.assignee AND t.donation_id = du.donation_id
            WHERE du.donation_id = ${donationId}
            GROUP BY du.id, ru.id, au.id, ur.id;
        `;

    const resp: any[] = await sequelize.query(getQuery, {
      type: QueryTypes.SELECT,
    });

    return resp;
  }

  static async createDonationUsers(data: DonationUserCreationAttributes[]) {
    data.forEach(item => {
      item.created_at = new Date();
      item.updated_at = new Date();
    })
    await DonationUser.bulkCreate(data, { returning: false });
  }

  static async updateDonationUsers(fields: any, whereClause: WhereOptions<DonationUser>) {
    await DonationUser.update(fields, { where: whereClause });
  }

  static async deleteDonationUsers(whereClause: WhereOptions<DonationUser>) {
    await DonationUser.destroy({ where: whereClause });
  }
  
}
