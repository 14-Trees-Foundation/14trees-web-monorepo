import { Op } from 'sequelize';
import { Event } from '../models/events';
// import { UserTree } from '../models/UserTree';
// import { User } from '../models/User';
// import { Tree } from '../models/Tree';
// import uploadHelper from '../helpers/uploadHelper';
import { Request, Response } from 'express';

export class EventRepository {
  // public async addEvent(req: Request, res: Response): Promise<void> {
  //   const fields = req.body;
  //   const saplingids = fields.sapling_id.split(/[ ,]+/);
  //   let mimageurl: string[] = [];
  //   let userImageUrls: string[] = [];
  //   let donor: string | null = null;

  //   try {
  //     if (fields.type === "1" || fields.type === "2" || fields.type === "3") {
  //       const user = await User.create({ ...req.body });

  //       if (req.body.albumimages) {
  //         mimageurl = req.body.albumimages.split(",");
  //       }

  //       if (req.body.userimages) {
  //         const userimages = req.body.userimages.split(",");
  //         for (const image of userimages) {
  //           const location = await uploadHelper.UploadFileToS3(image, "users");
  //           if (location) {
  //             userImageUrls.push(location);
  //           }
  //         }
  //       }

  //       if (req.body.donor) {
  //         const dUser = await User.findByPk(req.body.donor);
  //         donor = dUser?.name || null;
  //       }

  //       const user_tree_reg_ids: number[] = [];
  //       for (const saplingid of saplingids) {
  //         const tree = await Tree.findOne({ where: { sapling_id: saplingid } });
  //         if (tree) {
  //           const user_tree_data = await UserTree.create({
  //             tree_id: tree.id,
  //             user_id: user.id,
  //             profile_image: userImageUrls,
  //             memories: mimageurl,
  //             orgid: req.body.org || 'default_org_id',
  //             donated_by: req.body.donor || null,
  //             gifted_by: req.body.gifted_by || null,
  //             planted_by: req.body.planted_by || null,
  //             date_added: new Date(),
  //           });

  //           if (req.body.desc) {
  //             await Tree.update(
  //               { desc: req.body.desc },
  //               { where: { sapling_id: saplingid } }
  //             );
  //           }

  //           user_tree_reg_ids.push(user_tree_data.id);
  //         }
  //       }

  //       const link = Math.random().toString(36).substring(2, 10);
  //       const event = await Event.create({
  //         assigned_to: user.id,
  //         assigned_by: req.body.donor,
  //         user_trees: user_tree_reg_ids,
  //         plot_id: req.body.plot_id,
  //         type: req.body.type,
  //         link,
  //         desc: req.body.desc || '',
  //         date: new Date(),
  //       });

  //       res.status(201).send({ result: event });
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send({ error: 'Internal Server Error' });
  //   }
  // }

  public static async getEvents(query: any, offset: number, limit: number): Promise<Event[]> {
    const whereClause: Record<string, any> = {};
    if (query.name) {
      whereClause.name = { [Op.iLike]: `%${query.name}%` };
    }
    if (query.type) {
      whereClause.type = { [Op.iLike]: `%${query.type}%` };
    }

    const events = await Event.findAll({
      where: whereClause,
      offset: offset,
      limit: limit
    })
    return events;
  }

  public static async deleteEvent(id: string): Promise<void> {
    const resp = await Event.destroy({ where: { id: id }});
    console.log("Delete event response for event id: %s", id, resp);
  }
}

export default EventRepository;