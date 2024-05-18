//the controller of this file is in profilecontroller.ts


import { UserTree } from '../models/deleteduserprofile';
// import { DeletedProfile } from '../models/DeletedProfile';
// import { Tree } from '../models/Tree';
import { Sequelize } from 'sequelize-typescript';

// export class UserTreeRepository {
//   async deleteUserTreeByTree(tree: Tree): Promise&lt;void&gt; {
//   await UserTree.destroy({ where: { treeId: tree.id } });
// }
// }


// export const deleteProfile = async (req: Request, res: Response) =&gt; {
//   if (!req.query.id) {
//     res.status(status.bad).send({ error: "Sapling ID required" });
//     return;
//   }

//   let tree: Tree | null;
//   try {
//     tree = await userTreeRepository.findTreeBySaplingId(req.query.id as string);
//     if (tree === null) {
//       throw new Error("Sapling ID not found");
//     }

//     let userTree = await userTreeRepository.findUserTreeByTree(tree);
//     if (!userTree) {
//       throw new Error("User tree not found");
//     }

//     let deletedProfile = new DeletedProfile({
//       treeId: userTree.treeId,
//       userId: userTree.userId,
//       profileImage: userTree.profileImage,
//       memories: userTree.memories,
//       orgId: userTree.orgId,
//       donatedById: userTree.donatedById,
//       plantationType: userTree.plantationType,
//       giftedBy: userTree.giftedBy,
//       plantedBy: userTree.plantedBy,
//       dateAdded: userTree.dateAdded,
//       dateDeleted: new Date(),
//     });

//     await userTreeRepository.saveDeletedProfile(deletedProfile);
//   } catch (error: any) {
//     res.status(status.bad).send({ error: error.message });
//     return;
//   }

//   try {
//     await userTreeRepository.deleteUserTreeByTree(tree);
//     res.status(status.success).send();
//   } catch (error: any) {
//     res.status(status.bad).send({ error: error.message });
//     return;
//   }
// };