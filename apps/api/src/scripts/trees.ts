import { MongoClient } from "mongodb";
import TreeModel from "../models/tree";
import { getMongoDBConnectionString } from "../services/mongo";
import mongoose from "mongoose";
import TreesCopyModel from "../models/trees_copy";
require("dotenv").config();

const connectDB = async () => {
    try {
      const mongo_connection_string = getMongoDBConnectionString();
      if (!mongo_connection_string) {
        throw new Error("MongoDB connection string is not provided");
      }
      const _client = new MongoClient(mongo_connection_string);
      await mongoose.connect(mongo_connection_string, { autoIndex: false });
    } catch (err: any) {
      console.error("Failed to connect to MongoDB - exiting", err.message);
      console.error(
        "Check if the MongoDB server is running and the connection string is correct."
      );
      process.exit(1);
    }
  };

const CreateTreesCopyCollection = async () => {

    try {
        await TreesCopyModel.deleteMany();
    } catch(error) {
        console.log("error deleting data.", error);
        return;
    }

    let data;
    try {
        data = await TreeModel.aggregate([
            {
              $lookup: {
                  from: "plots", 
                  localField: "plot_id",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $project: {
                        name: 1,
                      },
                    },
                  ],
                  as: "plot"
              }
            },
            {
              $lookup: {
                  from: "tree_types", 
                  localField: "tree_id",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $project: {
                        name: 1,
                      },
                    },
                  ],
                  as: "tree"
              }
            },
            {
                $lookup: {
                    from: "users", 
                    localField: "mapped_to",
                    foreignField: "_id",
                    pipeline: [
                      {
                        $project: {
                          name: 1,
                        },
                      },
                    ],
                    as: "user"
                }
            },
            {
                $lookup: {
                    from: "user_tree_regs", 
                    localField: "_id",
                    foreignField: "tree",
                    pipeline: [
                        {
                            $project: {
                                user: 1,
                            },
                        },
                    ],
                    as: "assigned_to"
                }
            },
            {
                $unwind: {
                    path: "$assigned_to",
                    preserveNullAndEmptyArrays: true
                },
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                },
            },
            {
              $unwind: {
                path: "$plot",
                preserveNullAndEmptyArrays: true
              },
            },
            {
              $unwind: {
                path: "$tree",
                preserveNullAndEmptyArrays: true
              },
            },
          ])
    } catch (error) {
        console.log("error fetching aggregated data.", error);
        return;
    }

    try {
        const newData = data.map( (item: any) => new TreesCopyModel(item) )
        await TreesCopyModel.bulkSave(newData);
    } catch(error) {
        console.log("error saving data into new collection", error);
        return;
    }
}

const transferData = async () => {
    connectDB();
    try {
        await CreateTreesCopyCollection();
    } catch (error) {
        console.log(error);
    } finally {
        mongoose.disconnect();
    }
}

transferData();