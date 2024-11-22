import { WhereOptions } from "sequelize";
import { UserRelation, UserRelationCreationAttributes } from "../models/user_relation";


export class UserRelationRepository {

    public static async createUserRelation(data: UserRelationCreationAttributes): Promise<UserRelation> {
        const relation = await UserRelation.findOne({
            where: {
                primary_user: data.primary_user,
                secondary_user: data.secondary_user,
            }
        })

        if (relation && relation.relation !== data.relation) {
            relation.relation = data.relation;
            relation.updated_at = new Date();
            await relation.save();
        } else if (relation) {
            return relation;
        }

        return await UserRelation.create(data);
    }

    public static async updateUserRelations(fields: any, whereClause: WhereOptions<UserRelation>): Promise<void> {
        await UserRelation.update(fields, { where: whereClause });
    }

}