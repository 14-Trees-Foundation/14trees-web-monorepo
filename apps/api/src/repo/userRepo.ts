import { Op, QueryTypes, WhereOptions } from 'sequelize';
import { User, UserAttributes, UserCreationAttributes } from '../models/user';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { sequelize } from '../config/postgreDB';
import { getSchema } from '../helpers/utils';

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
        email: reqBody.email.trim().toLowerCase(),
        user_id: userId,
        birth_date: isNaN(birthDate?.getDate()) ? null : birthDate,
        created_at: new Date(),
        updated_at: new Date(),
        communication_email: reqBody.communication_email?.trim() && !reqBody.communication_email.trim().endsWith("@14trees")
            ? reqBody.communication_email.trim().toLowerCase()
            : null,
        pin: reqBody.pin ? reqBody.pin.trim() : null,
        roles: reqBody.roles && Array.isArray(reqBody.roles) && reqBody.roles.length > 0 ? reqBody.roles : null
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
            SELECT distinct on(u.id) u.*, ug.created_at as user_group_created_at 
            FROM "${getSchema()}".users u 
            LEFT JOIN "${getSchema()}".user_groups ug ON u.id = ug.user_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            ORDER BY u.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const countQuery = `
            SELECT COUNT(distinct u.id) 
            FROM "${getSchema()}".users u 
            LEFT JOIN "${getSchema()}".user_groups ug ON u.id = ug.user_id
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
    
    /**
     * Get a user by their ID
     * @param id The user's ID
     * @returns The user or null if not found
     */
    public static async getUserById(id: number): Promise<User | null> {
        return await User.findByPk(id);
    }

    public static async deleteUser(userId: number): Promise<number> {
        const resp = await User.destroy({ where: { id: userId } });
        return resp;
    }

    public static async usersCount(): Promise<number> {
        return await User.count()
    }

    public static async search(searchStr: string): Promise<{ users: any[], groups: any[] }> {
        const { condition: userCondition, replacement: userReplacement } = getSqlQueryExpression("u.name", "contains", "name", searchStr.split(" ").join("%"));
        const { condition: groupCondition, replacement: groupReplacement } = getSqlQueryExpression("g.name", "contains", "name", searchStr.split(" ").join("%"));

        // Search users
        const userQuery = `
            SELECT u.id, u.name, 'user' as type,
                (
                    SELECT COUNT(*)
                    FROM "${getSchema()}".trees mt
                    WHERE mt.sponsored_by_user = u.id
                ) as sponsored_trees,
                (
                    SELECT COUNT(*)
                    FROM "${getSchema()}".trees t
                    WHERE t.assigned_to = u.id
                ) as assigned_trees_count,
                (
                    SELECT t2.user_tree_image
                    FROM "${getSchema()}".trees t2
                    WHERE t2.assigned_to = u.id
                      AND t2.user_tree_image IS NOT NULL
                      AND t2.user_tree_image != ''
                    ORDER BY t2.assigned_at DESC
                    LIMIT 1
                ) as profile_image
            FROM "${getSchema()}".users u
            WHERE ${userCondition}
            LIMIT 100;
        `

        // Search groups
        const groupQuery = `
            SELECT g.id, g.name, g.type as group_type, 'group' as type,
                (
                    SELECT COUNT(*)
                    FROM "${getSchema()}".trees mt
                    WHERE mt.sponsored_by_group = g.id
                ) as sponsored_trees,
                g.logo_url as profile_image
            FROM "${getSchema()}".groups g
            WHERE ${groupCondition}
            LIMIT 100;
        `

        const [users, groups] = await Promise.all([
            sequelize.query(userQuery, {
                replacements: userReplacement,
                type: QueryTypes.SELECT
            }),
            sequelize.query(groupQuery, {
                replacements: groupReplacement,
                type: QueryTypes.SELECT
            })
        ]);

        return { users, groups };
    }

    public static async getDeletedUsersFromList(userIds: number[]): Promise<number[]> {
        const query = `SELECT num
        FROM unnest(array[:user_ids]::int[]) AS num
        WHERE num NOT IN (
            SELECT u.id
            FROM "${getSchema()}".users as u
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

            else if (users[0].name.trim().toLowerCase() !== obj.name.trim().toLowerCase() && !obj.email.endsWith("@14trees")) {
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
