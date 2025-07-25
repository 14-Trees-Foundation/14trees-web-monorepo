import { PlantType, PlantTypeAttributes, PlantTypeCreationAttributes } from "../models/plant_type";
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { PaginatedResponse } from "../models/pagination";
import { QueryTypes, WhereOptions } from 'sequelize';
import { sequelize } from "../config/postgreDB";
import { getSqlQueryExpression } from "../controllers/helper/filters";
import { SortOrder } from "../models/common";
import { getSchema } from '../helpers/utils';

class PlantTypeRepository {
    public static async getPlantTypes(offset: number = 0, limit: number = 20, whereClause: WhereOptions<PlantType>): Promise<PaginatedResponse<PlantType>> {
        if (limit === -1) {
            return {
                results: await PlantType.findAll({ where: whereClause, order: [['id', 'DESC']], offset }),
                total: await PlantType.count({ where: whereClause }),
                offset: offset
            }
        }
        return {
            results: await PlantType.findAll({ where: whereClause, order: [['id', 'DESC']], offset, limit }),
            total: await PlantType.count({ where: whereClause }),
            offset: offset
        }
    };

    public static async addPlantType(data: any, files?: Express.Multer.File[]): Promise<PlantType> {

        // Tree type object to be saved
        let plantTypeObj: PlantTypeCreationAttributes = {
            name: data.name,
            english_name: data.english_name,
            common_name_in_english: data.common_name_in_english,
            common_name_in_marathi: data.common_name_in_marathi,
            plant_type_id: data.plant_type_id,
           
            scientific_name: data.scientific_name,
            family: data.family,
            tags: data.tags!=""?data.tags.split(','):null,
            habit: data.habit,
            known_as: data.known_as,
            
            use:data.use,
            category: data.category,
            names_index: data.names_index,
            created_at: new Date(),
            updated_at: new Date(),
        };

        // Upload images to S3
        let imageUrls: string[] = [];
        if (files && files.length !== 0) {
            for (const file of files) {
                const url = await UploadFileToS3(file.filename, "plant_type");
                imageUrls.push(url);

            }
            plantTypeObj.images = imageUrls;
        }
        
        const plantType = await PlantType.create(plantTypeObj);
        return plantType;
    };


    public static async updatePlantType(data: PlantTypeAttributes, files?: Express.Multer.File[]): Promise<PlantType> {

        // Upload images to S3
        let imageUrls: string[] = [];
        if (files && files.length !== 0) {
            files.forEach( async (file) => {
                const url = await UploadFileToS3(files[0].filename, "plant_type");
                imageUrls.push(url);
            } )
            data.images = imageUrls;
        }
    
        const plantType = await PlantType.findByPk(data.id);
        if (!plantType) {
          throw new Error("Tree type not found")
        }
        const updatedPlantType = await plantType.update(data);
        return updatedPlantType;
    };

    public static async deletePlantType(plantTypeId: string): Promise<number> {
        const resp = await PlantType.destroy({ where: { id: plantTypeId } });
        return resp;
    };

    public static async plantTypesCount(): Promise<number> {
        return await PlantType.count();
    }

    public static async plantTypesPresentInPlot(plotId: number) {
        const query = `
            SELECT pt.id, pt."name", count(pt.id) as pt_cnt FROM "${getSchema()}".trees t 
            LEFT JOIN "${getSchema()}".plant_types pt ON pt.id = t.plant_type_id
            LEFT JOIN "${getSchema()}".plots p ON p.id = t.plot_id
            WHERE t.plot_id = :plot_id
            GROUP BY pt.id
        `

        const results = await sequelize.query(query, {
            replacements: { plot_id: plotId },
            type: QueryTypes.SELECT
        })

        return results;
    }

    public static async getDeletedPlantTypesFromList(plantTypeIds: number[]): Promise<number[]> {
        const query = `SELECT num
            FROM unnest(array[:plant_type_ids]::int[]) AS num
            LEFT JOIN "${getSchema()}".plant_types AS pt
            ON num = pt.id
            WHERE pt.id IS NULL;`

        const result = await sequelize.query(query, {
            replacements: { plant_type_ids: plantTypeIds },
            type: QueryTypes.SELECT
        })

        return result.map((row: any) => row.num);
    }

