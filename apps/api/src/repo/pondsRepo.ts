import { Op } from 'sequelize';
import { Pond, PondAttributes, PondCreationAttributes } from '../models/pond'; // Assuming PondModel is the Sequelize model for the Pond entity
import { status } from '../helpers/status'
import { OnsiteStaff } from '../models/onsitestaff'
import { UploadFileToS3 } from "../controllers/helper/uploadtos3"; // Assuming UploadFileToS3 is a function
import { Sequelize } from 'sequelize'
import { User } from '../models/user';
import { PondWaterLevel, PondWaterLevelCreationAttributes } from '../models/pond_water_level';
// import { customAlphabet } from 'nanoid'
// const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 24)

export class PondRepository {
  public static async addPond(data: any, files?: Express.Multer.File[]): Promise<Pond> {

    let pondImageUrl = "";
    if (files && files.length !== 0) {
      pondImageUrl = await UploadFileToS3(files[0].filename, "ponds", data.pond_name);
    }

    let obj: PondCreationAttributes = {
      name: data.pond_name,
      length_ft: data.length,
      depth_ft: data.depth,
      width_ft: data.width,
      type: data.type,
      tags: [],
      images: [pondImageUrl]
    };
    const pondRes = await Pond.create(obj);
    return pondRes;
  }

  public static async updatePond(data: PondAttributes, files?: Express.Multer.File[]): Promise<Pond> {

    let pondImageUrl = "";
    if (files && files.length !== 0) {
      pondImageUrl = await UploadFileToS3(files[0].filename, "ponds", data.name);
      data.images = [pondImageUrl]
    }

    const pond = await Pond.findByPk(data.id);
    if (!pond) {
      throw new Error("Pond not found")
    }
    const updatedPond = await pond.update(data);
    return updatedPond;
  }

  public static async getPonds(filters: Record<string, any>, offset: number, limit: number) {
    try {
      const whereClause: Record<string, any> = {};
  
      if (filters.name) {
        whereClause.name = { [Op.iLike]: `%${filters.name}%` };
      }
      if (filters.type) {
        whereClause.type = { [Op.iLike]: `%${filters.type}%` };
      }
  
      return await Pond.findAll({
        where: whereClause,
        attributes: { exclude: ['updates'] },
        offset,
        limit,
      });
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

  public static async deletePond(pondId: string): Promise<void> {
    const resp = await Pond.destroy({ where: { id: pondId } });
    console.log("Delete Ponds Response for id: %s", pondId, resp);
  }

  public static async getHistory(pondName: string): Promise<Pond | null> {
    const result = await Pond.findOne({ where: { name: pondName } });
    return result;
  }

  public static async pondCount(): Promise<number> {
    return await Pond.count()
  }
}
