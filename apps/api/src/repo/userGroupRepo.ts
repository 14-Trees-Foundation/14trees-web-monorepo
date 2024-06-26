import { Op } from 'sequelize';
import { UserGroup, UserGroupCreationAttributes } from '../models/user_group';

export class UserGroupRepository {
    static async getUserGroup(userId: number, groupId: number): Promise<UserGroup[]> {
        const results = await UserGroup.findAll({
            where: { user_id: userId, group_id: groupId },
        });
        return results;
    }

    static async addUserGroup(userId: number, groupId: number): Promise<UserGroup> {
        const userGroupData: UserGroupCreationAttributes = {
            user_id: userId,
            group_id: groupId,
            created_at: new Date(),
        };

        const userGroup = UserGroup.create(userGroupData);
        return userGroup;
    }

    static async bulkAddUserGroups(userIds: number[], groupId: number): Promise<UserGroup[]> {
        const userGroupsData: UserGroupCreationAttributes[] = [];
        userIds.forEach( userId => {
            userGroupsData.push({ 
                user_id: userId, 
                group_id: groupId, 
                created_at: new Date(), 
            })
        });

        const userGroups = UserGroup.bulkCreate(userGroupsData);
        return userGroups;
    }

    static async deleteGroupUsers(userIds: number[], groupId: number): Promise<number> {
        const response = await UserGroup.destroy({ where: { user_id: {[Op.in]: userIds}, group_id: groupId } });
        return response;
    }

    public static async countUserGroups(userId: number): Promise<number> {
        return await UserGroup.count({ where: { user_id: userId } });
    }
}
