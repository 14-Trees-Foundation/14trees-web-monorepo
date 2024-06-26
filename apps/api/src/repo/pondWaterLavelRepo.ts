import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { PondWaterLevel, PondWaterLevelCreationAttributes } from '../models/pond_water_level';
import { PaginatedResponse } from '../models/pagination';

export class PondWaterLevelRepository {

    public static async getPondWaterLevelUpdates(pondId: number, offset: number, limit: number): Promise<PaginatedResponse<PondWaterLevel>> {
        return {
            offset: offset,
            total: await PondWaterLevel.count({ where: { pond_id: pondId } }),
            results: await PondWaterLevel.findAll({
                where: { pond_id: pondId },
                offset: offset,
                limit: limit
            })
        };
    }

    public static async addPondWaterLevelUpdate(data: any, files?: Express.Multer.File[]): Promise<PondWaterLevel> {

        let pondImageUrl: string | null = null;
        if (files && files.length !== 0) {
            pondImageUrl = await UploadFileToS3(files[0].filename, "ponds", data.name);
        }

        let obj: PondWaterLevelCreationAttributes = {
            user_id: data.user_id,
            pond_id: data.pond_id,
            level_ft: data.level_ft,
            image: pondImageUrl,
            updated_at: new Date(),
        }

        const result = await PondWaterLevel.create(obj);
        return result;
    }

    public static async updatePondWaterLevelEntry(data: PondWaterLevelCreationAttributes, pondName: string, files?: Express.Multer.File[]): Promise<PondWaterLevel> {

        if (files && files.length !== 0) {
            const location = await UploadFileToS3(files[0].filename, "ponds", pondName);
            data.image = location
        }

        const waterLevelUpdate = await PondWaterLevel.findByPk(data.id);
        if (!waterLevelUpdate) {
            throw new Error("Pond Water Level Update not found")
        }
        const result = await waterLevelUpdate.update(data);
        return result;
    }

    public static async deletePondWaterLevelUpdate(id: number): Promise<number> {
        return await PondWaterLevel.destroy({ where: { id: id } });
    }
}
