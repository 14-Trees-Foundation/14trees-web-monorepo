import { Op } from "sequelize";
import { PlantTypeCardTemplate, PlantTypeCardTemplateCreationAttributes } from "../models/plant_type_card_template";


class PlantTypeTemplateRepository {

    public static async getAll(): Promise<PlantTypeCardTemplate[]> {
        return await PlantTypeCardTemplate.findAll();
    }

    public static async addPlantTypeTemplate(plantType: string, templateId: string, templateImage: string): Promise<PlantTypeCardTemplate> {
        const data: PlantTypeCardTemplateCreationAttributes = {
            plant_type: plantType,
            template_id: templateId,
            template_image: templateImage,
            created_at: new Date(),
            updated_at: new Date(),
        }

        return await PlantTypeCardTemplate.create(data);
    }

    public static async getPlantTypeTemplate(plantType: string, templateId: string): Promise<PlantTypeCardTemplate | null> {
        return await PlantTypeCardTemplate.findOne({
            where: {
                [Op.or]: [
                    { plant_type: plantType },
                    { template_id: templateId }
                ]
            }
        })
    }

}

export default PlantTypeTemplateRepository;