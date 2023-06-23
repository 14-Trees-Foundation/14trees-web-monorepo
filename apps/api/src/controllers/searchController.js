const { errorMessage, successMessage, status } = require("../helpers/status");

const TreeTypeModel = require("../models/treetype");
const UserModel = require("../models/user");
const UserTreeModel = require("../models/userprofile");

module.exports.getAll = async (req, res) => {

    let count = 0;
    let key = req.query.key;
    console.log("Search key", key)
    let result = await TreeTypeModel.aggregate([
        {
            '$search': {
                'index': 'treetypeindex',
                'text': {
                    'query': key,
                    'fuzzy': {},
                    'path': {
                        'wildcard': '*'
                    }
                }
            }
        },
        {
            '$limit': 10
        }
    ]);

    count += result.length;

    // let user_result = await UserModel.aggregate([
    //     {
    //         '$search': {
    //             'index': 'usersindex',
    //             'text': {
    //                 'query': key,
    //                 "fuzzy": {},
    //                 'path': {
    //                     'wildcard': '*'
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         '$project': {
    //             'dob': 0,
    //             'email': 0,
    //             'userid': 0,
    //             'phone': 0
    //         }
    //     },
    //     {
    //         '$limit': 10
    //     }
    // ])

    let user_result = await UserModel.aggregate([
        {
            '$search': {
                'index': 'usersindex',
                'text': {
                    'query': key,
                    "fuzzy": {},
                    'path': {
                        'wildcard': '*'
                    }
                }
            }
        },
        {
            '$project': {
                'dob': 0,
                'email': 0,
                'phone': 0,
                '__v': 0,
            }
        },
        {
            '$limit': 10
        },
        {
            '$lookup': {
                from: 'user_tree_regs',
                localField: '_id',
                foreignField: 'user',
                as: 'user_trees',
            },
        },
    ]);

    count += user_result.length;

    res.status(status.success).json({
        treetype: result,
        users: user_result,
        total_results: count,
    })
}