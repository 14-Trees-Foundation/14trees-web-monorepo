import { WhereOptions } from 'sequelize';
import { Site, SiteAttributes, SiteCreationAttributes } from '../models/sites';
import { PaginatedResponse } from '../models/pagination';
import { UploadFileToS3 } from '../controllers/helper/uploadtos3';

export class SiteRepository {
    static async getSites(offset: number = 0, limit: number = 20, whereClause: WhereOptions): Promise<PaginatedResponse<Site>> {
        const sites = await Site.findAll({
            where: whereClause,
            offset: Number(offset),
            limit: Number(limit),
        });
        const count = await Site.count({ where: whereClause });
        return { results: sites, total: count, offset: offset };
    }

    static async addSite(siteData: SiteCreationAttributes): Promise<Site> {
        siteData.created_at = new Date();
        siteData.updated_at = new Date();
        const site = Site.create(siteData);
        return site;
    }

    static async updateSite(siteData: SiteAttributes ,  files?: Express.Multer.File[]): Promise<Site> {

         //upload google earth file
         let googleEarthAwsUrl: string[] = [];
         if(files && files.length>0){
             files.forEach(async(file)=>{
                const url = await UploadFileToS3(files[0].filename, "sites");
                console.log("Uploaded URL ..." , url);
                googleEarthAwsUrl.push(url);
             })
             siteData.google_earth_link = googleEarthAwsUrl;
             console.log("Google Earth Link Data: ", siteData.google_earth_link );
        }
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
