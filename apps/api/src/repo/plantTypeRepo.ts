import { PlantType, PlantTypeAttributes, PlantTypeCreationAttributes } from "../models/plant_type";
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { PaginatedResponse } from "../models/pagination";
import { WhereOptions } from 'sequelize';

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
}

export default PlantTypeRepository;