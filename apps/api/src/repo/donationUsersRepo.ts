import { QueryTypes, WhereOptions, where } from "sequelize";
import { sequelize } from "../config/postgreDB";
import { DonationUser, DonationUserCreationAttributes } from "../models/donation_user";

export class DonationUserRepository {
  static async getDonationUsers(donationId: number) {
    const getQuery = `
            SELECT du.*, u."name" as user_name, u.email as user_email, count(t.id) as assigned_trees
            FROM "14trees_2".donation_users du 
            JOIN "14trees_2".users u ON u.id = du.user_id 
            LEFT JOIN "14trees_2".trees t ON t.assigned_to = du.user_id AND t.donation_id = du.donation_id
            WHERE du.donation_id = ${donationId}
            GROUP BY du.id, u.id
        `;

    return await sequelize.query(getQuery, {
      type: QueryTypes.SELECT,
    });
  }

  static async createDonationUsers(data: DonationUserCreationAttributes[]) {
    await DonationUser.bulkCreate(data, { returning: false });
  }


  static async deleteDonationUsers(whereClause: WhereOptions<DonationUser>) {
    await DonationUser.destroy({ where: whereClause });
  }
  
}
