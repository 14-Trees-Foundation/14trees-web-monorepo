import { Op } from 'sequelize';
import { Pond, PondCreationAttributes } from '../models/pond'; // Assuming PondModel is the Sequelize model for the Pond entity
import { status } from '../helpers/status'
import { OnSiteStaff } from '../models/onsitestaff'
import { UploadFileToS3 } from "../controllers/helper/uploadtos3"; // Assuming UploadFileToS3 is a function
import { getOffsetAndLimitFromRequest } from '../controllers/helper/request';
import { Sequelize } from 'sequelize'

export class PondRepository {
  public static async addPond(data: any, files?: Express.Multer.File[]): Promise<Pond> {

    let pondImageUrl = "";
    if (files && files.length !== 0) {
      pondImageUrl = await UploadFileToS3(files[0].filename, "ponds", data.pond_name);
    }

    let obj: PondCreationAttributes = {
      name: data.pond_name,
      lengthFt: data.length,
      depthFt: data.depth,
      widthFt: data.width,
      desc: data.desc? data.desc : '',
      type: data.type,
      date_added: new Date(),
      tags: [],
      images: [pondImageUrl]
    };
    const pondRes = await Pond.create(obj);
    return pondRes;
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

    let user = null;
    if (req.body.user_id) {
      user = await OnSiteStaff.findOne({ where: { user_id: req.body.user_id } });
    }

    let pondImageUrl = "";
    if (req.files[0]) {
      pondImageUrl = await UploadFileToS3(req.files[0].filename, "ponds", req.body.pond_name);
    }

    let obj = {
      date: req.body.date === null ? new Date().toISOString() : req.body.date,
      levelFt: req.body.levelFt,
      user: user === null ? null : user,
      images: pondImageUrl,
    };
    try {
      const result = await Pond.update({
        updates: Sequelize.fn('array_append', Sequelize.col('updates'), obj)
      }, {
        where: { name: req.body.pond_name }
      });
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
}
