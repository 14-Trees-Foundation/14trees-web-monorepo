import { Op, QueryTypes, WhereOptions } from 'sequelize';
import { User, UserAttributes, UserCreationAttributes } from '../models/user';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { sequelize } from '../config/postgreDB';

export const getUserId = (name: string, email: string) => {
    let userId = name.toLowerCase() + email.toLowerCase();
    userId = userId.replace(/[^A-Z0-9@.]+/ig, "");

    return userId;
}

export const getUserDocumentFromRequestBody = (reqBody: any): UserCreationAttributes => {
    let userId = getUserId(reqBody.name, reqBody.email)
    const birthDate = new Date(reqBody.birth_date);
    return {
        name: reqBody.name.trim(),
        phone: reqBody.phone ? reqBody.phone.trim() : null,
        email: reqBody.email.trim(),
        user_id: userId,
        birth_date: isNaN(birthDate?.getDate()) ? null : birthDate,
        created_at: new Date(),
        updated_at: new Date(),
        communication_email: reqBody.communication_email?.trim() && !reqBody.communication_email.trim().endsWith("@14trees")
            ? reqBody.communication_email.trim()
            : null
    } as UserCreationAttributes;
}

export class UserRepository {
    public static async addUser(data: any): Promise<User> {
        let obj: UserCreationAttributes = getUserDocumentFromRequestBody(data);
        const user = await User.create(obj);
        return user;
    }

    public static async bulkAddUsers(users: UserCreationAttributes[]): Promise<User[]> {
        // avoid adding duplicate emails
        const existingUsers = await User.findAll({
            where: {
                email: { [Op.in]: users.map(user => user.email) }
            }
        });
        const existingEmailsMap: Map<string, boolean> = new Map();
        existingUsers.forEach(user => existingEmailsMap.set(user.email, true));

        const filteredUsers = users.filter(user => !existingEmailsMap.has(user.email));
        const newUsers = await User.bulkCreate(filteredUsers);
        return [...existingUsers, ...newUsers];
    }

    public static async updateUser(data: UserAttributes): Promise<User> {
        const user = await User.findByPk(data.id);
        if (!user) {
            throw new Error("User not found")
        }

        const emailUser = await User.findOne({
            where: {
                email: data.email,
            }
        });

        if (emailUser && emailUser.id !== data.id) {
            throw new Error("Email already exists");
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

    public static async updateUsers(fields: Partial<UserAttributes>, whereClause: WhereOptions<User>): Promise<number> {
        const [numberOfAffectedRows] = await User.update(fields, {
            where: whereClause
        });
        return numberOfAffectedRows;
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
            ORDER BY u.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
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
        const whereClause: WhereOptions<User> = {
            [Op.or]: [
                { name: { [Op.iLike]: `%${searchStr}%` } },
                { phone: { [Op.iLike]: `%${searchStr}%` } },
                { email: { [Op.iLike]: `%${searchStr}%` } },
                { communication_email: { [Op.iLike]: `%${searchStr}%` } },
            ]
        };

        return await User.findAll({
            where: whereClause,
            offset,
            limit,
        });
    }

    public static async getUser(name: string, email: string): Promise<User | null> {
        const userId = getUserId(name, email);
        return await User.findOne({
            where: { user_id: userId },
        });
    }

    public static async deleteUser(userId: number): Promise<number> {
        const resp = await User.destroy({ where: { id: userId } });
        return resp;
    }

    public static async usersCount(): Promise<number> {
        return await User.count()
    }

    public static async search(searchStr: string): Promise<any[]> {

        const { condition, replacement } = getSqlQueryExpression("u.name", "contains", "name", searchStr.split(" ").join("%"));

        const getQuery = `
            SELECT u.id, u.name, 
                count(distinct mt.id) as sponsored_trees,
                jsonb_agg(distinct jsonb_build_object('sapling_id', t.sapling_id, 'assigned_at', t.assigned_at, 'profile_image', t.user_tree_image)) AS assigned_trees
            FROM "14trees".users u
            left JOIN "14trees".trees t ON t.assigned_to = u.id
            left JOIN "14trees".trees mt ON mt.sponsored_by_user = u.id
            WHERE ${condition}
            GROUP BY u.id;
        `

        return await sequelize.query(getQuery, {
            replacements: replacement,
            type: QueryTypes.SELECT
        })
    }

    public static async getDeletedUsersFromList(userIds: number[]): Promise<number[]> {
        const query = `SELECT num
        FROM unnest(array[:user_ids]::int[]) AS num
        WHERE num NOT IN (
            SELECT u.id
            FROM "14trees".users as u
        );`

        const result = await sequelize.query(query, {
            replacements: { user_ids: userIds },
            type: QueryTypes.SELECT
        })

        return result.map((user: any) => user.num);
    }

    public static async upsertUser(data: any): Promise<User> {
        let obj: UserCreationAttributes = getUserDocumentFromRequestBody(data);
        const users = await User.findAll({
            where: {
                email: obj.email
            }
        });

        if (users.length > 0) {
            if (data.id) return await users[0].update(obj);
            if (obj.phone != users[0].phone) return await users[0].update(obj);
            return users[0];
        }

        return await User.create(obj);
    }

    public static async upsertUserByEmailAndName(data: any): Promise<User> {
        let obj: UserCreationAttributes = getUserDocumentFromRequestBody(data);
        const users = await User.findAll({
            where: {
                email: obj.email
            }
        });

        if (users.length > 0) {

            if (data.id)
                return await users[0].update(obj);

            else if (users[0].name !== obj.name && !obj.email.endsWith("@14trees")) {
                obj.communication_email = obj.email;
                obj.email = obj.name.split(" ").join(".") + "@14trees";

                const user = await User.findOne({
                    where: {
                        email: obj.email
                    }
                });

                if (user)
                    return user.update(obj);

                return await User.create(obj);
            }
            return users[0];
        }

        return await User.create(obj);
    }
}
