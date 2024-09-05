import { QueryTypes } from "sequelize";
import { sequelize } from "../config/postgreDB";
import { DonationUser, DonationUserCreationAttributes } from "../models/donation_user";

export class DonationUserRepository {
  static async getDonationUsers(donationId: number) {
    const getQuery = `
            SELECT u.user_id, u.gifted_trees, count(t.id) as assigned_trees
            FROM '14trees_2'.donation_users u 
            LEFT JOIN '14trees_2'.trees t ON t.assigned_to = u.user_id AND t.donation_id = u.donation_id
            WHERE u.donation_id = ${donationId}
            GROUP BY u.user_id, u.gifted_trees
        `;

    return await sequelize.query(getQuery, {
      type: QueryTypes.SELECT,
    });
  }

  static async createDonationUsers(data: DonationUserCreationAttributes[]) {
    await DonationUser.bulkCreate(data, { returning: false });
  }
  
}
