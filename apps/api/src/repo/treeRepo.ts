import { Tree, TreeAttributes, TreeCreationAttributes } from "../models/tree";
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { TreeType } from "../models/treetype";
import { Plot } from "../models/plot";
import { OnsiteStaff } from "../models/onsitestaff";
import { User } from "../models/user";
import { Center } from "../models/common";

class TreeRepository {
    public static async getTrees(offset: number = 0, limit: number = 20): Promise<Tree[]> {
        return await Tree.findAll({
            offset,
            limit
        });
    };

    public static async getTreeBySaplingId(saplingId: string): Promise<Tree | null> {
        return await Tree.findOne({ where: { sapling_id: saplingId }});
    };

    public static async getTreeByTreeId(treeId: string): Promise<Tree | null> {
        return await Tree.findByPk(treeId);
    };

    public static async addTree(data: any, files?: Express.Multer.File[]): Promise<Tree> {

        // Check if tree type exists
        let treeType = await TreeType.findOne({where: { tree_id: data.tree_id, id: data.tree_id }});
        if (!treeType) {
          throw new Error("Tree type ID doesn't exist" );
        }
      
        // Check if plot exists
        let plot = await Plot.findOne({where: { plot_id: data.plot_id, id: data.plot_id }})
        if (!plot) {
          throw new Error("Plot ID doesn't exist" );
        }
      
        // Check if sapling id exists
        let tree = await Tree.findOne({ where: { sapling_id: data.sapling_id }});
        if (tree !== null) {
          throw new Error("Sapling_id exists, please check!");
        }
      
        // get user
        let user: OnsiteStaff | null = null;
        if (
          data.user_id !== "" ||
          data.user_id !== undefined ||
          data.user_id !== null
        ) {
          user = await OnsiteStaff.findOne({where: {user_id: data.user_id, id: data.user_id}});
        }
      
        let mapped_to: User | null = null;
        if (data.mapped_to) {
          mapped_to = await User.findOne({where: {id: data.mapped_to}});
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
          id: "",
          sapling_id: data.sapling_id,
          tree_id: treeType.id,
          plot_id: plot.id,
          image: imageUrls,
          location: loc,
          user_id: user?.id,
          mapped_to: mapped_to?.id,
          date_added: new Date(),
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
          data.image = imageUrls;
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
}

export default TreeRepository;