import { Op } from 'sequelize';
import { VisitUsers, VisitUsersCreationAttributes } from '../models/visit_users';

export class VisitUsersRepository {

  static async getVisitUsers(userId: number, visitId: number): Promise<VisitUsers[]> {
    const results = await VisitUsers.findAll({
        where: { user_id: userId, visit_id: visitId },
    });
    return results;
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
  userIds.forEach( userId => {
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
    const response = await VisitUsers.destroy({ where: { user_id: {[Op.in]: userIds}, visit_id: visitId } });
    return response;
}

}