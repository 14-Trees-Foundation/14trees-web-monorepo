import { Tree, TreeAttributes, TreeCreationAttributes } from "../models/tree";
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { PlantType } from "../models/plant_type";
import { Plot } from "../models/plot";
import { OnsiteStaff } from "../models/onsitestaff";
import { User } from "../models/user";
import { Center } from "../models/common";
import { sequelize } from "../config/postgreDB";
import { Op, QueryTypes } from "sequelize";

class TreeRepository {
  public static async getTrees(offset: number = 0, limit: number = 20): Promise<Tree[]> {
    return await Tree.findAll({
      offset,
      limit
    });
  };

  public static async getTreeBySaplingId(saplingId: string): Promise<Tree | null> {
    return await Tree.findOne({ where: { sapling_id: saplingId } });
  };

  public static async getTreeByTreeId(treeId: string): Promise<Tree | null> {
    return await Tree.findByPk(treeId);
  };

  public static async addTree(data: any, files?: Express.Multer.File[]): Promise<Tree> {

    // Check if tree type exists
    let plantType = await PlantType.findOne({ where: { id: data.plant_type_id } });
    if (!plantType) {
      throw new Error("Plant type ID doesn't exist");
    }

    // Check if plot exists
    let plot = await Plot.findOne({ where: { plot_id: data.plot_id, id: data.plot_id } })
    if (!plot) {
      throw new Error("Plot ID doesn't exist");
    }

    // Check if sapling id exists
    let tree = await Tree.findOne({ where: { sapling_id: data.sapling_id } });
    if (tree !== null) {
      throw new Error("Sapling_id exists, please check!");
    }

    let mapped_to: User | null = null;
    if (data.mapped_to) {
      mapped_to = await User.findOne({ where: { id: data.mapped_to } });
    }

    // Upload images to S3
    let imageUrls = [];
    if (data.images && data.images.length > 0) {
      let images = data.images.split(",");
      for (const image in images) {
        const location = await UploadFileToS3(images[image], "trees");
        if (location !== "") {
          imageUrls.push(location);
        }
      }
    }

    let loc: Center | undefined;
    // Tree object to be saved in database
    if (data.lat) {
      loc = {
        type: "Point",
        coordinates: [data.lat, data.lng],
      };
    }

    let treeObj: TreeCreationAttributes = {
      sapling_id: data.sapling_id,
      tree_type_id: plantType.id,
      plot_id: plot.id,
      images: imageUrls,
      location: loc,
      mapped_to_user: mapped_to?.id,
    };
    const treeResp = Tree.create(treeObj);
    return treeResp;
  };


  public static async updateTree(data: TreeAttributes, files?: Express.Multer.File[]): Promise<Tree> {

    // Upload images to S3
    let imageUrls: string[] = [];
    if (files) {
      for (const file of files) {
        const location = await UploadFileToS3(file.filename, "trees");
        if (location !== "") {
          imageUrls.push(location);
        }
      }
      data.images = imageUrls;
    }

    const tree = await Tree.findByPk(data.id);
    if (!tree) {
      throw new Error("Tree not found")
    }
    const updatedTree = await tree.update(data);
    return updatedTree;
  };

  public static async deleteTree(treeId: string): Promise<number> {
    const resp = await Tree.destroy({ where: { id: treeId } });
    return resp;
  };

  public static async treeCount(): Promise<number> {
    return await Tree.count()
  }

  public static async getMappedTrees(email: string, offset: number, limit: number) {

    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      throw new Error("User with given email not found!");
    }

    const query = `select t.sapling_id, t."location", t.link, t.event_type, tt."name" as tree_type, p."name" as plot, u."name" as user from 
      trees t, tree_types tt, plots p, user_tree_regs utr, users u 
      where
      --t.mapped_to = '${user.id}' and
      t.tree_id  = tt."_id" and 
      t.plot_id  = p."_id"  and 
      t."_id"  = utr.tree and
      utr."user" = u."_id"
      offset ${offset} limit ${limit}
      `;

    const data = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })
    return { trees: data, user: user };
  };

  public static async getUserTreesCount(offset: number, limit: number) {

    const query = `select u."_id", u."name" as user, u.email, count(t."_id"), count(utr."_id") from 
      trees t, users u, user_tree_regs utr
      where t.mapped_to = u."_id" and 
      t."_id" = utr.tree 
      group by u."_id", u."name", u.email
      offset ${offset} limit ${limit}
      `;

    const data = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })
    return data;
  };


  public static async updateEventDataInTrees(saplingIds: string[], eventId: number) {
    const resp = await Tree.update({ event_id: eventId}, { where: { sapling_id: { [Op.in]: saplingIds } } });
    console.log("Update event data in trees response: ", resp);
  }

  public static async mapTrees(saplingIds: string[], emailId: string) {
    let user = await User.findOne({ where: { email: emailId } });
    if (user === null) {
      throw new Error("User with given email not found");
    }

    const resp = await Tree.update({ mapped_to_user: user.id, mapped_at: new Date() }, { where: { sapling_id: { [Op.in]: saplingIds } } });
    console.log("mapped trees response for email: %s", emailId, resp);
  }

  public static async mapTreesInPlot(emailId: string, plotId: string, count: number) {
    const user = await User.findOne({ where: { email: emailId } });
    if (user === null) {
      throw new Error("User with given email not found");
    }

    const plot = await Plot.findOne({ where: { [Op.or]: [{ plot_id: plotId }, { id: plotId }] } });
    if (!plot) {
      throw new Error("plot with given plot_id doesn't exists");
    }

    let trees: any[] = await Tree.findAll({
      where: {
        mapped_to_user: { [Op.is]: undefined },
        mapped_to_group: { [Op.is]: undefined },
        assigned_at: { [Op.is]: undefined },
        plot_id: { [Op.eq]: plot.id },
      },
      limit: count
    });

    if (trees.length != count) {
      throw new Error("not enough trees to assign");
    }

    for (let i = 0; i < count; i++) {
      trees[i].mapped_to = user.id;
      await trees[i].save();
    }
  }

  public static async unMapTrees(saplingIds: string[]) {
    const resp = await Tree.update({ mapped_to_user: undefined, mapped_at: undefined, mapped_to_group: undefined }, { where: { sapling_id: { [Op.in]: saplingIds } } });
    console.log("un mapped trees response: %s", resp);
  }
}

export default TreeRepository;