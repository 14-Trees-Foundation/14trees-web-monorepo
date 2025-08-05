import { Request, Response } from "express";
import { status } from "../helpers/status";
import CorpEventRepository from "../repo/corp_event_Repo";
import EventRepository from "../repo/eventsRepo";
import EventImageRepository from "../repo/eventImagesRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { FilterItem } from "../models/pagination";
import { getWhereOptions } from "./helper/filters";

import { EventCreationAttributes } from "../models/events";

// export const getOverallOrgDashboard = async (req: Request, res: Response) => {
//   try {
//     if (!req.query.fromdate) {
//       throw new Error("Invalid from date!");
//     }
//     if (!req.query.todate) {
//       throw new Error("Invalid to date!");
//     }
//     if (!req.query.org) {
//       throw new Error("Invalid org!");
//     }
//   } catch (error: any) {
//     res.status(status.bad).send({ error: error.message });
//     return;
//   }

//   try {
//     let org = await orgModel.findOne(
//       { _id: new mongoose.Types.ObjectId(`${req.query.org}`) },
//       { name: 1, _id: 0 }
//     );
//     let result = await UserTreeModel.aggregate([
//       {
//         $match: {
//           orgid: new mongoose.Types.ObjectId(`${req.query.org}`),
//           date_added: {
//             $gte: new Date(req.query.fromdate.toString()),
//             $lte: new Date(req.query.todate.toString()),
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       {
//         $lookup: {
//           from: "trees",
//           localField: "tree",
//           foreignField: "_id",
//           as: "tree",
//         },
//       },
//       { $unwind: "$tree" },
//       {
//         $project: {
//           sapling_id: "$tree.sapling_id",
//           name: "$user.name",
//           profile_image: 1,
//           tree_image: "$tree.image",
//           _id: 0,
//         },
//       },
//     ]);
//     res.status(status.success).send({
//       result: result,
//       org: org?.name,
//     });
//   } catch (error: any) {
//     res.status(status.error).send();
//   }
// };

// export const getOverallPlotDashboard = async (req: Request, res: Response) => {
//   try {
//     if (!req.query.fromdate) {
//       throw new Error("Invalid from date!");
//     }
//     if (!req.query.todate) {
//       throw new Error("Invalid to date!");
//     }
//     if (!req.query.plot) {
//       throw new Error("Invalid plot!");
//     }
//   } catch (error: any) {
//     res.status(status.bad).send({ error: error.message });
//     return;
//   }

//   try {
//     let plot = await PlotModel.findOne({
//       _id: new mongoose.Types.ObjectId(`${req.query.plot}`),
//     });

//     let pipeline = [];
//     pipeline.push(
//       {
//         $lookup: {
//           from: "trees",
//           localField: "tree",
//           foreignField: "_id",
//           as: "trees",
//         },
//       },
//       { $unwind: "$trees" }
//     );
//     if (req.query.link) {
//       pipeline.push({
//         $match: {
//           "trees.plot_id": new mongoose.Types.ObjectId(`${plot?._id}`),
//           "trees.link": req.query.link,
//           date_added: {
//             $gte: new Date(req.query.fromdate.toString()),
//             $lte: new Date(req.query.todate.toString()),
//           },
//         },
//       });
//     } else {
//       pipeline.push({
//         $match: {
//           "trees.plot_id": new mongoose.Types.ObjectId(`${plot?._id}`),
//           date_added: {
//             $gte: new Date(req.query.fromdate.toString()),
//             $lte: new Date(req.query.todate.toString()),
//           },
//         },
//       });
//     }

//     pipeline.push(
//       {
//         $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       {
//         $project: {
//           sapling_id: "$trees.sapling_id",
//           name: "$user.name",
//           profile_image: 1,
//           tree_image: "$trees.image",
//           desc: "$trees.desc",
//           _id: 0,
//         },
//       }
//     );
//     let result = await UserTreeModel.aggregate(pipeline);

//     res.status(status.success).send({
//       result: result,
//       plotname: plot?.name,
//     });
//   } catch (error: any) {
//     res.status(status.error).send();
//   }
// };

// export const getBirthdayEvent = async (req: Request, res: Response) => {
//   const id = req.query.id;
//   try {
//     let result = await EventModel.findOne({ link: id })
//       .populate({ path: "assigned_by", select: "name" })
//       .populate({ path: "assigned_to", select: "name" })
//       .populate({
//         path: "user_trees",
//         populate: {
//           path: "tree",
//           populate: {
//             path: "tree_id plot_id",
//           },
//         },
//         select: "profile_image memories",
//       });
//     if (result === null) {
//       res.status(status.notfound).send();
//     }
//     res.status(status.success).send({
//       data: result,
//     });
//   } catch (error: any) {
//     res.status(status.notfound).send();
//   }
// };

/*
    Model - Event
    CRUD Operations for events collection
*/

// export const addEvents = async (req: Request, res: Response) => {
//     const fields = req.body;
//     const saplingids = fields.sapling_id.split(/[ ,]+/);
//     let mimageurl: string | undefined;
//     let userimages: string[];
//     let donor: string | undefined;

//     try {
//       if (fields.type === "1" || fields.type === "2" || fields.type === "3") {
//         const user_tree_reg_ids: mongoose.Types.ObjectId[] = [];

//         // Add user to the database if not exists
//         const userDoc = await userHelper.getUserDocumentFromRequestBody(req);
//         let user = await UserModel.findOne({ userid: userDoc.userid });
//         if (!user) {
//           user = await userDoc.save();
//         }

//         // Memory image urls
//         if (
//           req.body.albumimages !== undefined &&
//           req.body.albumimages.length > 0
//         ) {
//           mimageurl = req.body.albumimages.split(",");
//         }

//         // User Profile images
//         let userImageUrls: string[] = [];
//         if (
//           req.body.userimages !== undefined &&
//           req.body.userimages.length > 0
//         ) {
//           userimages = req.body.userimages.split(",");
//           for (const image of userimages) {
//             const location = await uploadHelper.UploadFileToS3(image, "users");
//             if (location !== "") {
//               userImageUrls.push(location);
//             }
//           }
//         }

//         if (req.body.donor) {
//           const dUser = await UserModel.findOne({ _id: req.body.donor });
//           donor = dUser?.name;
//         }

//         for (const saplingid of saplingids) {
//           const tree = await TreeModel.findOne({ sapling_id: saplingid });
//           if (!tree) continue;
//           const user_tree_data = new UserTreeModel({
//             tree: tree._id,
//             user: user?._id,
//             profile_image: userImageUrls,
//             memories: mimageurl,
//             orgid: req.body.org
//               ? new mongoose.Types.ObjectId(req.body.org)
//               : new mongoose.Types.ObjectId("61726fe62793a0a9994b8bc2"),
//             donated_by: req.body.donor
//               ? new mongoose.Types.ObjectId(req.body.donor)
//               : null,
//             gifted_by: req.body.gifted_by ? req.body.gifted_by : null,
//             planted_by: req.body.planted_by ? req.body.planted_by : null,
//             date_added: new Date().toISOString(),
//           });

//           const user_tree_reg_res = await user_tree_data.save();
//           if (req.body.desc) {
//             await TreeModel.updateOne(
//               { sapling_id: saplingid },
//               { $set: { desc: req.body.desc } }
//             );
//           }
//           user_tree_reg_ids.push(user_tree_reg_res._id);
//         }
//         const link = Math.random().toString(26).slice(2, 10);
//         const event_model = new EventModel({
//           assigned_to: user?._id,
//           assigned_by: req.body.donor,
//           user_trees: user_tree_reg_ids,
//           plot_id: req.body.plot_id,
//           type: req.body.type,
//           link: link,
//           desc: req.body.desc ? req.body.desc : "",
//           date: new Date().toISOString(),
//         });
//         const result = await event_model.save();
//         res.status(status.created).send({
//           result: result,
//         });
//       }
//     } catch (error: any) {
//       console.log(error);
//       res.status(status.error).send();
//     }
//   };

export const addEvent = async (req: Request, res: Response) => {
  const fields = req.body;
  try {
    // Convert tags from string to array if it's a string
    let tags = fields.tags;
    if (tags && typeof tags === 'string') {
      tags = tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    }

    const data: EventCreationAttributes = {
      name: fields.name,
      type: fields.type,
      assigned_by: fields.assigned_by,
      site_id: fields.site_id,
      description: fields.description,
      tags: tags,
      event_date: fields.event_date ?? new Date(),
      event_location: fields.event_location ?? 'onsite',
      message: fields.message,
      link: fields.link,
    }
    const result = await EventRepository.addEvent(data);
    res.status(status.created).send(result);
  } catch (error: any) {
    console.error(JSON.stringify(error));
    res.status(status.error).send({ message: error.message });
  }
}

export const getEvents = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;

  try {
    let result = await EventRepository.getEvents(offset, limit, filters);
    res.status(status.success).send(result);
  } catch (error: any) {
    console.log("[ERROR]", "EventsController::getEvents", error)
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    await EventRepository.deleteEvent(req.params.id);
    res.status(status.success).json({
      message: "Event deleted successfully",
    });
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const eventData = {
      ...req.body,
      id: parseInt(req.params.id)
    };

    // Convert tags from string to array if it's a string
    if (eventData.tags && typeof eventData.tags === 'string') {
      eventData.tags = eventData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    }

    await EventRepository.updateEvent(eventData);
    res.status(status.success).json({
      message: "Event updated successfully"
    })

  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
  }
}

