import { query } from "express";
import { sequelize } from "../config/postgreDB";
import { Op, QueryTypes } from "sequelize";
import { UserTree, UserTreeCreationAttributes } from "../models/userprofile";
import { Tree } from "../models/tree";
import { UserRepository, getUserDocumentFromRequestBody } from "./userRepo";
import { User } from "../models/user";
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { DeletedProfileUserTree, DeletedProfileUserTreeCreationAttributes } from "../models/deleteduserprofile";

export class UserTreeRepository {

    public static async getAllProfiles(offset: number = 0, limit: number = 20) {
        const query = `select p.name as plot,
                u.name as user,
                u.email,
                u.phone,
                u.date_added,
                u.userid,
                utr.date_added,
                t.sapling_id,
                tt.name as tree_type
        from user_tree_regs utr, users u , trees t , plots p , tree_types tt
        where u."_id" = utr."user"
        and t."_id" = utr.tree
        and p."_id" =t.plot_id
        and tt."_id"  = t.tree_id
        offset ${offset} limit ${limit}`;

        const data = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })
        return data;
    };

    public static async getUserProfile(userId: string) {
        const query = `select utr."user",
                p.name as plot,
                u.name as user,
                u."_id",
                u.email,
                u.phone,
                u.date_added,
                u.userid,
                utr.date_added,
                t.sapling_id,
                tt.name as tree_type
        from user_tree_regs utr, users u , trees t , plots p , tree_types tt , organizations o
        where
        utr."user"='${userId}' and
        u."_id" = utr."user"
        and t."_id" = utr.tree
        and p."_id" =t.plot_id
        and tt."_id"  = t.tree_id
        and o."_id" = utr.orgid`;

        const data = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })
        return data;
    };

    public static async getUserProfileForSamplingId(samplingId: string) {
        const query = `select t.sapling_id, 
                    t.image, 
                    t."location", 
                    t.mapped_to, 
                    t."desc",
                    tt."name", 
                    tt.scientific_name, 
                    tt.image as tt_image,
                    p."name" as plot,
                    p.boundaries,
                    utr.profile_image,
                    utr.donated_by,
                    donor."name" as "donated_by_name", 
                    utr.gifted_by, 
                    utr.planted_by, 
                    utr.memories, 
                    utr.plantation_type, 
                    utr.date_added,
                    u."_id", 
                    u."name" as user,
                    o."name" as org
        from trees t, tree_types tt, plots p, user_tree_regs utr, users u, organizations o, users donor
        where t.sapling_id = '${samplingId}' and
        tt."_id" = t.tree_id and
        t.plot_id = p."_id"  and
        utr.tree =t."_id" and
        utr."user" = u."_id" and
        o."_id" = utr.orgid and
        donor."_id" = utr.donated_by
        `;

        const data = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })
        return data;
    };

    public static async getUserProfileForId(id: string) {
        const query = `select t.sapling_id, 
                    t.image, 
                    t."location", 
                    t.mapped_to, 
                    t."desc",
                    tt."name", 
                    tt.scientific_name, 
                    tt.image as tt_image,
                    p."name" as plot,
                    p.boundaries,
                    utr.profile_image,
                    utr.donated_by,
                    donor."name" as "donated_by_name", 
                    utr.gifted_by, 
                    utr.planted_by, 
                    utr.memories, 
                    utr.plantation_type, 
                    utr.date_added,
                    u."_id", 
                    u."name" as user,
                    o."name" as org
        from trees t, tree_types tt, plots p, user_tree_regs utr, users u, organizations o, users donor
        where t._id = '${id}' and
        tt."_id" = t.tree_id and
        t.plot_id = p."_id"  and
        utr.tree =t."_id" and
        utr."user" = u."_id" and
        o."_id" = utr.orgid and
        donor."_id" = utr.donated_by
        `;

        const data = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })
        return data;
    };

    public static async addUserTree(saplingId: string, reqBody: any): Promise<UserTree> {
        let tree = await Tree.findOne({ where: { sapling_id: saplingId }});
        if (tree === null) {
            throw new Error("Tree with given sapling id not found");
        }
        
        let userTree = await UserTree.findOne({ where: { tree: tree.id }});
        if (userTree !== null) {
            throw new Error("Profile already exists for same Tree ID!");
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
        if (reqBody.userimages !== undefined) {
            if (reqBody.userimages.length > 0) {
                let userImages = reqBody.userimages.split(",");
                for (const image in userImages) {
                    const location = await UploadFileToS3(userImages[image], "users");
                    if (location != "") {
                    userImageUrls.push(location);
                    }
                }
            }
        }
        
        // Memories for the visit
        if (reqBody.memoryimages !== undefined) {
            if (reqBody.memoryimages.length > 0) {
                let memoryImages = reqBody.memoryimages.split(",");
                for (const image in memoryImages) {
                    const location = await UploadFileToS3(memoryImages[image], "memories");
                    if (location != "") {
                    memoryImageUrls.push(location);
                    }
                }
            }
        }
        
        let userTreeData: UserTreeCreationAttributes = {
            id: "",
            tree: tree,
            user: user,
            profile_image: userImageUrls,
            memories: memoryImageUrls,
            orgid: reqBody.org
            ? reqBody.org
            : "61726fe62793a0a9994b8bc2",
            donated_by: reqBody.donor
            ? reqBody.donor
            : null,
            plantation_type: reqBody.plantation_type
            ? reqBody.plantation_type
            : null,
            gifted_by: reqBody.gifted_by ? reqBody.gifted_by : null,
            planted_by: reqBody.planted_by ? reqBody.planted_by : null,
            date_added: new Date(),
        };
    
        const result = await UserTree.create(userTreeData);
        if(reqBody.desc) {
            tree.description = reqBody.desc;
            await tree.update(tree);
        }
        
        return result;
    }

    public static async removeUserTrees(saplingIds: string[]) {
        let trees = await Tree.findAll( { where: { sapling_id: { [Op.in]: saplingIds } } });

        for (let i = 0; i < trees.length; i++) {
            let userTree = await UserTree.findOne({ where: { tree: trees[i] } });
            if (!userTree) { continue; }
            let deletedProfile: DeletedProfileUserTreeCreationAttributes = {
                id: "",
                treeId: "",
                userId: "",
                profileImage: userTree.profile_image,
                memories: userTree.memories,
                orgId: userTree.orgid,
                donatedById: userTree.donated_by,
                plantationType: userTree.plantation_type,
                giftedBy: userTree.gifted_by,
                plantedBy: userTree.planted_by,
                dateAdded: userTree.date_added,
                dateDeleted: new Date()
            };
            await DeletedProfileUserTree.create(deletedProfile);
            await userTree.destroy();
        }
    }

    public static async userTreeCount(): Promise<number> {
        return await UserTree.count()
    }

}