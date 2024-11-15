import { PlantType, PlantTypeAttributes, PlantTypeCreationAttributes } from "../models/plant_type";
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { PaginatedResponse } from "../models/pagination";
import { QueryTypes, WhereOptions } from 'sequelize';
import { sequelize } from "../config/postgreDB";

class PlantTypeRepository {
    public static async getPlantTypes(offset: number = 0, limit: number = 20, whereClause: WhereOptions): Promise<PaginatedResponse<PlantType>> {
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
            SELECT pt.id, pt."name", count(pt.id) as pt_cnt FROM "14trees".trees t 
            LEFT JOIN "14trees".plant_types pt ON pt.id = t.plant_type_id
            LEFT JOIN "14trees".plots p ON p.id = t.plot_id
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
            LEFT JOIN "14trees".plant_types AS pt
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
                FROM "14trees".plant_types pt,
                unnest(pt.tags) AS tag
                ORDER BY tag
                OFFSET ${offset} LIMIT ${limit};`;

        const countUniqueTagsQuery = 
            `SELECT count(DISTINCT tag)
                FROM "14trees".plant_types pt,
                unnest(pt.tags) AS tag;`;

        const tagsResp: any[] = await sequelize.query( getUniqueTagsQuery,{ type: QueryTypes.SELECT });
        tagsResp.forEach(r => tags.push(r.tag));

        const countResp: any[] = await sequelize.query( countUniqueTagsQuery,{ type: QueryTypes.SELECT });
        const total = parseInt(countResp[0].count);
        return { offset: offset, total: total, results: tags };
    }
}

export default PlantTypeRepository;