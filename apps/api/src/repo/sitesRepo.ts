import { QueryTypes, WhereOptions, or } from 'sequelize';
import { Site, SiteAttributes, SiteCreationAttributes } from '../models/sites';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';

export class SiteRepository {

    // Analytics

    static async countAllSites() {

        const query = `
            SELECT count(s.id) as sites,
                COUNT(DISTINCT (s.district)) as districts,
                COUNT(DISTINCT (s.taluka)) as talukas,
                COUNT(DISTINCT (s.village)) as villages
            FROM "14trees".sites as s;
        `

        const resp: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })

        return resp[0];
    }

    static async getLandTypeTreesCount() {
        const query = `
            SELECT s.land_type, SUM(COALESCE(tcg.total, 0)) as count
            FROM "14trees".sites as s
            JOIN "14trees".plots as p ON p.site_id = s.id
            JOIN "14trees".tree_count_aggregations tcg ON tcg.plot_id = p.id
            WHERE s.land_type IS NOT NULL
            GROUP BY s.land_type;
        `

        const resp: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })

        let result = {};
        resp.forEach(item => {
            result = { ...result, [item.land_type]: item.count }
        });

        return result;
    }

    // CRUD
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
            data_errors = n."Data errors",
            category = n."Site Type",
            maintenance_type = n."Service offered"::"14trees".maintenence_type_enum
        FROM notion_db n
        WHERE n.id = notion_id
          AND n."Tag" IN ('site-forest', 'site-school', 'site-NGO', 'site-road', 'site-gairan', 'site-Govt', 'site-14T', 'site-farmer', 'site-pond', 'site-Urban') 
          AND (n."Name" IS NOT NULL OR n."नाव (मराठी)" IS NOT NULL);`

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
            data_errors,
            category,
            maintenance_type
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
            n."Data errors",
            n."Site Type",
            n."Service offered"::"14trees".maintenence_type_enum
        FROM notion_db n
        WHERE n."Tag" IN ('site-forest', 'site-school', 'site-NGO', 'site-road', 'site-gairan', 'site-Govt', 'site-14T', 'site-farmer', 'site-pond', 'site-Urban') 
          AND n."Name" IS NOT NULL
          AND n.id NOT IN (SELECT notion_id FROM "14trees".sites where notion_id is not null);`

        await sequelize.query(query);
    }

    public static async treeCountForSites(offset: number, limit: number, filters: any[], orderBy: { column: string, order: "ASC" | "DESC" }[]): Promise<PaginatedResponse<Site>> {

        let whereCondition = "";
        let plantTypeCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                if (filter.columnField === 'site_name') {
                    const condition1 = getSqlQueryExpression("s.name_english", filter.operatorValue, filter.columnField + "_1", filter.value);
                    const condition2 = getSqlQueryExpression("s.name_marathi", filter.operatorValue, filter.columnField + "_2", filter.value);

                    whereCondition = whereCondition + " (" + condition1.condition + " OR " + condition2.condition + ") AND";
                    replacements = { ...replacements, ...condition1.replacement, ...condition2.replacement }
                    return;
                }
                let columnField = "s." + filter.columnField
                let valuePlaceHolder = filter.columnField

                if (filter.columnField === 'habit') columnField = 'pt.habit'
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
                replacements = { ...replacements, ...replacement }

                if (filter.columnField === 'habit') plantTypeCondition = condition;
                else whereCondition = whereCondition + " " + condition + " AND";
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
            WITH plot_areas AS (
                SELECT p.site_id, SUM(p.acres_area) AS total_acres_area
                FROM "14trees".plots p
                GROUP BY p.site_id
            )
            SELECT s.id, 
                CASE
                WHEN s.name_english IS NULL 
                    THEN s.name_marathi
                    ELSE s.name_english 
                END site_name,
                s.land_type, s.category, s.maintenance_type, s.district, s.taluka, s.village, s.kml_file_link, s.tags, s.area_acres, s.length_km,
                SUM(COALESCE(pa.total_acres_area, 0)) AS acres_area,
                SUM(COALESCE(tcg.booked, 0)) as booked,
                SUM(COALESCE(tcg.available, 0)) as available,
                SUM(COALESCE(tcg.assigned, 0)) as assigned,
                SUM(COALESCE(tcg.total, 0)) as total,
                SUM(COALESCE(tcg.void_total, 0)) as void_total,
                SUM(COALESCE(tcg.void_booked, 0)) as void_booked,
                SUM(COALESCE(tcg.void_available, 0)) as void_available,
                SUM(COALESCE(tcg.void_assigned, 0)) as void_assigned,
                SUM(COALESCE(tcg.card_available, 0)) as card_available,
                SUM(COALESCE(tcg.unbooked_assigned, 0)) as unbooked_assigned,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.total
                    ELSE 0
                END) AS tree_count,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.total
                    ELSE 0
                END) AS shrub_count,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.total
                    ELSE 0
                END) AS herb_count,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.assigned
                    ELSE 0 
                END) as assigned_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.booked
                    ELSE 0 
                END) AS booked_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.unbooked_assigned
                    ELSE 0 
                END) AS unbooked_assigned_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.available
                    ELSE 0 
                END) AS available_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.card_available
                    ELSE 0 
                END) AS card_available_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.assigned 
                    ELSE 0 
                END) as assigned_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.booked 
                    ELSE 0 
                END) AS booked_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.unbooked_assigned 
                    ELSE 0 
                END) AS unbooked_assigned_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.available 
                    ELSE 0 
                END) AS available_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.card_available
                    ELSE 0 
                END) AS card_available_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.assigned 
                    ELSE 0 
                END) as assigned_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.booked 
                    ELSE 0 
                END) AS booked_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.unbooked_assigned 
                    ELSE 0 
                END) AS unbooked_assigned_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.available 
                    ELSE 0 
                END) AS available_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.card_available
                    ELSE 0 
                END) AS card_available_shrubs
            FROM "14trees".sites s
            LEFT JOIN "14trees".plots p ON s.id = p.site_id
            LEFT JOIN "14trees".tree_count_aggregations tcg ON tcg.plot_id = p.id
            LEFT JOIN "14trees".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''} 
            LEFT JOIN plot_areas pa ON pa.site_id = s.id
            WHERE ${whereCondition ? whereCondition : '1=1'}
            GROUP BY s.id
            ${orderBy && orderBy.length !== 0 ? `ORDER BY ${orderBy.map(o => o.column + ' ' + o.order).join(', ')}` : ''}
            ${limit > 0 ? `LIMIT ${limit} OFFSET ${offset}` : ''};
            `

        const sites: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements
        })

        const countQuery = `
            SELECT count(distinct s.id) as count
            FROM "14trees".sites s
            LEFT JOIN "14trees".plots p ON s.id = p.site_id
            LEFT JOIN "14trees".tree_count_aggregations tcg ON tcg.plot_id = p.id
            LEFT JOIN "14trees".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''} 
            WHERE ${whereCondition ? whereCondition : '1=1'}
        `

        const resp: any[] = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT,
            replacements
        })

        return { offset: offset, total: resp[0]?.count ?? 0, results: sites };
    }

    public static async treeCountForFields(field: string, offset: number, limit: number, filters: any[], orderBy: { column: string, order: "ASC" | "DESC" }[]) {

        let whereCondition = "";
        let plantTypeCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "s." + filter.columnField
                let valuePlaceHolder = filter.columnField + Math.random().toString(36).slice(2);

                if (filter.columnField === 'habit') columnField = 'pt.habit';
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
                if (filter.columnField === 'habit') plantTypeCondition = condition;
                else whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
            SELECT s.${field}, ${field === 'category' ? '' : 's.category, '}
                SUM(COALESCE(tcg.booked, 0)) as booked,
                SUM(COALESCE(tcg.available, 0)) as available,
                SUM(COALESCE(tcg.assigned, 0)) as assigned,
                SUM(COALESCE(tcg.total, 0)) as total,
                SUM(COALESCE(tcg.void_total, 0)) as void_total,
                SUM(COALESCE(tcg.void_booked, 0)) as void_booked,
                SUM(COALESCE(tcg.void_available, 0)) as void_available,
                SUM(COALESCE(tcg.void_assigned, 0)) as void_assigned,
                SUM(COALESCE(tcg.card_available, 0)) as card_available,
                SUM(COALESCE(tcg.unbooked_assigned, 0)) as unbooked_assigned,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.total
                    ELSE 0
                END) AS tree_count,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.total
                    ELSE 0
                END) AS shrub_count,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.total
                    ELSE 0
                END) AS herb_count,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.assigned
                    ELSE 0 
                END) as assigned_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.booked
                    ELSE 0 
                END) AS booked_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.unbooked_assigned
                    ELSE 0 
                END) AS unbooked_assigned_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.available
                    ELSE 0 
                END) AS available_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.card_available
                    ELSE 0 
                END) AS card_available_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.assigned 
                    ELSE 0 
                END) as assigned_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.booked 
                    ELSE 0 
                END) AS booked_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.unbooked_assigned 
                    ELSE 0 
                END) AS unbooked_assigned_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.available 
                    ELSE 0 
                END) AS available_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.card_available
                    ELSE 0 
                END) AS card_available_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.assigned 
                    ELSE 0 
                END) as assigned_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.booked 
                    ELSE 0 
                END) AS booked_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.unbooked_assigned 
                    ELSE 0 
                END) AS unbooked_assigned_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.available 
                    ELSE 0 
                END) AS available_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.card_available
                    ELSE 0 
                END) AS card_available_shrubs
            FROM "14trees".tree_count_aggregations tcg
            LEFT JOIN "14trees".plots p ON tcg.plot_id = p.id
            LEFT JOIN "14trees".sites s ON p.site_id = s.id
            LEFT JOIN "14trees".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''}
            WHERE ${whereCondition ? whereCondition : '1=1'}
            GROUP BY s.${field} ${field === 'category' ? '' : ', s.category'}
            ${orderBy && orderBy.length !== 0 ? `ORDER BY ${orderBy.map(o => o.column + ' ' + o.order).join(', ')}` : ''}
            LIMIT ${limit} OFFSET ${offset};
            `

        const sites: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements
        })

        const countQuery = `
            WITH data as (
                SELECT s.${field}, ${field === 'category' ? '' : 's.category, '}
                    SUM(COALESCE(tcg.booked, 0)) as booked
                FROM "14trees".tree_count_aggregations tcg
                LEFT JOIN "14trees".plots p ON tcg.plot_id = p.id
                LEFT JOIN "14trees".sites s ON p.site_id = s.id
                LEFT JOIN "14trees".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''}
                WHERE ${whereCondition ? whereCondition : '1=1'}
                GROUP BY s.${field} ${field === 'category' ? '' : ', s.category'}
            )

            SELECT count(*) as count
            FROM data;
        `

        const resp: any[] = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT,
            replacements
        })

        return { offset: offset, total: resp[0]?.count ?? 0, results: sites };
    }

    public static async getDistrictsData() {
        const query = `
            SELECT DISTINCT(s.district, s.taluka, s.village) as data
            FROM "14trees".sites s;
        `

        const sites: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })

        return sites.map((s) => {
            const data = s.data.slice(1, -1).split(',');
            return {
                district: data[0].slice(1, -1),
                taluka: data[1].slice(1, -1),
                village: data[2].slice(1, -1)
            }
        });
    }

    public static async getTreeCountsForTags(offset: number, limit: number, filters?: FilterItem[], orderBy?: { column: string, order: "ASC" | "DESC" }[]) {
        let whereCondition = "";
        let plantTypeCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "s." + filter.columnField
                let valuePlaceHolder = filter.columnField + Math.random().toString(36).slice(2);

                if (filter.columnField === 'habit') columnField = 'pt.habit';
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
                if (filter.columnField === 'habit') plantTypeCondition = condition;
                else whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
            SELECT tag_grouped.tag,
                SUM(tcg.booked) AS booked,
                SUM(tcg.available) AS available,
                SUM(tcg.assigned) AS assigned,
                SUM(tcg.total) AS total,
                SUM(tcg.void_total) AS void_total,
                SUM(tcg.void_booked) AS void_booked,
                SUM(tcg.void_available) AS void_available,
                SUM(tcg.void_assigned) AS void_assigned,
                SUM(tcg.card_available) AS card_available,
                SUM(COALESCE(tcg.unbooked_assigned, 0)) as unbooked_assigned,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.total
                    ELSE 0
                END) AS tree_count,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.total
                    ELSE 0
                END) AS shrub_count,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.total
                    ELSE 0
                END) AS herb_count,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.assigned
                    ELSE 0 
                END) as assigned_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.booked
                    ELSE 0 
                END) AS booked_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.unbooked_assigned
                    ELSE 0 
                END) AS unbooked_assigned_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.available
                    ELSE 0 
                END) AS available_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Tree'
                    THEN tcg.card_available
                    ELSE 0 
                END) AS card_available_trees,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.assigned 
                    ELSE 0 
                END) as assigned_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.booked 
                    ELSE 0 
                END) AS booked_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.unbooked_assigned 
                    ELSE 0 
                END) AS unbooked_assigned_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.available 
                    ELSE 0 
                END) AS available_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Herb'
                    THEN tcg.card_available
                    ELSE 0 
                END) AS card_available_herbs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.assigned 
                    ELSE 0 
                END) as assigned_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.booked 
                    ELSE 0 
                END) AS booked_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.unbooked_assigned 
                    ELSE 0 
                END) AS unbooked_assigned_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.available 
                    ELSE 0 
                END) AS available_shrubs,
                SUM(CASE 
                    WHEN pt.habit = 'Shrub'
                    THEN tcg.card_available
                    ELSE 0 
                END) AS card_available_shrubs
            FROM "14trees".tree_count_aggregations tcg
            JOIN (
                SELECT id, site_id, unnest(tags) AS tag
                FROM "14trees".plots
            ) AS tag_grouped ON tag_grouped.id = tcg.plot_id
            JOIN "14trees".tags as t on tag_grouped.tag = t.tag
            LEFT JOIN "14trees".sites s ON s.id = tag_grouped.site_id
            LEFT JOIN "14trees".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''}
            WHERE t.type = 'SYSTEM_DEFINED' AND ${whereCondition ? whereCondition : '1=1'}
            GROUP BY tag_grouped.tag
            ${orderBy && orderBy.length !== 0 ? `ORDER BY ${orderBy.map(o => o.column + ' ' + o.order).join(', ')}` : ''}
            OFFSET ${offset} LIMIT ${limit};
        `

        const resp: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements
        });

        const countQuery = `
            SELECT count(DISTINCT(tag_grouped.tag)) as count
            FROM "14trees".tree_count_aggregations tcg
            LEFT JOIN (
                SELECT id, site_id, unnest(tags) AS tag
                FROM "14trees".plots
            ) AS tag_grouped ON tag_grouped.id = tcg.plot_id
            JOIN "14trees".tags as t on tag_grouped.tag = t.tag
            LEFT JOIN "14trees".sites s ON s.id = tag_grouped.site_id
            LEFT JOIN "14trees".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''}
            WHERE t.type = 'SYSTEM_DEFINED' AND ${whereCondition ? whereCondition : '1=1'}
        `

        const countResp: any[] = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT,
            replacements
        });

        return { offset: offset, total: countResp[0]?.count ?? 0, results: resp };
    }

    public static async getTreeCountForCorporate(groupId: number, orderBy?: { column: string, order: "ASC" | "DESC" }[]) {
        const query = `
            SELECT p.id as plot_id, p.name as plot_name, s.id as site_id, s.name_english as site_name,
                SUM(CASE 
                    WHEN t.mapped_to_group IS NOT NULL OR t.mapped_to_user IS NOT NULL
                        THEN 1 
                        ELSE 0 
                    END) AS booked,
                SUM(CASE 
                    WHEN t.mapped_to_group IS NULL AND t.mapped_to_user IS NULL AND t.assigned_to IS NULL
                        THEN 1 
                        ELSE 0 
                    END) AS available,
                COUNT(t.assigned_to) AS assigned,
                count(t.id) AS total
            FROM "14trees".trees t
            JOIN "14trees".plots p ON p.id = t.plot_id
            LEFT JOIN "14trees".sites s on s.id = p.site_id
            WHERE t.mapped_to_group = :groupId
            GROUP BY p.id, s.id
        `

        const resp: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { groupId }
        });

        return resp;
    }
}
