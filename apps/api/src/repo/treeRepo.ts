import { Tree, TreeAttributes, TreeCreationAttributes } from "../models/tree";
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { PlantType } from "../models/plant_type";
import { Plot } from "../models/plot";
import { User } from "../models/user";
import { Center } from "../models/common";
import { sequelize } from "../config/postgreDB";
import { Op, QueryTypes } from "sequelize";
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { getUserDocumentFromRequestBody } from "./userRepo";
import { Group } from "../models/group";
import { getWhereOptions, getSqlQueryExpression } from "../controllers/helper/filters";

class TreeRepository {
  public static async getTrees(offset: number = 0, limit: number = 20, filters: FilterItem[]): Promise<PaginatedResponse<Tree>> {

    let whereCondition = "";
    let replacements: any = {}
    if (filters && filters.length > 0) {
        filters.forEach(filter => {
            let columnField = "t." + filter.columnField
            let valuePlaceHolder = filter.columnField
            if (filter.columnField === "assigned_to_name") {
              columnField = 'au."name"'
            } else if (filter.columnField === "mapped_user_name") {
              columnField = 'mu."name"'
            } else if (filter.columnField === "plot") {
              columnField = 'p."name"'
            } else if (filter.columnField === "plant_type") {
              columnField = 'pt."name"'
            }
            const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
            whereCondition = whereCondition + " " + condition + " AND";
            replacements = { ...replacements, ...replacement }
        })
        whereCondition = whereCondition.substring(0, whereCondition.length - 3);
    }

    let query = `
    SELECT t.*, 
      pt."name" as plant_type, 
      p."name" as plot, 
      mu."name" as mapped_user_name, 
      au."name" as assigned_to_name
    FROM "14trees".trees t 
    LEFT JOIN "14trees".plant_types pt ON pt.id = t.plant_type_id
    LEFT JOIN "14trees".plots p ON p.id = t.plot_id
    LEFT JOIN "14trees".users mu ON mu.id = t.mapped_to_user
    LEFT JOIN "14trees".users au ON au.id = t.assigned_to 
    WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
    `

    if (limit > 0) { query += `OFFSET ${offset} LIMIT ${limit};` }
    
    const trees: any = await sequelize.query(query, {
        replacements: replacements,
        type: QueryTypes.SELECT
    })

    const countQuery = `
    SELECT count(*)
    FROM "14trees".trees t 
    LEFT JOIN "14trees".plant_types pt ON pt.id = t.plant_type_id
    LEFT JOIN "14trees".plots p ON p.id = t.plot_id
    LEFT JOIN "14trees".users mu ON mu.id = t.mapped_to_user
    LEFT JOIN "14trees".users au ON au.id = t.assigned_to 
    WHERE ${whereCondition !== "" ? whereCondition : "1=1"};
    `
    const resp = await sequelize.query(countQuery, {
        replacements: replacements,
    });
    return { offset: offset, total: (resp[0][0] as any)?.count, results: trees as Tree[]};
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

  public static async treesCount(): Promise<number> {
    return await Tree.count()
  }

  public static async assignedTreesCount(): Promise<number> {
    return await Tree.count({ where: { assigned_to: { [Op.not]: null } } })
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

  public static async mapTrees(mapped_to: 'user' | 'group', saplingIds: string[], id: string) {

    const updateConfig: any = {
      mapped_at: new Date(),
    }

    if (mapped_to === "user") {
      let user = await User.findByPk(id);
      if (user === null) {
        throw new Error("User with given id not found");
      }
      updateConfig["mapped_to_user"] = user.id;
    } else {
      let group = await Group.findByPk(id);
      if (group === null) {
        throw new Error("Group with given id not found");
      }
      updateConfig["mapped_to_group"] = group.id;
    }

    const resp = await Tree.update( updateConfig, { where: { sapling_id: { [Op.in]: saplingIds } } });
    console.log("mapped trees %d for %s: %d", resp, mapped_to, id);
  }

  public static async mapTreesInPlot(mapped_to: 'user' | 'group', id: string, plotId: string, count: number) {
    const updateConfig: any = {
      mapped_at: new Date(),
    }

    if (mapped_to === "user") {
      let user = await User.findByPk(id);
      if (user === null) {
        throw new Error("User with given id not found");
      }
      updateConfig["mapped_to_user"] = user.id;
    } else {
      let group = await Group.findByPk(id);
      if (group === null) {
        throw new Error("Group with given id not found");
      }
      updateConfig["mapped_to_group"] = group.id;
    }

    const plot = await Plot.findOne({ where: { id: plotId } });
    if (!plot) {
      throw new Error("plot with given plot_id doesn't exists");
    }

    let trees: Tree[] = await Tree.findAll({
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
      await trees[i].update(updateConfig);
    }
  }

  public static async unMapTrees(saplingIds: string[]) {
    const resp = await Tree.update({ mapped_to_user: null, mapped_at: null, mapped_to_group: null }, { where: { sapling_id: { [Op.in]: saplingIds } } });
    console.log("un mapped trees response: %s", resp);
  }

  public static async assignTree(saplingId: string, reqBody: any): Promise<Tree> {
    let tree = await Tree.findOne({ where: { sapling_id: saplingId } });
    if (tree === null) {
      throw new Error("Tree with given sapling id not found");
    } else if (tree.assigned_to !== null) {
      throw new Error("Tree is already assigned to someone");
    }

    // Get the user
    let userDoc = await getUserDocumentFromRequestBody(reqBody);
    let user = await User.findOne({ where: { user_id: userDoc.user_id } });
    if (!user) {
      user = await User.create(userDoc);
    }

    // Upload images to S3
    let userImageUrls = []
    let memoryImageUrls = []

    // User Profile images
    if (reqBody.user_images !== undefined) {
      if (reqBody.user_images.length > 0) {
        let userImages = reqBody.user_images as string[]
        for (const image in userImages) {
          if (userImages[image] !== "") {
            const location = await UploadFileToS3(userImages[image], "users");
            if (location != "") {
              userImageUrls.push(location);
            }
          }
        }
      }
    }

    // Memories for the visit
    if (reqBody.memory_images !== undefined) {
        if (reqBody.memory_images.length > 0) {
            let memoryImages = reqBody.memory_images as string []
            for (const image in memoryImages) {
              if (memoryImages[image] !== "") {
                const location = await UploadFileToS3(memoryImages[image], "memories");
                if (location != "") {
                  memoryImageUrls.push(location);
                }
              }
            }
        }
    }

    const updateFields: any = {
      assigned_to: user.id,
      assigned_at: new Date(),
      user_tree_images: userImageUrls.join(","),
      memory_images: memoryImageUrls.join(","),
    } 
    if (reqBody.desc) {
      updateFields["description"] = reqBody.desc;
    }

    const result = await tree.update(updateFields);

    return result;
  }

  public static async unassignTrees(saplingIds: string[]): Promise<void> {
    await Tree.update({
      assigned_to: null,
      assigned_at: null,
      user_tree_images: null,
      memory_images: null,
    }, { where: { sapling_id: { [Op.in]: saplingIds } } });
  }
}

export default TreeRepository;