import { Tree, TreeAttributes, TreeCreationAttributes } from "../models/tree";
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { PlantType } from "../models/plant_type";
import { Plot } from "../models/plot";
import { User } from "../models/user";
import { Center, SortOrder } from "../models/common";
import { sequelize } from "../config/postgreDB";
import { Op, QueryTypes, WhereOptions } from "sequelize";
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { getUserDocumentFromRequestBody } from "./userRepo";
import { getSqlQueryExpression } from "../controllers/helper/filters";

class TreeRepository {
  public static async getTrees(offset: number = 0, limit: number = 20, filters: FilterItem[], orderBy?: SortOrder[]): Promise<PaginatedResponse<Tree>> {

    let whereCondition = "t.mapped_at IS NOT NULL";
    let replacements: any = {}
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        let columnField = "t." + filter.columnField
        let valuePlaceHolder = filter.columnField
        if (filter.columnField === "reserved_after") {
          columnField = 't.mapped_at';
          const dateValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
          whereCondition += ` AND ${columnField} >= :${valuePlaceHolder}`;
          replacements[valuePlaceHolder] = new Date(dateValue).toISOString(); // Ensure date format
      } else if (filter.columnField === "reserved_before") {
          columnField = 't.mapped_at';
          const dateValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
          whereCondition += ` AND ${columnField} <= :${valuePlaceHolder}`;
          replacements[valuePlaceHolder] = new Date(dateValue).toISOString(); // Ensure date format
      }   else if (filter.columnField === "assigned_after") {
          columnField = 't.assigned_at';
          const dateValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
          whereCondition += ` AND ${columnField} >= :${valuePlaceHolder}`;
          replacements[valuePlaceHolder] = new Date(dateValue).toISOString(); // Ensure date format
        } else if (filter.columnField === "assigned_before") {
          columnField = 't.assigned_at';
          const dateValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
          whereCondition += ` AND ${columnField} <= :${valuePlaceHolder}`;
          replacements[valuePlaceHolder] = new Date(dateValue).toISOString(); // Ensure date format
        } else {
        if (filter.columnField === "assigned_to_name") {
          columnField = 'au."name"'
        } else if (filter.columnField === "mapped_user_name") {
          columnField = 'mu."name"'
        } else if (filter.columnField === "mapped_group_name") {
          columnField = 'mg."name"'
        } else if (filter.columnField === "sponsor_user_name") {
          columnField = 'su."name"'
        } else if (filter.columnField === "sponsor_group_name") {
          columnField = 'sg."name"'
        } else if (filter.columnField === "plot") {
          columnField = 'p."name"'
        } else if (filter.columnField === "site_name") {
          columnField = 's.name_english'
        } else if (filter.columnField === "plant_type") {
          columnField = 'pt."name"'
        } else if (filter.columnField === "habit") {
          columnField = 'pt.habit'
        } else if (filter.columnField === "tree_health") {
          columnField = 't.tree_status'
        }
        const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
        whereCondition += ` AND ${condition}`; 
        replacements = { ...replacements, ...replacement }
      }
    })
  }

    let query = `
    SELECT t.mapped_at, t.*, 
      pt."name" as plant_type, 
      pt.habit as habit, 
      pt.illustration_s3_path as illustration_s3_path, 
      p."name" as plot,
      s.name_english as site_name,
      mu."name" as mapped_user_name, 
      mg."name" as mapped_group_name, 
      su."name" as sponsor_user_name, 
      sg."name" as sponsor_group_name, 
      au."name" as assigned_to_name,
      t.tree_status as tree_health
    FROM "14trees_2".trees t 
    LEFT JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
    LEFT JOIN "14trees_2".plots p ON p.id = t.plot_id
    LEFT JOIN "14trees_2".sites s ON s.id = p.site_id
    LEFT JOIN "14trees_2".users mu ON mu.id = t.mapped_to_user
    LEFT JOIN "14trees_2".groups mg ON mg.id = t.mapped_to_group
    LEFT JOIN "14trees_2".users su ON su.id = t.sponsored_by_user
    LEFT JOIN "14trees_2".groups sg ON sg.id = t.sponsored_by_group
    LEFT JOIN "14trees_2".users au ON au.id = t.assigned_to 
    WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
    ORDER BY ${ orderBy && orderBy.length !== 0 ? orderBy.map(o => 't.' + o.column + " " + o.order).join(", ") : 't.sapling_id'}
    `

    if (limit > 0) { query += `OFFSET ${offset} LIMIT ${limit};` }

    const trees: any = await sequelize.query(query, {
      replacements: replacements,
      type: QueryTypes.SELECT
    })

    const countQuery = `
    SELECT count(*)
    FROM "14trees_2".trees t 
    LEFT JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
    LEFT JOIN "14trees_2".plots p ON p.id = t.plot_id
    LEFT JOIN "14trees_2".sites s ON s.id = p.site_id
    LEFT JOIN "14trees_2".users mu ON mu.id = t.mapped_to_user
    LEFT JOIN "14trees_2".groups mg ON mg.id = t.mapped_to_group
    LEFT JOIN "14trees_2".users su ON su.id = t.sponsored_by_user
    LEFT JOIN "14trees_2".groups sg ON sg.id = t.sponsored_by_group
    LEFT JOIN "14trees_2".users au ON au.id = t.assigned_to 
    WHERE ${whereCondition !== "" ? whereCondition : "1=1"};
    `
    const resp = await sequelize.query(countQuery, {
      replacements: replacements,
    });
    return { offset: offset, total: (resp[0][0] as any)?.count, results: trees as Tree[] };
  };

  public static async getTreeBySaplingId(saplingId: string): Promise<Tree | null> {
    return await Tree.findOne({ where: { sapling_id: saplingId }, attributes: ['mapped_at', ...Object.keys(Tree.getAttributes())] });
  };

  public static async getTreeByTreeId(treeId: number): Promise<Tree | null> {
    return await Tree.findByPk(treeId, { attributes: ['mapped_at', ...Object.keys(Tree.getAttributes())]});
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
    let imageUrl: string | null = null;
    if (data.image && data.image.length > 0) {
      let image = data.image
      const location = await UploadFileToS3(image, "trees");
      if (location !== "") {
        imageUrl = location;
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

    const tags = data.tags ?? null;

    let treeObj: TreeCreationAttributes = {
      sapling_id: data.sapling_id,
      plant_type_id: plantType.id,
      plot_id: plot.id,
      image: imageUrl,
      location: loc,
      tags: tags,
      mapped_to_user: mapped_to?.id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const treeResp = await Tree.create(treeObj);
    return treeResp;
  };

  public static async addTreeObject(data: TreeCreationAttributes): Promise<Tree> {

    const treeResp = await Tree.create(data);
    return treeResp;
  };

  public static async updateTree(data: TreeAttributes, files?: Express.Multer.File[]): Promise<Tree> {

    // Upload images to S3
    if (files && files.length !== 0) {
      const location = await UploadFileToS3(files[0].filename, "trees");
      if (location !== "") {
        data.image = location;
      }
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

    const updateFields: any = { ...data }
    for (const [key, value] of Object.entries(data)) {
      if (value === "null") {
        updateFields[key] = null;
      }
    }
    const updatedTree = await tree.update(updateFields);
    return updatedTree;
  };

  public static async updateTrees(fields: any, whereClause: WhereOptions): Promise<number> {
    const resp = await Tree.update(fields, { where: whereClause });
    return resp[0];
  }

  public static async deleteTree(treeId: string): Promise<number> {
    const resp = await Tree.destroy({ where: { id: treeId } });
    return resp;
  };

  public static async treesCount(whereClause?: WhereOptions): Promise<number> {
    return await Tree.count({ where: whereClause });
  }

  public static async assignedAndBookedTreesCount() {
    return {
      assigned: await Tree.count({ where: { assigned_to: { [Op.not]: null } } }),
      booked: await Tree.count({ where: { mapped_to_user: { [Op.not]: null } } })
    };
  }

  public static async getMappedTrees(email: string, offset: number, limit: number) {

    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      throw new Error("User with given email not found!");
    }

    const query = `
      SELECT t.mapped_at, t.sapling_id, t."location", t.event_id, t.image,
        pt."name" AS plant_type, p."name" AS plot, 
        u."name" AS assigned_to
      FROM "14trees_2".trees AS t
      LEFT JOIN "14trees_2".plant_types AS pt ON pt.id = t.plant_type_id
      LEFT JOIN "14trees_2".plots AS p ON p.id = t.plot_id
      LEFT JOIN "14trees_2".users AS u ON u.id = t.assigned_to
      WHERE t.mapped_to_user = ${user.id};
      -- OFFSET ${offset} LIMIT ${limit};
    `;

    const countQuery = `
      SELECT count(t."id")
      FROM "14trees_2".trees AS t
      WHERE t.mapped_to_user = ${user.id};
    `;

    const data = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })

    const total: any[] = await sequelize.query(countQuery, {
      type: QueryTypes.SELECT
    })
    return {
      user: user,
      trees: {
        offset: offset,
        total: parseInt(total[0].count),
        results: data
      }
    };
  };

  public static async getMappedTreesForGroup(groupId: number, offset: number, limit: number) {

    const query = `
      SELECT t.mapped_at, t.sapling_id, t."location", t.event_id, t.image,
        pt."name" AS plant_type, p."name" AS plot, 
        u."name" AS assigned_to
      FROM "14trees_2".trees AS t
      LEFT JOIN "14trees_2".plant_types AS pt ON pt.id = t.plant_type_id
      LEFT JOIN "14trees_2".plots AS p ON p.id = t.plot_id
      LEFT JOIN "14trees_2".users AS u ON u.id = t.assigned_to
      WHERE t.mapped_to_group = ${groupId};
      -- OFFSET ${offset} LIMIT ${limit};
    `;

    const countQuery = `
      SELECT count(t."id")
      FROM "14trees_2".trees AS t
      WHERE t.mapped_to_group = ${groupId};
    `;

    const data = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })

    const total: any[] = await sequelize.query(countQuery, {
      type: QueryTypes.SELECT
    })
    return {
      trees: {
        offset: offset,
        total: parseInt(total[0].count),
        results: data
      }
    };
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

  public static async mapTrees(mapped_to: 'user' | 'group', saplingIds: string[], id: number, sponsorId: number | null) {

    const updateConfig: any = {
      mapped_at: new Date(),
      updated_at: new Date(),
    }

    if (mapped_to === "user") {
      updateConfig["mapped_to_user"] = id;
      updateConfig["sponsored_by_user"] = sponsorId;
    } else {
      updateConfig["mapped_to_group"] = id;
      updateConfig["sponsored_by_group"] = sponsorId;
    }

    const resp = await Tree.update(updateConfig, { where: { sapling_id: { [Op.in]: saplingIds } } });
    console.log("mapped trees %d for %s: %d", resp, mapped_to, id);
  }

  public static async mapTreesInPlot(mapped_to: 'user' | 'group', id: number, plotIds: number[], count: number, sponsorId: number | null) {
    const updateConfig: any = {
      mapped_at: new Date(),
      updated_at: new Date(),
    }

    if (mapped_to === "user") {
      updateConfig["mapped_to_user"] = id;
      updateConfig["sponsored_by_user"] = sponsorId;
    } else {
      updateConfig["mapped_to_group"] = id;
      updateConfig["sponsored_by_group"] = sponsorId;
    }

    let trees: Tree[] = await Tree.findAll({
      where: {
        mapped_to_user: { [Op.is]: undefined },
        mapped_to_group: { [Op.is]: undefined },
        assigned_at: { [Op.is]: undefined },
        plot_id: { [Op.in]: plotIds },
      },
      limit: count
    });

    if (trees.length != count) {
      throw new Error("not enough trees to assign");
    }

    for (let i = 0; i < count; i++) {
      await trees[i].update(updateConfig);
    }

    return trees.map(tree => tree.id);
  }

  public static async mapTreesToUserAndGroup(userId: number, groupId: number | null, treeIds: number[], donation_id?: number | null) {
    const updateConfig: any = {
      mapped_to_user: userId,
      mapped_to_group: groupId,
      sponsored_by_user: userId,
      sponsored_by_group: groupId,
      donation_id: donation_id,
      mapped_at: new Date(),
      updated_at: new Date(),
    }


    await Tree.update( updateConfig, {
      where: {
        id: { [Op.in]: treeIds },
      },
    });
  }

  public static async mapTreesInPlotToUserAndGroup(userId: number, groupId: number | null, plotIds: number[], count: number, bookNonGiftable: boolean = false, diversify: boolean = false, booAllHabitats: boolean = false, donation_id?: number | null) {
    const updateConfig: any = {
      mapped_to_user: userId,
      mapped_to_group: groupId,
      sponsored_by_user: userId,
      sponsored_by_group: groupId,
      donation_id: donation_id,
      mapped_at: new Date(),
      updated_at: new Date(),
    }

    let query = `
      SELECT t.id as tree_id, pt."name" as plant_type
      FROM "14trees_2".trees t
      JOIN "14trees_2".plant_types pt on pt.id = t.plant_type_id ${booAllHabitats ? '' : 'AND pt.habit = \'Tree\''}
      JOIN "14trees_2".plot_plant_types ppt ON ppt.plot_id = t.plot_id AND ppt.plant_type_id = t.plant_type_id AND ppt.sustainable = true
    `

    if (!bookNonGiftable) {
      query += `JOIN "14trees_2".plant_type_card_templates ptct on ptct.plant_type = pt."name"\n`
    }

    query += 'WHERE t.mapped_to_user IS NULL AND t.mapped_to_group IS NULL AND t.assigned_to IS NULL AND t.plot_id IN (' + plotIds.join(',') + ')\n'
    if (!diversify) {
      query += `LIMIT ${count}`
    }

    const resp: any[] = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })

    const plantTypeTreesMap: Record<string, number[]> = {};
    const finalTreeIds: number[] = [];

    for (let i = 0; i < resp.length; i++) {
      if (!plantTypeTreesMap[resp[i].plant_type]) {
        plantTypeTreesMap[resp[i].plant_type] = [resp[i].tree_id];
      } else {
        plantTypeTreesMap[resp[i].plant_type].push(resp[i].tree_id);
      }
    }

    const treeIds2D = Object.values(plantTypeTreesMap);
    let i = 0, remaining = count, noMoreTrees = false;
    while (remaining > 0) {
      noMoreTrees = true;
      for (const treeIds of treeIds2D) {
        if (treeIds.length > i) {
          noMoreTrees = false;
          finalTreeIds.push(treeIds[i])
          remaining--;
        }

        if (remaining === 0) break;
      }

      i++;
      if (noMoreTrees) break;
    }

    await Tree.update( updateConfig, {
      where: {
        id: { [Op.in]: finalTreeIds },
      },
    });

    return finalTreeIds;
  }

  public static async unMapTrees(saplingIds: string[]) {
    const resp = await Tree.update({ mapped_to_user: null, mapped_at: null, mapped_to_group: null, sponsored_by_group: null, sponsored_by_user: null,  updated_at: new Date(), }, { where: { sapling_id: { [Op.in]: saplingIds } } });
    console.log("un mapped trees response: %s", resp);
  }

  public static async assignTree(saplingId: string, reqBody: any, eventId?: number): Promise<Tree> {
    let tree = await Tree.findOne({ where: { sapling_id: saplingId } });
    if (tree === null) {
      throw new Error("Tree with given sapling id not found");
    } else if (tree.assigned_to !== null) {
      throw new Error("Tree is already assigned to someone");
    }

    // Get the user
    let userDoc = getUserDocumentFromRequestBody(reqBody);
    let user = await User.findOne({ where: { email: userDoc.email } });
    if (!user) {
      user = await User.create(userDoc);
    }

    // Upload images to S3
    let userImageUrl: string | null = null;
    let memoryImageUrls: string[] | null = null;

    // User Profile images
    if (reqBody.user_image !== undefined) {
      if (reqBody.user_image.length > 0) {
        const location = await UploadFileToS3(reqBody.user_image, "users");
        if (location != "") {
          userImageUrl = location;
        }
      }
    }

    // Memories for the visit
    if (reqBody.album_images !== undefined) {
      if (reqBody.album_images.length > 0) {
        let memoryImages = reqBody.album_images.split(",");
        if (memoryImages.length > 0) {
          memoryImageUrls = memoryImages;
        }
      }
    }

    const updateFields: any = {
      assigned_to: user.id,
      assigned_at: new Date(),
      sponsored_by_user: reqBody.sponsored_by_user || null,
      sponsored_by_group: reqBody.sponsored_by_group || null,
      gifted_by: reqBody.gifted_by || null,
      planted_by: reqBody.planted_by || null,
      user_tree_image: userImageUrl,
      memory_images: memoryImageUrls,
      description: reqBody.description || null,
      event_id: eventId || null,
      event_type: reqBody.type || null,
      updated_at: new Date(),
    }

    const result = await tree.update(updateFields);

    return result;
  }

  public static async unassignTrees(saplingIds: string[]): Promise<void> {
    await Tree.update({
      assigned_to: null,
      assigned_at: null,
      description: null,
      event_id: null,
      user_tree_image: null,
      memory_images: null,
      gifted_by_name: null,
      gifted_by: null,
      gifted_to: null,
      sponsored_by_user: null,
      sponsored_by_group: null,
      updated_at: new Date(),
    }, { where: { sapling_id: { [Op.in]: saplingIds } } });
  }

  public static async countUserMappedTrees(userId: number): Promise<number> {
    return await Tree.count({ where: { mapped_to_user: userId } });
  }

  public static async countUserAssignedTrees(userId: number): Promise<number> {
    return await Tree.count({ where: { assigned_to: userId } });
  }

  public static async getUserProfilesForUserId(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        t.mapped_at, t.sapling_id, t.image, t."location", t.mapped_to_user, t.description, 
        t.user_tree_image, t.sponsored_by_user, du."name" AS sponsored_by_user_name, 
        t.gifted_by, t.gifted_by_name, t.planted_by, t.memory_images, t.created_at, t.assigned_at, t.event_type,
        pt."name" AS plant_type, pt.scientific_name, pt.images AS plant_type_images, 
        p."name" AS plot, p.boundaries,
        au."name" AS assigned_to,
        au."id" AS assigned_to_id, gu."name" AS gifted_by_user, t.created_at,
        array_agg(distinct(vi.image_url)) AS visit_images,
        json_agg(ts) AS tree_audits
      FROM "14trees_2".trees t
      JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
      JOIN "14trees_2".plots p ON p.id = t.plot_id
      LEFT JOIN "14trees_2".users du ON du.id = t.sponsored_by_user
      LEFT JOIN "14trees_2".users au ON au.id = t.assigned_to
      LEFT JOIN "14trees_2".users gu ON gu.id = t.gifted_by
      LEFT JOIN "14trees_2".visits v ON v.id = t.visit_id
      LEFT JOIN "14trees_2".visit_images vi ON v.id = vi.visit_id
      LEFT JOIN "14trees_2".trees_snapshots ts ON ts.sapling_id = t.sapling_id
      WHERE t.assigned_to = '${userId}'
      GROUP BY v.id, t.id, pt.id, p.id, du.id, au.id, gu.id;
    `;

    const data: any[] = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })
    return data;
  }

  public static async getDeletedTreesFromList(treeIds: number[]): Promise<number[]> {
    const query = `SELECT num
    FROM unnest(array[:tree_ids]::int[]) AS num
    LEFT JOIN "14trees_2".trees AS t
    ON num = t.id
    WHERE t.id IS NULL;`

    const result = await sequelize.query(query, {
      replacements: { tree_ids: treeIds },
      type: QueryTypes.SELECT
    })

    return result.map((row: any) => row.num);
  }

  public static async getTreePlantationsInfo(offset: number, limit: number, filters?: FilterItem[]): Promise<PaginatedResponse<any>> {

    let whereCondition = "";
    let replacements: any = {}
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        let columnField = "t." + filter.columnField
        let valuePlaceHolder = filter.columnField
        if (filter.columnField === "user_name") {
          columnField = 'u."name"'
        } else if (filter.columnField === "plot_name") {
          columnField = 'p."name"'
        }

        const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
        whereCondition = whereCondition + " " + condition + " AND";
        replacements = { ...replacements, ...replacement }
      })
      whereCondition = whereCondition.substring(0, whereCondition.length - 3);
    }

    const query = `
      SELECT u.name as user_name, p."name" as plot_name, count(t.id) as trees_planted
      FROM "14trees_2".trees t
      JOIN "14trees_2".plots p ON p.id = t.plot_id
      JOIN "14trees_2".users u ON u.name = t.planted_by
      WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
      GROUP BY u.name, p."name"
      OFFSET ${offset} LIMIT ${limit};
    `;

    const result = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      replacements
    })

    const countQuery = `
      SELECT count(*)
      FROM (
        SELECT u.name as user_name, p."name" as plot_name, count(t.id) as trees_planted
        FROM "14trees_2".trees t
        JOIN "14trees_2".plots p ON p.id = t.plot_id
        JOIN "14trees_2".users u ON u.name = t.planted_by
        WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        GROUP BY u.name, p."name"
      ) as count_table;
    `;

    const countResult: any[] = await sequelize.query(countQuery, {
      type: QueryTypes.SELECT,
      replacements
    })

    return {
      offset: offset,
      total: countResult[0]?.count ? parseInt(countResult[0]?.count) : 0,
      results: result
    };
  }


  public static async getGiftableTrees(offset: number, limit: number, filters?: FilterItem[], include_no_giftable: boolean = false, include_all_habits: boolean = false): Promise<PaginatedResponse<any>> {

    let whereCondition = "";
    let replacements: any = {}
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        let columnField = "t." + filter.columnField
        let valuePlaceHolder = filter.columnField
        if (filter.columnField === "plot_id") {
          columnField = 'p.id'
        } else if (filter.columnField === "plot") {
          columnField = 'p."name"'
        } else if (filter.columnField === "plant_type") {
          columnField = 'pt."name"'
        } else if (filter.columnField === "category" || filter.columnField === "use" || filter.columnField === "tags") {
          columnField = 'pt.' + filter.columnField
        }

        const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
        whereCondition = whereCondition + " " + condition + " AND";
        replacements = { ...replacements, ...replacement }
      })
      whereCondition = whereCondition.substring(0, whereCondition.length - 3);
    }

    let query = `
      SELECT t.id, t.sapling_id, pt.name as plant_type, p.name as plot
      FROM "14trees_2".trees t
      JOIN "14trees_2".plots p ON p.id = t.plot_id
      JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id ${ include_all_habits ? '' : 'AND pt.habit = \'Tree\''}
      JOIN "14trees_2".plot_plant_types ppt ON ppt.plot_id = t.plot_id AND ppt.plant_type_id = t.plant_type_id AND ppt.sustainable = true`

    if (!include_no_giftable) {
      query += '\nJOIN "14trees_2".plant_type_card_templates ptt ON ptt.plant_type = pt.name'
    }

    query += `
      WHERE
        t.mapped_to_user IS NULL
        AND t.mapped_to_group IS NULL
        AND t.assigned_to IS NULL
        AND ${whereCondition !== "" ? whereCondition : "1=1"}
      ORDER BY t.id DESC
      OFFSET ${offset} LIMIT ${limit};
    `;

    const result = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      replacements
    })

    let countQuery = `
      SELECT count(t.id)
      FROM "14trees_2".trees t
      JOIN "14trees_2".plots p ON p.id = t.plot_id
      JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id ${ include_all_habits ? '' : 'AND pt.habit = \'Tree\''}
      JOIN "14trees_2".plot_plant_types ppt ON ppt.plot_id = t.plot_id AND ppt.plant_type_id = t.plant_type_id AND ppt.sustainable = true`

    if (!include_no_giftable) '\nJOIN "14trees_2".plant_type_card_templates ptt ON ptt.plant_type = pt.name'

    countQuery += `
        WHERE t.mapped_to_user IS NULL
        AND t.mapped_to_group IS NULL
        AND t.assigned_to IS NULL
        AND ${whereCondition !== "" ? whereCondition : "1=1"}
    `;

    const countResult: any[] = await sequelize.query(countQuery, {
      type: QueryTypes.SELECT,
      replacements
    })

    return {
      offset: offset,
      total: countResult[0]?.count ? parseInt(countResult[0]?.count) : 0,
      results: result
    };
  }

  public static async getTreeTags(offset: number, limit: number): Promise<PaginatedResponse<string>> {
    const tags: string[] = [];

    const getUniqueTagsQuery = 
        `SELECT DISTINCT tag
            FROM "14trees_2".trees t,
            unnest(t.tags) AS tag
            ORDER BY tag
            OFFSET ${offset} LIMIT ${limit};`;

    const countUniqueTagsQuery = 
        `SELECT count(DISTINCT tag)
            FROM "14trees_2".trees t,
            unnest(t.tags) AS tag;`;

    const tagsResp: any[] = await sequelize.query( getUniqueTagsQuery,{ type: QueryTypes.SELECT });
    tagsResp.forEach(r => tags.push(r.tag));

    const countResp: any[] = await sequelize.query( countUniqueTagsQuery,{ type: QueryTypes.SELECT });
    const total = parseInt(countResp[0].count);
    return { offset: offset, total: total, results: tags };
  }

  public static async getMappedGiftTrees(offset: number, limit: number, groupId: number, filters?: FilterItem[]): Promise<PaginatedResponse<Tree>> {

    let whereCondition = "";
    let replacements: any = {}
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        let columnField = "t." + filter.columnField
        let valuePlaceHolder = filter.columnField
        if (filter.columnField === "assigned_to_name") {
          columnField = 'au.name'
        }

        const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
        whereCondition = whereCondition + " " + condition + " AND";
        replacements = { ...replacements, ...replacement }
      })
      whereCondition = whereCondition.substring(0, whereCondition.length - 3);
    }

    const query = `
      SELECT t.mapped_at, t.*, gc.id as gift_card_id, gcr.request_id, gcr.planted_by as gifted_by, gcr.logo_url,
        pt."name" as plant_type, 
        pt.habit as habit, 
        pt.illustration_s3_path as illustration_s3_path, 
        p."name" as plot,
        s.name_english as site_name,
        mu."name" as mapped_user_name, 
        mg."name" as mapped_group_name, 
        su."name" as sponsor_user_name, 
        sg."name" as sponsor_group_name, 
        au."name" as assigned_to_name,
        t.tree_status as tree_health,
        ptct.template_image
      FROM "14trees_2".trees t
      JOIN "14trees_2".gift_cards gc on gc.tree_id = t.id
      JOIN "14trees_2".gift_card_requests gcr on gc.gift_card_request_id = gcr.id
      LEFT JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
      LEFT JOIN "14trees_2".plant_type_card_templates ptct ON pt.name = ptct.plant_type
      LEFT JOIN "14trees_2".plots p ON p.id = t.plot_id
      LEFT JOIN "14trees_2".sites s ON s.id = p.site_id
      LEFT JOIN "14trees_2".users mu ON mu.id = t.mapped_to_user
      LEFT JOIN "14trees_2".groups mg ON mg.id = t.mapped_to_group
      LEFT JOIN "14trees_2".users su ON su.id = t.sponsored_by_user
      LEFT JOIN "14trees_2".groups sg ON sg.id = t.sponsored_by_group
      LEFT JOIN "14trees_2".users au ON au.id = t.assigned_to 
      WHERE t.mapped_to_group = ${groupId} AND ${whereCondition !== "" ? whereCondition : "1=1"}
      ORDER BY t.id DESC
      ${ limit > 0 ? `OFFSET ${offset} LIMIT ${limit}` : ''}`;

    const countQuery = `
      SELECT count(*)
      FROM "14trees_2".trees t
      JOIN "14trees_2".gift_cards gc on gc.tree_id = t.id
      JOIN "14trees_2".gift_card_requests gcr on gc.gift_card_request_id = gcr.id
      LEFT JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
      LEFT JOIN "14trees_2".plant_type_card_templates ptct ON pt.name = ptct.plant_type
      LEFT JOIN "14trees_2".plots p ON p.id = t.plot_id
      LEFT JOIN "14trees_2".sites s ON s.id = p.site_id
      LEFT JOIN "14trees_2".users mu ON mu.id = t.mapped_to_user
      LEFT JOIN "14trees_2".groups mg ON mg.id = t.mapped_to_group
      LEFT JOIN "14trees_2".users su ON su.id = t.sponsored_by_user
      LEFT JOIN "14trees_2".groups sg ON sg.id = t.sponsored_by_group
      LEFT JOIN "14trees_2".users au ON au.id = t.assigned_to 
      WHERE t.mapped_to_group = ${groupId} AND ${whereCondition !== "" ? whereCondition : "1=1"}`;

      const trees: any = await sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements
      })
  
      const resp = await sequelize.query(countQuery, {
        type: QueryTypes.SELECT,
        replacements
      });

      return { offset: offset, total: (resp[0] as any)?.count, results: trees as Tree[] };
  }


  public static async getMappedGiftTreesAnalytics(groupId: number): Promise<any> {

    const query = `
      SELECT count(t.id) as total_trees, count(t.assigned_to) as gifted_trees
      FROM "14trees_2".trees t
      JOIN "14trees_2".gift_cards gc on gc.tree_id = t.id
      LEFT JOIN "14trees_2".groups mg ON mg.id = t.mapped_to_group
      WHERE t.mapped_to_group = :groupId`;

      const data: any[] = await sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { groupId }
      })

      return data[0];
  }
}

export default TreeRepository;