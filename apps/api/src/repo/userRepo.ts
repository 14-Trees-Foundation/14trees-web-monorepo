import { Op, WhereOptions } from 'sequelize';
import { User, UserAttributes, UserCreationAttributes } from '../models/user';
import { PaginatedResponse } from '../models/pagination';

export const getUserId = (name:string, email: string) => {
    let userId = name.toLowerCase() + email.toLowerCase();
    userId = userId.replace(/[^A-Z0-9@.]+/ig, "");

    return userId;
}

export const getUserDocumentFromRequestBody = (reqBody: any): UserCreationAttributes => {
    let userId = getUserId(reqBody.name, reqBody.email)

    return  {
        name: reqBody.name,
        phone: reqBody.phone,
        email: reqBody.email,
        user_id: userId,
        birth_date: reqBody.birth_date,
        created_at: new Date(),
        updated_at: new Date(),
    } as UserCreationAttributes;
}

export class UserRepository {
    public static async addUser(data: any): Promise<User> {
        let obj: UserCreationAttributes = getUserDocumentFromRequestBody(data);
        const user = await User.create(obj);
        return user;
    }

    public static async bulkAddUsers(users: UserCreationAttributes[]): Promise<User[]> {
        const user = await User.bulkCreate(users);
        return user;
    }

    public static async updateUser(data: UserAttributes): Promise<User> {
        const user = await User.findByPk(data.id);
        if (!user) {
            throw new Error("User not found")
        }

        // user validation/invalidation update logic
        if (data.status === "system_invalidated" || data.status === "user_validated") {
            data.last_system_updated_at = new Date();
        } else {
            data.status = undefined;
            data.status_message = undefined;
            data.last_system_updated_at = undefined;
        }
        data.updated_at = new Date();

        const updatedUser = await user.update(data);
        return updatedUser;
    }

    public static async getUsers(offset: number, limit: number, whereClause: WhereOptions): Promise<PaginatedResponse<User>> {
        return {
            offset: offset,
            total: await User.count({ where: whereClause }),
            results: await User.findAll({
                where: whereClause,
                offset,
                limit
            })
        };
    }

    public static async searchUsers(searchStr: string, offset: number, limit: number): Promise<User[]> {
        const whereClause: Record<string, any> = { [Op.or]: [
            { name: {[Op.iLike]:`%${searchStr}%` } },
            { phone: {[Op.iLike]:`%${searchStr}%` } },
            { email: {[Op.iLike]:`%${searchStr}%` } },
        ]};
    
        return await User.findAll({
            where: whereClause,
            offset,
            limit,
        });
    }

    public static async getUser(name: string, email: string): Promise<User | null> {
        const userId = getUserId(name, email);
        return await User.findOne({
            where: { user_id: userId},
        });
    }

    public static async deleteUser(userId: number): Promise<number> {
        const resp = await User.destroy({ where: { id: userId } });
        return resp;
    }

    public static async userCount(): Promise<number> {
        return await User.count()
    }
}
