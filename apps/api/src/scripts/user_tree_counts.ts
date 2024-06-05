import { MongoClient } from "mongodb";
import TreeModel from "../models/tree";
import UserTreeCountModel from "../models/user_tree_count"
import { getMongoDBConnectionString } from "../services/mongo";
import mongoose from "mongoose";
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

const CreateUserTreeCountCollection = async () => {

    try {
        await UserTreeCountModel.deleteMany();
    } catch(error) {
        console.log("error deleting data.", error);
        return;
    }

    let data;
    try {
        data = await TreeModel.aggregate([
            {
              $group: {
                _id: {
                  user: "$mapped_to",
                  plot: "$plot_id",
                },
                count: { $sum: 1 },
                tree_id: { $push: "$_id" },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "_id.user",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      email: 1,
                      _id: 0,
                    },
                  },
                ],
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $lookup: {
                from: "plots",
                localField: "_id.plot",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      plot_id: 1,
                      _id: 0,
                    },
                  },
                ],
                as: "plot",
              },
            },
            {
              $lookup: {
                from: "user_tree_regs",
                let: { id: "$tree_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $in: ["$tree", "$$id"] },
                    },
                  },
                  { $count: "count" },
                ],
                as: "matched",
              },
            },
            { $unwind: { path: "$matched", preserveNullAndEmptyArrays: true } },
            { $unwind: "$plot" },
            { $project: { _id: 0 } },
            // { $limit: 1 }
          ])
    } catch (error) {
        console.log("error fetching aggregated data.", error);
        return;
    }

    try {
        const newData = data.map( (item) => { if (item?.mapped_to === "") item.mapped_to = undefined;  return new UserTreeCountModel(item)} )
        await UserTreeCountModel.bulkSave(newData);
    } catch(error) {
        console.log("error saving data into new collection", error);
        return;
    }
}

const transferData = async () => {
    connectDB();
    try {
        await CreateUserTreeCountCollection();
    } catch (error) {
        console.log(error);
    } finally {
        mongoose.disconnect();
    }
}

transferData();