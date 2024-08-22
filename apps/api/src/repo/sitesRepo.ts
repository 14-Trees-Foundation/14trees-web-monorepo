import { QueryTypes, WhereOptions } from 'sequelize';
import { Site, SiteAttributes, SiteCreationAttributes } from '../models/sites';
import { PaginatedResponse } from '../models/pagination';
import { UploadFileToS3 } from '../controllers/helper/uploadtos3';
import { sequelize } from '../config/postgreDB';

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

    public static async getDeletedSitesFromList(siteIds: number[]): Promise<number[]> {
        const query = `SELECT num
        FROM unnest(array[:site_ids]::int[]) AS num
        LEFT JOIN "14trees_2".sites AS s
        ON num = s.id
        WHERE s.id IS NULL;`
    
        const result = await sequelize.query(query, {
            replacements: { site_ids: siteIds },
            type: QueryTypes.SELECT
        })
    
        return result.map((row: any) => row.num);
    }

    public static async updateSitesDataUsingNotionData() {
        const query = `UPDATE "14trees_2".sites 
        SET 
            name_marathi = n."नाव (मराठी)",
            name_english  = n."Name",
            "owner" = n."Land Owner",
            land_type = n."Land Type",
            district = n."District",
            taluka = n."Taluka",
            village = n."Village",
            area_acres = n."Area Measured (Acres)",
            length_km = n."Length (Kms)",
            tree_count = n."Trees",
            unique_id = n."Unique Site Id",
            photo_album = n."Link",
            grove_type = n."Grove type",
            album = n."Album (1)",
            album_contains = n."Album contains",
            status = n."Status",
            remark = n."Remark",
            updated_at = now(),
            google_earth_link = array[n."Google Earth link"],
            account = n."Account",
            data_errors = n."Data errors"
        FROM notion_db n
        WHERE n.id = notion_id
          AND n."Tag" IN ('site-forest', 'site-school', 'site-NGO', 'site-road', 'site-gairan', 'site-Govt') 
          AND n."Name" IS NOT null;`

        await sequelize.query(query);
    }

    public static async insertNewSitesDataUsingNotionData() {
        const query = `INSERT INTO "14trees_2".sites (
            notion_id,
            name_marathi,
            name_english, 
            "owner", 
            land_type, 
            district, 
            taluka, 
            village, 
            area_acres, 
            length_km, 
            tree_count, 
            unique_id, 
            photo_album,
            grove_type, 
            album, 
            album_contains, 
            status, 
            remark, 
            created_at,
            updated_at,
            google_earth_link, 
            account, 
            data_errors
        )
        SELECT 
            n.id, 
            n."नाव (मराठी)", 
            n."Name", 
            n."Land Owner", 
            n."Land Type", 
            n."District", 
            n."Taluka", 
            n."Village", 
            n."Area Measured (Acres)", 
            n."Length (Kms)", 
            n."Trees", 
            n."Unique Site Id", 
            n."Link",
            n."Grove type", 
            n."Album (1)", 
            n."Album contains", 
            n."Status", 
            n."Remark", 
            now() as created_at, 
            now() as updated_at, 
            array["Google Earth link"], 
            n."Account", 
            n."Data errors"
        FROM notion_db n
        WHERE n."Tag" IN ('site-forest', 'site-school', 'site-NGO', 'site-road', 'site-gairan', 'site-Govt') 
          AND n."Name" IS NOT NULL
          AND n.id NOT IN (SELECT notion_id FROM "14trees_2".sites where notion_id is not null);`

        await sequelize.query(query);
    }
}
