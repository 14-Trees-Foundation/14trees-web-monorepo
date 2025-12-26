import { Request, Response } from "express";
import { status } from "../helpers/status";
import CorpEventRepository from "../repo/corp_event_Repo";
import EventRepository from "../repo/eventsRepo";
import EventImageRepository from "../repo/eventImagesRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { FilterItem } from "../models/pagination";
import { getWhereOptions } from "./helper/filters";
import { UploadFileToS3 } from "./helper/uploadtos3";
import { EventCreationAttributes, LocationCoordinate } from "../models/events";

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
  
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  try {
    // event_location stays as simple string: 'onsite' or 'offsite' (no parsing needed)
    let eventLocation: any = fields.event_location || 'onsite';
    
    // Parse tags if it's a string
    let tags: string[] | undefined = undefined;
    if (fields.tags) {
      tags = typeof fields.tags === 'string' ? JSON.parse(fields.tags) : fields.tags;
    }

    // Parse optional detailed `location` field (single point)
    // Accept either a parsed object or a JSON string in multipart/form-data
    let location: LocationCoordinate | undefined = undefined;
    if (fields.location) {
      let locCandidate: any = fields.location;
      if (typeof fields.location === 'string') {
        if (fields.location === '[object Object]') {
          return res.status(status.bad).send({ error: 'Invalid location: send JSON string or object with lat and lng numbers' });
        }
        try {
          locCandidate = JSON.parse(fields.location);
        } catch (e) {
          return res.status(status.bad).send({ error: 'Invalid location JSON' });
        }
      }
      // Validate shape
      if (locCandidate && (typeof locCandidate.lat === 'number') && (typeof locCandidate.lng === 'number')) {
        location = { lat: locCandidate.lat, lng: locCandidate.lng, address: locCandidate.address };
      } else {
        return res.status(status.bad).send({ error: 'Invalid location: lat and lng required as numbers' });
      }
    }

    const data: EventCreationAttributes = {
      name: fields.name,
      type: parseInt(fields.type), // Ensure type is number
      assigned_by: parseInt(fields.assigned_by), // Ensure assigned_by is number
      site_id: fields.site_id ? parseInt(fields.site_id) : null, // Handle site_id conversion
      description: fields.description,
      message: fields.message,
      tags: tags,
      event_date: fields.event_date ?? new Date(),
      event_location: eventLocation,
      theme_color: fields.theme_color,  // NEW: yellow/red/green/blue/pink
      location: location,
      // Generate a stable random link on create; if client provided a link, keep it
      link: fields.link ? String(fields.link) : Math.random().toString(36).slice(2, 10),
      default_tree_view_mode: fields.default_tree_view_mode || 'profile', // Default to profile images
    }

    // Handle event poster upload to S3 (wrap to avoid upload errors bubbling up)
    if (files && files['event_poster'] && files['event_poster'].length > 0) {
      const posterFile = files['event_poster'][0];
      if (posterFile && posterFile.originalname) {
        try {
          const s3Url = await UploadFileToS3(posterFile.originalname, 'events', 'posters');
          if (s3Url) {
            data.event_poster = s3Url;
          } else {
            console.warn('[WARN] EventsController::addEvent poster upload returned empty URL');
          }
        } catch (uErr) {
          console.error('[WARN] EventsController::addEvent poster upload failed', uErr);
          // Do not fail the entire request because poster upload failed
        }
      }
    }

    // Handle landing image upload to S3 (optional)
    if (files && files['landing_image'] && files['landing_image'].length > 0) {
      const landingFile = files['landing_image'][0];
      if (landingFile && landingFile.originalname) {
        try {
          const s3Url = await UploadFileToS3(landingFile.originalname, 'events', 'landing_images');
          if (s3Url) {
            data.landing_image_s3_path = s3Url;
          } else {
            console.warn('[WARN] EventsController::addEvent landing image upload returned empty URL');
          }
        } catch (uErr) {
          console.error('[WARN] EventsController::addEvent landing image upload failed', uErr);
          // Do not fail the entire request because landing image upload failed
        }
      }
    }

    // Handle mobile landing image upload to S3 (optional)
    if (files && files['landing_image_mobile'] && files['landing_image_mobile'].length > 0) {
      const landingMobileFile = files['landing_image_mobile'][0];
      if (landingMobileFile && landingMobileFile.originalname) {
        try {
          const s3Url = await UploadFileToS3(landingMobileFile.originalname, 'events', 'landing_images');
          if (s3Url) {
            data.landing_image_mobile_s3_path = s3Url;
          } else {
            console.warn('[WARN] EventsController::addEvent landing mobile image upload returned empty URL');
          }
        } catch (uErr) {
          console.error('[WARN] EventsController::addEvent landing mobile image upload failed', uErr);
          // Do not fail the entire request because mobile landing image upload failed
        }
      }
    }

    // Handle multiple images upload to S3 (if needed)
    if (files && files['images'] && files['images'].length > 0) {
      const imageUrls: string[] = [];
      for (const imageFile of files['images']) {
        try {
          const s3Url = await UploadFileToS3(imageFile.originalname, 'events', 'images');
          if (s3Url) {
            imageUrls.push(s3Url);
          }
        } catch (iErr) {
          console.error('[WARN] EventsController::addEvent image upload failed', iErr);
        }
      }
      if (imageUrls.length > 0) {
        data.images = imageUrls;
      }
    }

    const result = await EventRepository.addEvent(data);
    res.status(status.created).send(result);
  } catch (error: any) {
    console.error("[ERROR] EventsController::addEvent", JSON.stringify(error));
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
  const fields = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  try {
    // event_location stays as string ('onsite'/'offsite') - no parsing
    
    // Parse optional detailed `location` field for updates
    if (fields.location && typeof fields.location === 'string') {
      if (fields.location === '[object Object]') {
        return res.status(status.bad).send({ error: 'Invalid location: send JSON string or object with lat and lng numbers' });
      }
      try {
        fields.location = JSON.parse(fields.location);
      } catch (e) {
        return res.status(status.bad).send({ error: 'Invalid location JSON' });
      }
    }

    // If provided, validate location shape
    if (fields.location) {
      const loc = fields.location as any;
      if (!(typeof loc.lat === 'number' && typeof loc.lng === 'number')) {
        return res.status(status.bad).send({ error: 'Invalid location: lat and lng required as numbers' });
      }
    }

    // Parse tags if it's a string
    if (fields.tags && typeof fields.tags === 'string') {
      try {
        fields.tags = JSON.parse(fields.tags);
      } catch (e) {
        // Keep as is if parse fails
      }
    }

    // Ensure tags is an array when provided; if it's an empty object, treat as not provided (do not clear existing tags)
    if (fields.tags !== undefined) {
      if (typeof fields.tags === 'object' && !Array.isArray(fields.tags)) {
        // If empty object, remove the key so we don't overwrite existing data
        if (Object.keys(fields.tags).length === 0) {
          delete fields.tags;
        } else {
          fields.tags = Object.values(fields.tags);
        }
      }
      if (fields.tags !== undefined && !Array.isArray(fields.tags)) {
        return res.status(status.bad).send({ error: 'Invalid tags: must be an array' });
      }
    }

    // Handle new event poster upload
    if (files && files['event_poster'] && files['event_poster'].length > 0) {
      const posterFile = files['event_poster'][0];
      try {
        const s3Url = await UploadFileToS3(posterFile.originalname, 'events', 'posters');
        if (s3Url) {
          fields.event_poster = s3Url;
        }
        // Note: Consider deleting old poster from S3 if needed
      } catch (uErr) {
        console.error('[WARN] EventsController::updateEvent poster upload failed', uErr);
      }
    }

    // Handle new landing image upload
    if (files && files['landing_image'] && files['landing_image'].length > 0) {
      const landingFile = files['landing_image'][0];
      try {
        const s3Url = await UploadFileToS3(landingFile.originalname, 'events', 'landing_images');
        if (s3Url) {
          fields.landing_image_s3_path = s3Url;
        }
        // Note: consider deleting old landing image from S3 if required
      } catch (uErr) {
        console.error('[WARN] EventsController::updateEvent landing image upload failed', uErr);
      }
    }

    // Handle new mobile landing image upload
    if (files && files['landing_image_mobile'] && files['landing_image_mobile'].length > 0) {
      const landingMobileFile = files['landing_image_mobile'][0];
      try {
        const s3Url = await UploadFileToS3(landingMobileFile.originalname, 'events', 'landing_images');
        if (s3Url) {
          fields.landing_image_mobile_s3_path = s3Url;
        }
        // Note: consider deleting old mobile landing image from S3 if required
      } catch (uErr) {
        console.error('[WARN] EventsController::updateEvent landing mobile image upload failed', uErr);
      }
    }

    // Handle new images upload
    if (files && files['images'] && files['images'].length > 0) {
      const imageUrls: string[] = [];
      for (const imageFile of files['images']) {
        try {
          const s3Url = await UploadFileToS3(imageFile.originalname, 'events', 'images');
          if (s3Url) {
            imageUrls.push(s3Url);
          }
        } catch (iErr) {
          console.error('[WARN] EventsController::updateEvent image upload failed', iErr);
        }
      }
      if (imageUrls.length > 0) {
        // Append to existing images or replace based on your requirement
        fields.images = imageUrls;
      }
    }

    // Ensure we set the id from route params so repository can find the record
    const idNum = Number(req.params.id);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(status.bad).send({ error: 'Invalid event id' });
    }
    // Build update payload: only include keys explicitly provided (avoid overwriting existing values with undefined/empty values)
    const allowedKeys = [
      'name','type','assigned_by','site_id','description','tags','event_date','event_location',
      'theme_color','location','event_poster','images','memories','message','link', 'default_tree_view_mode',
      'show_blessings'
    ];
    // Allow updating landing_image_s3_path via upload or direct value
    allowedKeys.push('landing_image_s3_path');
    // Allow updating mobile landing image path
    allowedKeys.push('landing_image_mobile_s3_path');
    const updatePayload: any = { id: idNum };
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        const val = (fields as any)[key];
        // Skip empty or null values to avoid accidental deletion
        if (val === "" || val === null || val === undefined) continue;
        if (Array.isArray(val) && val.length === 0) continue; // skip empty arrays
        if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) continue; // skip empty objects
        updatePayload[key] = val;
      }
    }

    console.log('[DEBUG] updateEvent - updatePayload:', updatePayload);

    await EventRepository.updateEvent(updatePayload);
    res.status(status.success).json({
      message: "Event updated successfully"
    });

  } catch (error: any) {
    console.error("[ERROR] EventsController::updateEvent", JSON.stringify(error));
    res.status(status.error).send({ message: error.message });
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


    // Handle multiple memory images upload to S3
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const imageFile of files) {
        try {
          const s3Url = await UploadFileToS3(imageFile.originalname, 'events', 'images');
          if (s3Url) {
            imageUrls.push(s3Url);
          }
        } catch (iErr) {
          console.error('[WARN] EventsController::uploadEventImages image upload failed', iErr);
        }
      }
    }

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
    const { message, userId, user_name } = req.body;

    if (isNaN(eventId)) {
      return res.status(status.bad).send({ error: "Invalid event ID" });
    }

    if (!message || (!userId && !user_name)) {
      return res.status(status.bad).send({ error: "Message and user ID|user name are required" });
    }

    const createdMessage = await EventRepository.createEventMessage(eventId, message, userId, user_name);
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

// Track Event View (for analytics)
export const trackEventView = async (req: Request, res: Response) => {
  try {
    const eventLink = req.params.linkId;

    // Get visitor_id from custom header
    const visitorId = req.headers['x-visitor-id'] as string;

    if (!visitorId) {
      return res.status(status.bad).send({ error: "visitor_id header required" });
    }

    // Get event by link
    const eventResp = await EventRepository.getEvents(0, 1, [
      { columnField: 'link', operatorValue: 'equals', value: eventLink }
    ]);

    if (eventResp.results.length === 0) {
      return res.status(status.notfound).send({ error: "Event not found" });
    }

    const event = eventResp.results[0];

    // Get metadata for analytics
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
                      || req.socket.remoteAddress
                      || 'unknown';

    // Track the view with visitor_id
    await EventRepository.trackEventView(event.id, visitorId, ipAddress, userAgent);

    res.status(status.success).send({
      message: "View tracked successfully",
      total_views: event.total_views || 0,
      unique_views: event.unique_views || 0
    });
  } catch (error: any) {
    console.error("[ERROR] EventsController::trackEventView", error);
    // Don't fail the request if tracking fails - just log it
    res.status(status.success).send({ message: "View tracking skipped" });
  }
};