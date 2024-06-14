import { PlantType, PlantTypeAttributes, PlantTypeCreationAttributes } from "../models/plant_type";
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { PaginatedResponse } from "../models/pagination";
import { Op } from 'sequelize';

class PlantTypeRepository {
    public static async getPlantTypes(query: any, offset: number = 0, limit: number = 20): Promise<PaginatedResponse<PlantType>> {
        let whereClause: Record<string, any> = {}
        if (query?.name) {
            whereClause["name"] = { [Op.like]: query.name.toString() }
        }
        if (query?.sci_name) {
            whereClause["scientific_name"] = { [Op.like]: query.sci_name.toString() }
        }

        return {
            results: await PlantType.findAll({ where: whereClause, offset, limit }),
            total: await PlantType.count({ where: whereClause }),
            offset: offset
        }
    };

    public static async addPlantType(data: any, files?: Express.Multer.File[]): Promise<PlantType> {

        // Tree type object to be saved
        let plantTypeObj: PlantTypeCreationAttributes = {
            name: data.name,
            name_english: data.name_english,
            common_name_english: data.common_name_english,
            common_name_marathi: data.common_name_marathi,
            plant_type_id: data.plant_type_id,
            description: data.description,
            scientific_name: data.scientific_name,
            family: data.family,
            tags: data.tags,
            habit: data.habit,
            med_use: data.med_use,
            other_use: data.other_use,
            food: data.food,
            eco_value: data.eco_value,
            category: data.category,
            names_index: data.names_index,
            created_at: new Date(),
            updated_at: new Date(),
        };

        // Upload images to S3
        let imageUrls: string[] = [];
        if (files && files.length !== 0) {
            files.forEach( async (file) => {
                const url = await UploadFileToS3(files[0].filename, "plant_type");
                imageUrls.push(url);
            } )
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