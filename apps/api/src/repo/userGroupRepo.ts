import { UserGroup, UserGroupCreationAttributes } from '../models/user_group';

export class UserGroupRepository {
    static async getUserGroup(userId: string, groupId: string): Promise<UserGroup[]> {
        const results = await UserGroup.findAll({
            where: { user_id: userId, group_id: groupId },
        });
        return results;
    }

    static async addUserGroup(data: any): Promise<UserGroup> {
        const userGroupData: UserGroupCreationAttributes = {
            user_id: data.user_id,
            group_id: data.group_id,
            created_at: new Date(),
            updated_at: new Date(),
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
                updated_at: new Date() 
            })
        });

        const userGroups = UserGroup.bulkCreate(userGroupsData);
        return userGroups;
    }

    static async deleteUserGroup(userId: string, groupId: string): Promise<number> {
        const response = await UserGroup.destroy({ where: { user_id: userId, group_id: groupId } });
        return response;
    }
}
