import { Op } from 'sequelize';
import { Pond as PondModel } from '../models/pond'; // Assuming PondModel is the Sequelize model for the Pond entity

// export class PondRepository {
//   public static async addPond(req: any, res: any): Promise<void> {
//     try {
//       // Validation logic...
//     } catch (error) {
//       res.status(status.bad).send({ error: error.message });
//       return;
//     }

//     let user = null;
//     if (req.body.user_id) {
//       user = await OnSiteStaff.findOne({ where: { user_id: req.body.user_id } });
//     }

//     let pondImageUrl = "";
//     if (req.files[0]) {
//       pondImageUrl = await uploadHelper.UploadFileToS3(req.files[0].filename, "ponds", req.body.pond_name);
//     }

//     let obj = {
//       name: req.body.pond_name,
//       plot_id: req.body.plot_code,
//       lengthFt: req.body.length,
//       depthFt: req.body.depth,
//       widthFt: req.body.width,
//       user_id: user === null ? null : user,
//       type: req.body.type,
//       date_added: new Date().toISOString(),
//     };
//     try {
//       const pondRes = await PondModel.create(obj);
//       res.status(status.created).json({
//         pond: pondRes,
//       });
//     } catch (error) {
//       res.status(status.error).json({ error });
//     }
//   }

//   public static async getPonds(req: any, res: any): Promise<void> {
//     const { offset, limit } = getOffsetAndLimitFromRequest(req);
//     let filters: any = {};
//     if (req.query?.name) {
//       filters["name"] = { [Op.iLike]: `%${req.query.name}%` };
//     }
//     if (req.query?.type) {
//       filters["type"] = { [Op.iLike]: `%${req.query.type}%` };
//     }
//     try {
//       const result = await PondModel.findAll({
//         where: filters,
//         attributes: { exclude: ['updates'] },
//         offset,
//         limit
//       });
//       res.status(status.success).send(result);
//     } catch (error) {
//       res.status(status.error).json({
//         status: status.error,
//         message: error.message,
//       });
//     }
//   }

//   public static async addUpdate(req: any, res: any): Promise<void> {
//     try {
//       // Validation logic...
//     } catch (error) {
//       res.status(status.bad).send({ error: error.message });
//       return;
//     }

//     let user = null;
//     if (req.body.user_id) {
//       user = await OnSiteStaff.findOne({ where: { user_id: req.body.user_id } });
//     }

//     let pondImageUrl = "";
//     if (req.files[0]) {
//       pondImageUrl = await uploadHelper.UploadFileToS3(req.files[0].filename, "ponds", req.body.pond_name);
//     }

//     let obj = {
//       date: req.body.date === null ? new Date().toISOString() : req.body.date,
//       levelFt: req.body.levelFt,
//       user: user === null ? null : user,
//       images: pondImageUrl,
//     };
//     try {
//       const result = await PondModel.update({
//         updates: Sequelize.fn('array_append', Sequelize.col('updates'), obj)
//       }, {
//         where: { name: req.body.pond_name }
//       });
//       res.status(status.success).send(result);
//     } catch (error) {
//       res.status(status.error).json({ error });
//     }
//   }

//   public static async deletePond(req: any, res: any): Promise<void> {
//     try {
//       const resp = await PondModel.destroy({ where: { id: req.params.id } });
//       console.log("Delete Ponds Response for id: %s", req.params.id, resp);
//       res.status(status.success).json({
//         message: "Pond deleted successfully",
//       });
//     } catch (error) {
//       res.status(status.bad).send({ error: error.message });
//     }
//   }

//   public static async getHistory(req: any, res: any): Promise<void> {
//     if (!req.query.pond_name) {
//       res.status(status.bad).send({ error: "Pond name required!" });
//       return;
//     }
//     try {
//       const result = await PondModel.findAll({ where: { name: req.query.pond_name } });
//       res.status(status.success).send(result);
//     } catch (error) {
//       res.status(status.error).json({
//         status: status.error,
//         message: error.message,
//       });
//     }
//   }
// }
