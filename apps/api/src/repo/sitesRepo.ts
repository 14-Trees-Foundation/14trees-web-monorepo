import { QueryTypes, WhereOptions, or } from 'sequelize';
import { Site, SiteAttributes, SiteCreationAttributes } from '../models/sites';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { SortOrder } from '../models/common';
import { getSchema } from '../helpers/utils';

export class SiteRepository {

    // Analytics

    static async countAllSites() {

        const query = `
            SELECT count(s.id) as sites,
                COUNT(DISTINCT (s.district)) as districts,
                COUNT(DISTINCT (s.taluka)) as talukas,
                COUNT(DISTINCT (s.village)) as villages
            FROM "${getSchema()}".sites as s;
        `

        const resp: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })

        return resp[0];
    }

    static async getLandTypeTreesCount() {
        const query = `
            SELECT s.land_type, SUM(COALESCE(tcg.total, 0)) as count
            FROM "${getSchema()}".sites as s
            JOIN "${getSchema()}".plots as p ON p.site_id = s.id
            JOIN "${getSchema()}".tree_count_aggregations tcg ON tcg.plot_id = p.id
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
            order: [['created_at', 'DESC']], // Order by created_at in descending order
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
        
        // Ensure updated_at is set to current time
        siteData.updated_at = new Date();
        
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
        LEFT JOIN "${getSchema()}".sites AS s
        ON num = s.id
        WHERE s.id IS NULL;`

        const result = await sequelize.query(query, {
            replacements: { site_ids: siteIds },
            type: QueryTypes.SELECT
        })

        return result.map((row: any) => row.num);
    }

    public static async updateSitesDataUsingNotionData() {
        const query = `UPDATE "${getSchema()}".sites 
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
            maintenance_type = n."Service offered"::"${getSchema()}".maintenence_type_enum
        FROM notion_db n
        WHERE n.id = notion_id
          AND n."Tag" IN ('site-forest', 'site-school', 'site-NGO', 'site-road', 'site-gairan', 'site-Govt', 'site-14T', 'site-farmer', 'site-pond', 'site-Urban') 
          AND (n."Name" IS NOT NULL OR n."नाव (मराठी)" IS NOT NULL);`

        await sequelize.query(query);
    }

    public static async insertNewSitesDataUsingNotionData() {
        const query = `INSERT INTO "${getSchema()}".sites (
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
            n."Service offered"::"${getSchema()}".maintenence_type_enum
        FROM notion_db n
        WHERE n."Tag" IN ('site-forest', 'site-school', 'site-NGO', 'site-road', 'site-gairan', 'site-Govt', 'site-14T', 'site-farmer', 'site-pond', 'site-Urban') 
          AND n."Name" IS NOT NULL
          AND n.id NOT IN (SELECT notion_id FROM "${getSchema()}".sites where notion_id is not null);`

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
                FROM "${getSchema()}".plots p
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
            FROM "${getSchema()}".sites s
            LEFT JOIN "${getSchema()}".plots p ON s.id = p.site_id
            LEFT JOIN "${getSchema()}".tree_count_aggregations tcg ON tcg.plot_id = p.id
            LEFT JOIN "${getSchema()}".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''} 
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
            FROM "${getSchema()}".sites s
            LEFT JOIN "${getSchema()}".plots p ON s.id = p.site_id
            LEFT JOIN "${getSchema()}".tree_count_aggregations tcg ON tcg.plot_id = p.id
            LEFT JOIN "${getSchema()}".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''} 
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
            FROM "${getSchema()}".tree_count_aggregations tcg
            LEFT JOIN "${getSchema()}".plots p ON tcg.plot_id = p.id
            LEFT JOIN "${getSchema()}".sites s ON p.site_id = s.id
            LEFT JOIN "${getSchema()}".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''}
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
                FROM "${getSchema()}".tree_count_aggregations tcg
                LEFT JOIN "${getSchema()}".plots p ON tcg.plot_id = p.id
                LEFT JOIN "${getSchema()}".sites s ON p.site_id = s.id
                LEFT JOIN "${getSchema()}".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''}
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
            FROM "${getSchema()}".sites s;
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
            FROM "${getSchema()}".tree_count_aggregations tcg
            JOIN (
                SELECT id, site_id, unnest(tags) AS tag
                FROM "${getSchema()}".plots
            ) AS tag_grouped ON tag_grouped.id = tcg.plot_id
            JOIN "${getSchema()}".tags as t on tag_grouped.tag = t.tag
            LEFT JOIN "${getSchema()}".sites s ON s.id = tag_grouped.site_id
            LEFT JOIN "${getSchema()}".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''}
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
            FROM "${getSchema()}".tree_count_aggregations tcg
            LEFT JOIN (
                SELECT id, site_id, unnest(tags) AS tag
                FROM "${getSchema()}".plots
            ) AS tag_grouped ON tag_grouped.id = tcg.plot_id
            JOIN "${getSchema()}".tags as t on tag_grouped.tag = t.tag
            LEFT JOIN "${getSchema()}".sites s ON s.id = tag_grouped.site_id
            LEFT JOIN "${getSchema()}".plant_types pt ON tcg.plant_type_id = pt.id ${plantTypeCondition !== '' ? 'AND ' + plantTypeCondition : ''}
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
            FROM "${getSchema()}".trees t
            JOIN "${getSchema()}".plots p ON p.id = t.plot_id
            LEFT JOIN "${getSchema()}".sites s on s.id = p.site_id
            WHERE t.mapped_to_group = :groupId
            GROUP BY p.id, s.id
        `

        const resp: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { groupId }
        });

        return resp;
    }

    public static async getSiteStatesForCorporate(offset: number, limit: number, groupId?: number, filters?: any[], orderBy?: SortOrder[]): Promise<PaginatedResponse<any>> {
        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "s." + filter.columnField
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
        SELECT s.id, s.name_english, s.tags, s.kml_file_link, s.area_acres,
            COUNT(t.id) as total, 
            SUM(CASE 
                WHEN ${groupId ? `t.mapped_to_group = ${groupId}` : 't.mapped_to_group is NOT NULL'}
                THEN 1 
                ELSE 0 
            END) AS booked,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL
                    AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS available,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL
                    AND (t.tree_status IS NULL OR (t.tree_status != 'dead' AND t.tree_status != 'lost'))
                    AND ptct.plant_type IS NOT NULL
                    AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS card_available
        FROM "${getSchema()}".sites s
        LEFT JOIN "${getSchema()}".plots p ON p.site_id = s.id
        LEFT JOIN "${getSchema()}".trees t ON t.plot_id = p.id
        LEFT JOIN "${getSchema()}".plant_types pt on pt.id = t.plant_type_id
        LEFT JOIN "${getSchema()}".plant_type_card_templates ptct on ptct.plant_type = pt."name"
        LEFT JOIN "${getSchema()}".plot_plant_types ppt ON ppt.plot_id = t.plot_id AND ppt.plant_type_id = t.plant_type_id
        WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        GROUP BY s.id
        HAVING SUM(CASE 
            WHEN ${groupId ? `t.mapped_to_group = ${groupId}` : 't.mapped_to_group is NOT NULL'}
            THEN 1 
            ELSE 0 
        END) > 0
        ORDER BY ${orderBy && orderBy.length !== 0 ? orderBy.map(o => o.column + " " + o.order).join(", ") : 's.id DESC'}
        OFFSET ${offset} ${limit === -1 ? "" : `LIMIT ${limit}`};
        `

        const countSitesQuery =
            `SELECT count(distinct s.id)
            FROM "${getSchema()}".plots p
            LEFT JOIN "${getSchema()}".sites s ON p.site_id = s.id
            LEFT JOIN "${getSchema()}".trees t ON t.plot_id = p.id
            WHERE ${groupId ? `t.mapped_to_group = ${groupId}` : 't.mapped_to_group is NOT NULL'} AND ${whereCondition !== "" ? whereCondition : "1=1"};
            `

        const sites: any = await sequelize.query(query, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })

        const countSites: any = await sequelize.query(countSitesQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        const totalResults = parseInt(countSites[0].count)

        return { offset: offset, total: totalResults, results: sites as any[] };
    }
}