export const getEventMessages = async (req: Request, res: Response) => {
  const event_link: string = req.params.event_id;
  try {
    const eventResp = await EventRepository.getEvents(0, 1, [{ columnField: 'link', operatorValue: 'equals', value: event_link }]);
    if (eventResp.results.length == 1) {
      const event = eventResp.results[0];
      const messages = await EventRepository.getEventMessages(event.id);
      return res.status(status.success).send(messages);
    }

    return res.status(status.notfound).send({ message: "Event you are looking for doesn't exists." })
  } catch(error: any) {
    console.log("[ERROR]", "EventsController::getEventMessages", error);
    return res.status(status.error).send({ message: "Something went wrong. Please try again latter!" });
  }
}

export const addCorpEvent = async (req: Request, res: Response) => {
  const fields = req.body;

  if (!fields.event_name || !fields.event_link || !fields.long_desc) {
    res.status(status.bad).send({ error: "Required fields are missing" });
    return;
  }
  try {
    const result = CorpEventRepository.addCorpEvent(fields)
    res.status(status.created).send(result);
  } catch (error: any) {
    console.log(error);
    res.status(status.error).send();
  }
};

export const getCorpEvent = async (req: Request, res: Response) => {
  if (!req.query.event_id) {
    res.status(status.bad).send({ error: "Event ID required" });
    return;
  }

  try {
    let corpEvent = await CorpEventRepository.getCorpEvent(req.query.event_id.toString())
    res.status(status.success).json(corpEvent);
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

export const updateCorpEvent = async (req: Request, res: Response) => {
  try {
    const updatedEvent = await CorpEventRepository.updateCorpEvent(req.params.id, req.body);
    res.status(status.success).send(updatedEvent);
  } catch (error: any) {
    console.error("Corp event update error:", error);
    res.status(status.error).send({ error: error.message });
  }
};

export const deleteCorpEvent = async (req: Request, res: Response) => {
  try {
    await CorpEventRepository.deleteCorpEvent(req.params.id);
    res.status(status.success).json({
      message: "Corp event deleted successfully",
    });
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
  }
};

// ===== NEW EVENT ASSOCIATION CONTROLLERS =====

// Tree Association Controllers
export const getEventTrees = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(status.bad).send({ error: "Invalid event ID" });
    }

    const trees = await EventRepository.getEventTrees(eventId);
    res.status(status.success).send(trees);
  } catch (error: any) {
    console.error("[ERROR] EventsController::getEventTrees", error);
    res.status(status.error).send({ error: error.message });
  }
};

