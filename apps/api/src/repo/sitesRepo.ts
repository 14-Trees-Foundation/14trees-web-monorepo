import { Op } from 'sequelize';
import { Site, SiteAttributes, SiteCreationAttributes } from '../models/sites';

export class SiteRepository {
    static async getSites(offset: number = 0, limit: number = 20): Promise<Site[]> {
        const sites = await Site.findAll({
            offset: Number(offset),
            limit: Number(limit),
        });
        return sites;
    }

    // static async addSite(data: any): Promise<Site> {
    //     const siteData: SiteCreationAttributes = {
    //         name: data.name,
    //         date_added: new Date(),
    //         desc: data.desc || '',
    //         type: data.type || '',
    //     };

    //     const site = Site.create(siteData);
    //     return site;
    // }

    static async updateSite(siteData: SiteAttributes): Promise<Site> {
        const site = await Site.findByPk(siteData.id);
        if (!site) {
            throw new Error('Site not found for given id');
        }

        const updatedSite = site.update(siteData);
        return updatedSite;
    }

    static async deleteSite(siteId: string): Promise<number> {
        const response = await Site.destroy({ where: { id: siteId } });
        return response;
    }
}
