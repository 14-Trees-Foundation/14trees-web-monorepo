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

}