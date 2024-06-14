import { Tree, TreeAttributes, TreeCreationAttributes } from "../models/tree";
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { PlantType } from "../models/plant_type";
import { Plot } from "../models/plot";
import { User } from "../models/user";
import { Center } from "../models/common";
import { sequelize } from "../config/postgreDB";
import { Op, QueryTypes, WhereOptions } from "sequelize";
import { PaginatedResponse } from "../models/pagination";

class TreeRepository {
  public static async getTrees(offset: number = 0, limit: number = 20, whereClause: WhereOptions): Promise<PaginatedResponse<Tree>> {
    return {
      offset: offset,
      total: await Tree.count({ where: whereClause }),
      results: await Tree.findAll({
        where: whereClause,
        offset,
        limit
      })
    };
  };

  public static async getTreeBySaplingId(saplingId: string): Promise<Tree | null> {
    return await Tree.findOne({ where: { sapling_id: saplingId } });
  };

  public static async getTreeByTreeId(treeId: string): Promise<Tree | null> {
    return await Tree.findByPk(treeId);
  };

  public static async addTree(data: any): Promise<Tree> {

    // Check if tree type exists
    let plantType = await PlantType.findOne({ where: { id: data.plant_type_id } });
    if (!plantType) {
      throw new Error("Plant type ID doesn't exist");
    }

    // Check if plot exists
    let plot = await Plot.findOne({ where: { id: data.plot_id } })
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
      for (const idx in images) {
        const location = await UploadFileToS3(images[idx], "trees");
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
      plant_type_id: plantType.id,
      plot_id: plot.id,
      images: imageUrls,
      location: loc,
      mapped_to_user: mapped_to?.id,
      created_at: new Date(),
      updated_at: new Date(),
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

    // user validation/invalidation update logic
    if (data.status === "system_invalidated" || data.status === "user_validated") {
      data.last_system_updated_at = new Date();
    } else {
        data.status = undefined;
        data.status_message = undefined;
        data.last_system_updated_at = undefined;
    }
    data.updated_at = new Date();

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

    const query = `select t.sapling_id, t."location", t.event_id, pt."name" as plant_type, p."name" as plot, u."name" as assigned_to from 
      trees t, plant_types pt, plots p, users u 
      where
      --t.mapped_to = '${user.id}' and
      t.plant_type_id  = pt.id and 
      t.plot_id  = p.id  and 
      t.assigned_to = u.id
      offset ${offset} limit ${limit}
      `;

    const data = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })
    return { trees: data, user: user };
  };

  public static async getUserTreesCount(offset: number, limit: number) {

    const query = `select u."id", u."name" as user, u.email, count(t."id"), count(t."assigned_to") from 
      trees t, users u
      where t.mapped_to = u."id"
      group by u."id", u."name", u.email
      offset ${offset} limit ${limit}
      `;

    const data = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })
    return data;
  };

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