    public static async getPlantTypeTags(offset: number, limit: number): Promise<PaginatedResponse<string>> {
        const tags: string[] = [];

        const getUniqueTagsQuery = 
            `SELECT DISTINCT tag
                FROM "${getSchema()}".plant_types pt,
                unnest(pt.tags) AS tag
                ORDER BY tag
                OFFSET ${offset} LIMIT ${limit};`;

        const countUniqueTagsQuery = 
            `SELECT count(DISTINCT tag)
                FROM "${getSchema()}".plant_types pt,
                unnest(pt.tags) AS tag;`;

        const tagsResp: any[] = await sequelize.query( getUniqueTagsQuery,{ type: QueryTypes.SELECT });
        tagsResp.forEach(r => tags.push(r.tag));

        const countResp: any[] = await sequelize.query( countUniqueTagsQuery,{ type: QueryTypes.SELECT });
        const total = parseInt(countResp[0].count);
        return { offset: offset, total: total, results: tags };
    }

    public static async getPlantTypeStates(offset: number, limit: number, filters: any[], orderBy: { column: string, order: "ASC" | "DESC" }[]): Promise<PaginatedResponse<PlantType>> {
        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "pt." + filter.columnField
                let valuePlaceHolder = filter.columnField
                if (filter.columnField === "plant_type") {
                    columnField = "pt.name"
                } else if (filter.columnField === "template_id") {
                    columnField = "ptct.template_id"
                }

                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
            SELECT pt.id,pt.name as plant_type, pt.habit, pt.illustration_link as illustration_link, ptct.template_id as template_id,
                SUM(COALESCE(tcg.booked, 0)) as booked,
                SUM(COALESCE(tcg.available, 0)) as available,
                SUM(COALESCE(tcg.assigned, 0)) as assigned,
                SUM(COALESCE(tcg.total, 0)) as total,
                SUM(COALESCE(tcg.void_total, 0)) as void_total,
                SUM(COALESCE(tcg.void_booked, 0)) as void_booked,
                SUM(COALESCE(tcg.void_available, 0)) as void_available,
                SUM(COALESCE(tcg.void_assigned, 0)) as void_assigned,
                SUM(COALESCE(tcg.card_available, 0)) as card_available,
                SUM(COALESCE(tcg.unbooked_assigned, 0)) as unbooked_assigned
            FROM "${getSchema()}".plant_types pt
            LEFT JOIN "${getSchema()}".plant_type_card_templates ptct ON pt."name" = ptct.plant_type
            LEFT JOIN "${getSchema()}".tree_count_aggregations tcg ON tcg.plant_type_id = pt.id
            WHERE ${whereCondition ? whereCondition : '1=1'}
            GROUP BY pt.id, ptct.id
            ${orderBy && orderBy.length !== 0 ? `ORDER BY ${orderBy.map(o => o.column + ' ' + o.order).join(', ')}` : 'ORDER BY total DESC'}
            ${limit > 0 ? `LIMIT ${limit} OFFSET ${offset}` : ''};
            `

        const plantTypes: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements
        })

        const countQuery = `
            SELECT count(distinct pt.name)
            FROM "${getSchema()}".plant_types pt
            LEFT JOIN "${getSchema()}".plant_type_card_templates ptct ON pt."name" = ptct.plant_type
            WHERE ${whereCondition ? whereCondition : '1=1'}
        `

        const resp: any[] = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT,
            replacements
        })

        return { offset: offset, total: resp[0]?.count ?? 0, results: plantTypes };
    }

    public static async getPlantTypeStateForPlots(offset: number, limit: number, filters: any[], orderBy: SortOrder[]): Promise<PaginatedResponse<any>> {
        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "pt." + filter.columnField
                let valuePlaceHolder = filter.columnField
                if (filter.columnField === "plant_type") {
                    columnField = "pt.name"
                } else if (filter.columnField === "template_id") {
                    columnField = "ptct.template_id"
                } else if (filter.columnField === "plot_name") {
                    columnField = "p.name"
                } else if (filter.columnField === "site_name") {
                    columnField = "s.name_english"
                } else if (filter.columnField === "plot_tags") {
                    columnField = "p.tags"
                }

                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
            SELECT pt.id, pt.name as plant_type, pt.habit, pt.illustration_link as illustration_link, ptct.template_id as template_id,
                s.id as site_id, s.name_english as site_name,
                p.id as plot_id, p.name as plot_name, p.tags as plot_tags,
                SUM(COALESCE(tcg.booked, 0)) as booked,
                SUM(COALESCE(tcg.available, 0)) as available,
                SUM(COALESCE(tcg.assigned, 0)) as assigned,
                SUM(COALESCE(tcg.total, 0)) as total,
                SUM(COALESCE(tcg.void_total, 0)) as void_total,
                SUM(COALESCE(tcg.void_booked, 0)) as void_booked,
                SUM(COALESCE(tcg.void_available, 0)) as void_available,
                SUM(COALESCE(tcg.void_assigned, 0)) as void_assigned,
                SUM(COALESCE(tcg.card_available, 0)) as card_available,
                SUM(COALESCE(tcg.unbooked_assigned, 0)) as unbooked_assigned
            FROM "${getSchema()}".plant_types pt
            LEFT JOIN "${getSchema()}".plant_type_card_templates ptct ON pt."name" = ptct.plant_type
            LEFT JOIN "${getSchema()}".tree_count_aggregations tcg ON tcg.plant_type_id = pt.id
            LEFT JOIN "${getSchema()}".plots p ON p.id = tcg.plot_id
            LEFT JOIN "${getSchema()}".sites s ON s.id = p.site_id
            WHERE ${whereCondition ? whereCondition : '1=1'}
            GROUP BY pt.id, s.id, p.id, ptct.id
            ${orderBy && orderBy.length !== 0 ? `ORDER BY ${orderBy.map(o => o.column + ' ' + o.order).join(', ')}` : 'ORDER BY total DESC'}
            ${limit > 0 ? `LIMIT ${limit} OFFSET ${offset}` : ''};
            `

        const plantTypes: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements
        })

        const countQuery = `
            SELECT count(distinct (pt.id, s.id, p.id))
            FROM "${getSchema()}".plant_types pt
            LEFT JOIN "${getSchema()}".plant_type_card_templates ptct ON pt."name" = ptct.plant_type
            LEFT JOIN "${getSchema()}".tree_count_aggregations tcg ON tcg.plant_type_id = pt.id
            LEFT JOIN "${getSchema()}".plots p ON p.id = tcg.plot_id
            LEFT JOIN "${getSchema()}".sites s ON s.id = p.site_id
            WHERE ${whereCondition ? whereCondition : '1=1'}
        `

        const resp: any[] = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT,
            replacements
        })

        return { offset: offset, total: resp[0]?.count ?? 0, results: plantTypes };
    }

    public static async syncPlantTypeIllustrations() {
        const query = `
            update "${getSchema()}".plant_types pt
                set illustration_link = pti."Link to artwork "
            from plant_type_illustrations pti
            where pt."name" ILIKE '%' || pti."Name" || '%' or pt."name" ILIKE '%' || pti."Common name English" || '%' or pt."name" ILIKE '%' || pti."Common name Marathi" || '%'
        `

        await sequelize.query(query, {
            type: QueryTypes.UPDATE
        })
    }

    ///*** CSR Stats ***/
    public static async getPlantTypeStatsForCorporate(offset: number, limit: number, groupId?: number, filters?: any[]): Promise<PaginatedResponse<PlantType>> {
        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "pt." + filter.columnField
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
        SELECT pt.id, pt.name, pt.habit, pt.category, pt.scientific_name, pt.known_as,
            count(t.id) AS booked
        FROM "${getSchema()}".plant_types pt
        JOIN "${getSchema()}".trees t ON t.plant_type_id = pt.id AND ${groupId ? `t.mapped_to_group = ${groupId}` : 't.mapped_to_group is NOT NULL'}
        WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        GROUP BY pt.id
        ORDER BY booked DESC
        OFFSET ${offset} ${limit === -1 ? "" : `LIMIT ${limit}`};
        `

        const countPlantTypesQuery =
            `SELECT count(distinct pt.id)
                FROM "${getSchema()}".plant_types pt
                JOIN "${getSchema()}".trees t ON t.plant_type_id = pt.id AND ${groupId ? `t.mapped_to_group = ${groupId}` : 't.mapped_to_group is NOT NULL'}
                WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
            `

        const plantTypes: any = await sequelize.query(query, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })

        const countPlantTypes: any = await sequelize.query(countPlantTypesQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        const totalResults = parseInt(countPlantTypes[0].count)

        return { offset: offset, total: totalResults, results: plantTypes as PlantType[] };
    }

}

export default PlantTypeRepository;