import { QueryTypes, WhereOptions } from "sequelize";
import { sequelize } from "../config/postgreDB";
import { View, ViewAttributes, ViewCreationAttributes, ViewPermission, ViewPermissionCreationAttributes } from "../models/permissions";
import { getSchema } from '../helpers/utils';

export class ViewPermissionRepository {

    public static async getViewById(viewId: string): Promise<View | null> {
        const view = await View.findOne({ where: { view_id: viewId} });
        return view;
    }

    public static async getViewByPk(viewId: number): Promise<View | null> {
        const view = await View.findByPk(viewId);
        return view;
    }

    public static async getViewByPath(path: string): Promise<View | null> {
        const query = `
            SELECT v.*, json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email)) as users
            FROM "${getSchema()}".views v
            LEFT JOIN "${getSchema()}".view_permissions vp on vp.view_id = v.id
            JOIN "${getSchema()}".users u on vp.user_id = u.id
            WHERE v.path = :path
            GROUP BY v.id
        `

        const resp: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { path: path }
        })

        if (resp.length === 0) return null;

        const view = resp[0];
        view.users = view.users.filter((item: any) => item.id);

        return view;
    }

    public static async createView(viewId: string, name: string, path: string, metadata: Record<string, any> | null): Promise<View> {
        const request: ViewCreationAttributes = {
            view_id: viewId,
            name: name,
            path: path,
            metadata: metadata,
            created_at: new Date(),
            updated_at: new Date(),
        }
        const view = await View.create(request);
        return view;
    }

    public static async updateView(viewData: ViewAttributes): Promise<View | null> {
        const view = await View.findByPk(viewData.id);
        if (!view) return null;

        viewData.updated_at = new Date();
        return await view.update(viewData);
    }

    public static async getUserPermissionByIds(viewId: number, userId: number): Promise<ViewPermission | null> {
        return await ViewPermission.findOne({ where: { view_id: viewId, user_id: userId}});
    }

    public static async getViewUsers(whereClause: WhereOptions<ViewPermission>): Promise<ViewPermission[]> {
        return await ViewPermission.findAll({ where: whereClause});
    }

    public static async addViewUsers(viewId: number, userIds: number[]): Promise<void> {
        const requests: ViewPermissionCreationAttributes[] = userIds.map(userId => {
            return {
                view_id: viewId,
                user_id: userId,
                created_at: new Date(),
                updated_at: new Date(),
            }
        })
        
        await ViewPermission.bulkCreate(requests);
    }

    public static async deleteViewUsers(whereClause: WhereOptions<ViewPermission>): Promise<void> {
        await ViewPermission.destroy({ where: whereClause });
    }
}