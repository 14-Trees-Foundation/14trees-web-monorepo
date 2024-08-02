import { Op, QueryTypes } from "sequelize";
import {
  DonationEventUser,
  DonationEventUserCreationAttributes,
} from "../models/donation_event_user";
import { sequelize } from "../config/postgreDB";

export class DonationEventUserRepository {
  static async getDonationEventUsers(donationEventId: number) {
    const getQuery = `
            SELECT u.user_id, u.gifted_trees, count(t.id) as assigned_trees
            FROM "14trees_2".donation_event_users u 
            LEFT JOIN "14trees_2".trees t ON t.assigned_to = u.user_id AND t.donation_event_id = u.donation_event_id
            WHERE u.donation_event_id = ${donationEventId}
            GROUP BY u.user_id
        `;

    return await sequelize.query(getQuery, {
      type: QueryTypes.SELECT,
    });
  }
}
