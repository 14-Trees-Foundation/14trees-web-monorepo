import { QueryTypes, WhereOptions, or } from 'sequelize';
import { Site, SiteAttributes, SiteCreationAttributes } from '../models/sites';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';

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

    static async updateSite(siteData: SiteAttributes): Promise<Site> {
        const site = await Site.findByPk(siteData.id);
        if (!site) {
            throw new Error('Site not found for given id');
        }

        const updatedSite = site.update(siteData);
        return updatedSite;
    }

    static async updateSites(fields: any, whereClause: WhereOptions): Promise<void> {
        await Site.update(fields, { where: whereClause, returning: false });
    }

    static async deleteSite(siteId: string): Promise<number> {
        const response = await Site.destroy({ where: { id: siteId } });
        return response;
    }

    public static async getDeletedSitesFromList(siteIds: number[]): Promise<number[]> {
        const query = `SELECT num
        FROM unnest(array[:site_ids]::int[]) AS num
        LEFT JOIN "14trees".sites AS s
        ON num = s.id
        WHERE s.id IS NULL;`

        const result = await sequelize.query(query, {
            replacements: { site_ids: siteIds },
            type: QueryTypes.SELECT
        })

        return result.map((row: any) => row.num);
    }

    public static async updateSitesDataUsingNotionData() {
        const query = `UPDATE "14trees".sites 
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
          AND n."Tag" IN ('site-forest', 'site-school', 'site-NGO', 'site-road', 'site-gairan', 'site-Govt', 'site-14T') 
          AND n."Name" IS NOT null;`

        await sequelize.query(query);
    }

    public static async insertNewSitesDataUsingNotionData() {
        const query = `INSERT INTO "14trees".sites (
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
        WHERE n."Tag" IN ('site-forest', 'site-school', 'site-NGO', 'site-road', 'site-gairan', 'site-Govt', 'site-14T') 
          AND n."Name" IS NOT NULL
          AND n.id NOT IN (SELECT notion_id FROM "14trees".sites where notion_id is not null);`

        await sequelize.query(query);
    }

    public static async treeCountForSites() {

        const query = `
            WITH plot_areas AS (
                SELECT p.site_id, p.category, SUM(p.acres_area) AS total_acres_area
                FROM "14trees_2".plots p
                GROUP BY p.site_id, p.category
            )
            SELECT s.id, s.name_english as site_name, s.district, s.taluka, s.village,
                p.category,
                COUNT(t.id) as trees_count, 
                COUNT(t.assigned_to) as assigned_trees_count,
                SUM(CASE 
                    WHEN t.mapped_to_user IS NOT NULL 
                        OR t.mapped_to_group IS NOT NULL
                    THEN 1 
                    ELSE 0 
                END) AS mapped_trees_count,
                SUM(CASE 
                    WHEN t.mapped_to_user IS NULL 
                        AND t.mapped_to_group IS NULL 
                        AND t.assigned_to IS NULL 
                        AND t.id IS NOT NULL
                    THEN 1 
                    ELSE 0 
                END) AS available_trees_count,
            COALESCE(pa.total_acres_area, 0) AS acres_area
            FROM "14trees_2".sites s
            JOIN "14trees_2".plots p ON s.id = p.site_id
            LEFT JOIN "14trees_2".trees t ON p.id = t.plot_id
            LEFT JOIN (SELECT *
                FROM (
                    SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY sapling_id ORDER BY created_at DESC) AS rn
                    FROM "14trees_2".trees_snapshots
                ) AS snapshots
                WHERE snapshots.rn = 1) as ts on ts.sapling_id = t.sapling_id
            LEFT JOIN plot_areas pa ON pa.site_id = s.id AND pa.category = p.category
            GROUP BY s.id, p.category, pa.total_acres_area
            ORDER BY s.id DESC;
            `

        const sites: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })

        return { offset: 0, total: sites.length, results: sites };
    }

    public static async treeCountForFields(field: string, offset: number, limit: number, filters: any[], orderBy: { column: string, order: "ASC" | "DESC" }[]) {

        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "s." + filter.columnField
                let valuePlaceHolder = filter.columnField
                if (filter.columnField === "category") {
                    columnField = 'p."category"'
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
            SELECT s.${field},
                p.category,
                COUNT(t.id) as total, 
                COUNT(t.assigned_to) as assigned,
                SUM(CASE 
                    WHEN t.mapped_to_user IS NOT NULL 
                        OR t.mapped_to_group IS NOT NULL
                    THEN 1 
                    ELSE 0 
                END) AS booked,
                SUM(CASE 
                    WHEN t.mapped_to_user IS NULL 
                        AND t.mapped_to_group IS NULL 
                        AND t.assigned_to IS NULL 
                        AND t.id IS NOT NULL
                    THEN 1 
                    ELSE 0 
                END) AS available
            FROM "14trees_2".trees t
            LEFT JOIN "14trees_2".plots p ON p.id = t.plot_id
            LEFT JOIN "14trees_2".sites s ON s.id = p.site_id
            LEFT JOIN (SELECT *
                FROM (
                    SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY sapling_id ORDER BY created_at DESC) AS rn
                    FROM "14trees_2".trees_snapshots
                ) AS snapshots
                WHERE snapshots.rn = 1) as ts on ts.sapling_id = t.sapling_id
            WHERE (ts.tree_status is null or ts.tree_status in ('healthy', 'diseased')) AND ${whereCondition ? whereCondition : '1=1'}
            GROUP BY s.${field}, p.category
            ${ orderBy && orderBy.length !== 0 ? `ORDER BY ${orderBy.map(o => o.column + ' ' + o.order).join(', ')}` : ''}
            LIMIT ${limit} OFFSET ${offset};
            `

        const sites: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements
        })

        const countQuery = `
            WITH data AS (SELECT s.${field},
                p.category
            FROM "14trees_2".trees t
            LEFT JOIN "14trees_2".plots p ON p.id = t.plot_id
            LEFT JOIN "14trees_2".sites s ON s.id = p.site_id
            WHERE ${whereCondition ? whereCondition : '1=1'}
            GROUP BY s.${field}, p.category)
            
            SELECT count(*) FROM data;
        `

        const resp: any[] = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT,
            replacements
        })

        return { offset: 0, total: resp[0]?.count ?? 0, results: sites };
    }
}
