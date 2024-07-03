import { Op } from 'sequelize';
import { Org, OrgAttributes, OrgCreationAttributes } from '../models/org'; // Import your Sequelize model for Org

export class OrgRepository {
    static async getOrgs(query: any, offset: number = 0, limit: number = 20): Promise<Org[]> {
        const whereClause: Record<string, any> = {};
        if (query?.name) {
            whereClause.name = { [Op.iLike]: `%${query.name}%` };
        }
        if (query?.type) {
            whereClause.type = { [Op.iLike]: `%${query.type}%` };
        }
        const orgs = await Org.findAll({
            where: whereClause,
            offset: Number(offset),
            limit: Number(limit),
        });
        return orgs;
    }

    static async addOrg(data: any): Promise<Org> {
        const orgData: OrgCreationAttributes = {
            id: "",      // TODO: Random ID generator (24 char)
            name: data.name,
            date_added: new Date(),
            desc: data.desc || '',
            type: data.type || '',
        };

        const org = Org.create(orgData);
        return org;
    }

    static async updateOrg(orgData: OrgAttributes): Promise<Org> {
        const org = await Org.findByPk(orgData.id);
        if (!org) {
            throw new Error('Organization not found for given id');
        }

        const updatedOrg = org.update(orgData);
        return updatedOrg;
    }

    static async deleteOrg(orgId: string): Promise<number> {
        const response = await Org.destroy({ where: { id: orgId } });
        return response;
    }
}
