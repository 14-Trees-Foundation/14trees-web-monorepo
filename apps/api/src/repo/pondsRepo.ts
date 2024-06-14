import { WhereOptions } from 'sequelize';
import { Pond, PondAttributes, PondCreationAttributes } from '../models/pond';
import { status } from '../helpers/status'
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { User } from '../models/user';
import { PondWaterLevel, PondWaterLevelCreationAttributes } from '../models/pond_water_level';
import { PaginatedResponse } from '../models/pagination';

export class PondRepository {
  public static async addPond(data: any, files?: Express.Multer.File[]): Promise<Pond> {

    let pondImageUrls = [];
    if (files && files.length !== 0) {
      const location = await UploadFileToS3(files[0].filename, "ponds", data.name);
      pondImageUrls.push(location)
    }

    let obj: PondCreationAttributes = {
      name: data.name,
      length_ft: data.length_ft,
      depth_ft: data.depth_ft,
      width_ft: data.width_ft,
      type: data.type,
      tags: data.tags,
      images: pondImageUrls,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const pondRes = await Pond.create(obj);
    return pondRes;
  }

  public static async updatePond(data: PondAttributes, files?: Express.Multer.File[]): Promise<Pond> {

    if (files && files.length !== 0) {
      const location = await UploadFileToS3(files[0].filename, "ponds", data.name);
      data.images = [location]
    }

    const pond = await Pond.findByPk(data.id);
    if (!pond) {
      throw new Error("Pond not found")
    }
    const updatedPond = await pond.update(data);
    return updatedPond;
  }

  public static async getPonds(offset: number, limit: number, whereClause: WhereOptions): Promise<PaginatedResponse<Pond>> {
    try {  
      return {
        offset: offset,
        total: await Pond.count({ where: whereClause }),
        results: await Pond.findAll({
          where: whereClause,
          offset: offset, 
          limit: limit
        })
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public static async addWaterLevelUpdate(req: any, res: any): Promise<void> {
    try {
      // Validation logic...
    } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
      return;
    }
    try {
      let user = null;
      if (req.body.user_id) {
        user = await User.findOne({ where: { id: req.body.user_id } });
      }
  
      let pond = null;
      if (req.body.pond_id) {
        pond = await User.findByPk(req.body.pond_id);
      }
  
      if (!pond) {
        throw new Error("Invalid pond id. Pond with given id not found!")
      }
  
      let pondImageUrl = "";
      if (req.files[0]) {
        pondImageUrl = await UploadFileToS3(req.files[0].filename, "ponds", req.body.pond_name);
      }
  
      let obj: PondWaterLevelCreationAttributes = {
        level_ft: req.body.levelFt,
        user_id: user?.id,
        pond_id: pond?.id,
        images: pondImageUrl === ""? undefined : [pondImageUrl],
      };

      const result = await PondWaterLevel.create(obj);
      res.status(status.success).send(result);
    } catch (error) {
      res.status(status.error).json({ error });
    }
  }

  public static async deletePond(pondId: string): Promise<number> {
    return await Pond.destroy({ where: { id: pondId } });
  }

  public static async pondCount(): Promise<number> {
    return await Pond.count()
  }
}
