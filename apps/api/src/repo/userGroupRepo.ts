import { UserGroup, UserGroupAttributes, UserGroupCreationAttributes } from '../models/user_group';

export class UserGroupRepository {
    static async getUserGroups(offset: number = 0, limit: number = 20): Promise<UserGroup[]> {
        const results = await UserGroup.findAll({
            offset: Number(offset),
            limit: Number(limit),
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

    // static async updateUserGroup(data: UserGroupAttributes): Promise<UserGroup> {
    //     const org = await UserGroup.findByPk(data.id);
    //     if (!org) {
    //         throw new Error('UserGroupanization not found for given id');
    //     }

    //     const updatedUserGroup = org.update(orgData);
    //     return updatedUserGroup;
    // }

    static async deleteUserGroup(userId: string, groupId: string): Promise<number> {
        const response = await UserGroup.destroy({ where: { user_id: userId, group_id: groupId } });
        return response;
    }
}
