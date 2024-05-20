// import { errorMessage, successMessage, status } from "../helpers/status";
// import TreeType  from "../models/treetype"; // Assuming TreeType interface is defined in treetype.ts
// import User  from "../models/user"; // Assuming User interface is defined in user.ts
// import UserProfile  from "../models/userprofile"; // Assuming UserProfile interface is defined in userprofile.ts
// import { Request, Response } from "express";


// export const getAll = async (req: any, res: any): Promise<void> => {

//     let count = 0;
//     let key = req.query?.key;
//     console.log("Search key", key)
//     let result = await TreeType.aggregate([
//         {
//             '$search': {
//                 'index': 'treetypeindex',
//                 'text': {
//                     'query': key,
//                     'fuzzy': {},
//                     'path': {
//                         'wildcard': '*'
//                     }
//                 }
//             }
//         },
//         {
//             '$limit': 10
//         }
//     ]);

//     count += result.length;

//     // let user_result = await UserModel.aggregate([
//     //     {
//     //         '$search': {
//     //             'index': 'usersindex',
//     //             'text': {
//     //                 'query': key,
//     //                 "fuzzy": {},
//     //                 'path': {
//     //                     'wildcard': '*'
//     //                 }
//     //             }
//     //         }
//     //     },
//     //     {
//     //         '$project': {
//     //             'dob': 0,
//     //             'email': 0,
//     //             'userid': 0,
//     //             'phone': 0
//     //         }
//     //     },
//     //     {
//     //         '$limit': 10
//     //     }
//     // ])

//     let user_result = await User.aggregate([
//         {
//             '$search': {
//                 'index': 'usersindex',
//                 'text': {
//                     'query': key,
//                     "fuzzy": {},
//                     'path': {
//                         'wildcard': '*'
//                     }
//                 }
//             }
//         },
//         {
//             '$project': {
//                 'dob': 0,
//                 'email': 0,
//                 'phone': 0,
//                 '__v': 0,
//             }
//         },
//         {
//             '$limit': 10
//         },
//         {
//             '$lookup': {
//                 from: 'user_tree_regs',
//                 localField: '_id',
//                 foreignField: 'user',
//                 as: 'user_trees',
//             },
//         },
//     ]);

//     count += user_result.length;

//     res.status(status.success).json({
//         treetype: result,
//         users: user_result,
//         total_results: count,
//     })
// }