export const associateTreesToEvent = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { treeIds } = req.body;

    if (isNaN(eventId)) {
      return res.status(status.bad).send({ error: "Invalid event ID" });
    }

    if (!Array.isArray(treeIds) || treeIds.length === 0) {
      return res.status(status.bad).send({ error: "Tree IDs array is required" });
    }

    await EventRepository.associateTreesToEvent(eventId, treeIds);
    res.status(status.success).send({ message: "Trees associated successfully" });
  } catch (error: any) {
    console.error("[ERROR] EventsController::associateTreesToEvent", error);
    res.status(status.error).send({ error: error.message });
  }
};

export const dissociateTreesFromEvent = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { treeIds } = req.body;

    if (isNaN(eventId)) {
      return res.status(status.bad).send({ error: "Invalid event ID" });
    }

    if (!Array.isArray(treeIds) || treeIds.length === 0) {
      return res.status(status.bad).send({ error: "Tree IDs array is required" });
    }

    await EventRepository.dissociateTreesFromEvent(eventId, treeIds);
    res.status(status.success).send({ message: "Trees dissociated successfully" });
  } catch (error: any) {
    console.error("[ERROR] EventsController::dissociateTreesFromEvent", error);
    res.status(status.error).send({ error: error.message });
  }
};

// Image Association Controllers
export const getEventImages = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(status.bad).send({ error: "Invalid event ID" });
    }

    const images = await EventImageRepository.getEventImages(eventId);
    res.status(status.success).send(images);
  } catch (error: any) {
    console.error("[ERROR] EventsController::getEventImages", error);
    res.status(status.error).send({ error: error.message });
  }
};

