import { Op, QueryTypes, WhereOptions } from 'sequelize';
import { User, UserAttributes, UserCreationAttributes } from '../models/user';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { sequelize } from '../config/postgreDB';

export const getUserId = (name:string, email: string) => {
    let userId = name.toLowerCase() + email.toLowerCase();
    userId = userId.replace(/[^A-Z0-9@.]+/ig, "");

    return userId;
}

export const getUserDocumentFromRequestBody = (reqBody: any): UserCreationAttributes => {
    let userId = getUserId(reqBody.name, reqBody.email)
    const birthDate = new Date(reqBody.birth_date);
    return  {
        name: reqBody.name,
        phone: reqBody.phone,
        email: reqBody.email,
        user_id: userId,
        birth_date: isNaN(birthDate?.getDate()) ? null : birthDate,
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

    public static async getUsers(offset: number, limit: number, filters: FilterItem[]): Promise<PaginatedResponse<User>> {
        let whereConditions: string = "";
        let replacements: any = {}

        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "u." + filter.columnField
                if (filter.columnField === "group_id") {
                    columnField = "ug.group_id"
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereConditions = whereConditions + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereConditions = whereConditions.substring(0, whereConditions.length - 3);
        }

        const getQuery = `
            SELECT u.*, ug.created_at as user_group_created_at 
            FROM "14trees".users u 
            LEFT JOIN "14trees".user_groups ug ON u.id = ug.user_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            OFFSET ${offset} LIMIT ${limit};
        `

        const countQuery = `
            SELECT COUNT(*) 
            FROM "14trees".users u 
            LEFT JOIN "14trees".user_groups ug ON u.id = ug.user_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
        `

        const users: any = await sequelize.query(getQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })

        const countUsers: any = await sequelize.query(countQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        const totalResults = parseInt(countUsers[0].count)

        return {
            offset: offset,
            total: totalResults,
            results: users
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

    public static async usersCount(): Promise<number> {
        return await User.count()
    }
}