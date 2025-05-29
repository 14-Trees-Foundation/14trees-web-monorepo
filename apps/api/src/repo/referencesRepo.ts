import { WhereOptions } from "sequelize";
import { Reference, ReferenceAttributes } from "../models/reference";

export class ReferencesRepository {

    public static async getReferences(whereClause: WhereOptions<ReferenceAttributes>): Promise<Reference[]> {
        const references = await Reference.findAll({
            where: whereClause,
        });

        return references;
    }

    public static async createReferece(rfr: string, c_key: string): Promise<Reference> {
        const reference = await Reference.create({
            rfr,
            c_key,
        });

        return reference;
    }

}