export const uploadEventImages = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(status.bad).send({ error: "Invalid event ID" });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(status.bad).send({ error: "No images uploaded" });
    }

    // Extract image URLs from uploaded files
    // Note: This assumes multer is configured to provide file paths/URLs
    const imageUrls = files.map(file => file.path || file.filename);

    const createdImages = await EventImageRepository.addEventImages(eventId, imageUrls);
    res.status(status.created).send(createdImages);
  } catch (error: any) {
    console.error("[ERROR] EventsController::uploadEventImages", error);
    res.status(status.error).send({ error: error.message });
  }
};

export const removeEventImages = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { imageIds } = req.body;

    if (isNaN(eventId)) {
      return res.status(status.bad).send({ error: "Invalid event ID" });
    }

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(status.bad).send({ error: "Image IDs array is required" });
    }

    await EventImageRepository.removeEventImages(eventId, imageIds);
    res.status(status.success).send({ message: "Images removed successfully" });
  } catch (error: any) {
    console.error("[ERROR] EventsController::removeEventImages", error);
    res.status(status.error).send({ error: error.message });
  }
};

export const reorderEventImages = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { imageSequences } = req.body;

    if (isNaN(eventId)) {
      return res.status(status.bad).send({ error: "Invalid event ID" });
    }

    if (!Array.isArray(imageSequences) || imageSequences.length === 0) {
      return res.status(status.bad).send({ error: "Image sequences array is required" });
    }

    await EventImageRepository.reorderEventImages(eventId, imageSequences);
    res.status(status.success).send({ message: "Images reordered successfully" });
  } catch (error: any) {
    console.error("[ERROR] EventsController::reorderEventImages", error);
    res.status(status.error).send({ error: error.message });
  }
};

// Enhanced Message Controllers
export const createEventMessage = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { message, userId } = req.body;

    if (isNaN(eventId)) {
      return res.status(status.bad).send({ error: "Invalid event ID" });
    }

    if (!message || !userId) {
      return res.status(status.bad).send({ error: "Message and user ID are required" });
    }

    const createdMessage = await EventRepository.createEventMessage(eventId, message, userId);
    res.status(status.created).send(createdMessage);
  } catch (error: any) {
    console.error("[ERROR] EventsController::createEventMessage", error);
    res.status(status.error).send({ error: error.message });
  }
};

export const updateEventMessage = async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const { message } = req.body;

    if (isNaN(messageId)) {
      return res.status(status.bad).send({ error: "Invalid message ID" });
    }

    if (!message) {
      return res.status(status.bad).send({ error: "Message is required" });
    }

    const updatedMessage = await EventRepository.updateEventMessage(messageId, message);
    res.status(status.success).send(updatedMessage);
  } catch (error: any) {
    console.error("[ERROR] EventsController::updateEventMessage", error);
    res.status(status.error).send({ error: error.message });
  }
};

export const deleteEventMessage = async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);

    if (isNaN(messageId)) {
      return res.status(status.bad).send({ error: "Invalid message ID" });
    }

    await EventRepository.deleteEventMessage(messageId);
    res.status(status.success).send({ message: "Event message deleted successfully" });
  } catch (error: any) {
    console.error("[ERROR] EventsController::deleteEventMessage", error);
    res.status(status.error).send({ error: error.message });
  }
};

export const reorderEventMessages = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { messageSequences } = req.body;

    if (isNaN(eventId)) {
      return res.status(status.bad).send({ error: "Invalid event ID" });
    }

    if (!Array.isArray(messageSequences) || messageSequences.length === 0) {
      return res.status(status.bad).send({ error: "Message sequences array is required" });
    }

    await EventRepository.reorderEventMessages(eventId, messageSequences);
    res.status(status.success).send({ message: "Messages reordered successfully" });
  } catch (error: any) {
    console.error("[ERROR] EventsController::reorderEventMessages", error);
    res.status(status.error).send({ error: error.message });
  }
};