import { TreeType, TreeTypeAttributes, TreeTypeCreationAttributes } from "../models/treetype";
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";


class TreeTypeRepository {
    public static async getTreeTypes(query: any, offset: number = 0, limit: number = 20): Promise<TreeType[]> {
        let whereClause: Record<string, any> = {}
        if (query?.name) {
            whereClause["name"] = query.name.toString()
        }
        if (query?.sci_name) {
            whereClause["scientific_name"] = query.sci_name.toString()
        }
        if (query?.med_use) {
            whereClause["med_use"] = query.med_use.toString()
        }
        if (query?.food) {
            whereClause["food"] = query.food.toString()
        }

        return await TreeType.findAll({
            where: whereClause,
            offset,
            limit
        });
    };

    public static async addTreeType(data: any, files?: Express.Multer.File[]): Promise<TreeType> {

        // Upload images to S3
        let imageUrl = "";
        if (files && files.length !== 0) {
            imageUrl = await UploadFileToS3(files[0].filename, "treetype");
        }

        // Tree type object to be saved
        let obj: TreeTypeCreationAttributes = {
            name: data.name,
            name_english: data.name_english,
            tree_id: data.tree_id,
            description: data.desc,
            scientific_name: data.scientific_name,
            image: [imageUrl],
            family: data.family,
            habit: data.habit,
            remarkable_char: data.remarkable_char,
            med_use: data.med_use,
            other_use: data.other_use,
            food: data.food,
            eco_value: data.eco_value,
        };
        
        const treeType = await TreeType.create(obj);
        return treeType;
    };


    public static async updateTreeType(data: TreeTypeAttributes, files?: Express.Multer.File[]): Promise<TreeType> {

        // Upload images to S3
        let imageUrl = "";
        if (files && files.length !== 0) {
            imageUrl = await UploadFileToS3(files[0].filename, "treetype");
            data.image = [imageUrl];
        }
    
        const treeType = await TreeType.findByPk(data.id);
        if (!treeType) {
          throw new Error("Tree type not found")
        }
        const updatedTreeType = await treeType.update(data);
        return updatedTreeType;
    };

    public static async deleteTreeType(treeTypeId: string): Promise<number> {
        const resp = await TreeType.destroy({ where: { id: treeTypeId } });
        return resp;
    };

    public static async treeTypeCount(): Promise<number> {
        return await TreeType.count()
    }
}

export default TreeTypeRepository;