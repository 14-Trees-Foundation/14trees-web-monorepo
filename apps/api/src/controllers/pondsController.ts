
// const uploadHelper = require("./helper/uploadtos3");

import { status } from "../helpers/status";
import { UploadFileToS3 } from "./helper/uploadtos3"; // Assuming UploadFileToS3 is a function
import OnSiteStaff  from "../models/onsitestaff";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { PondRepository } from "../repo/pondsRepo";
import { isArray } from "lodash";

/*
    Model - Pond
    CRUD Operations for ponds collection
*/

export const addPond = async (req: Request, res: Response) => {
  try {
    if (req.body.name) req.body.pond_name = req.body.name;
    if (req.body.lengthFt) req.body.length = req.body.lengthFt;
    if (req.body.widthFt) req.body.width = req.body.widthFt;
    if (req.body.depthFt) req.body.depth = req.body.depthFt;
    if (!req.body.pond_name) {
      throw new Error("Pond name is required");
    } else if (!req.body.length && isNaN(parseFloat(req.body.length))) {
      throw new Error("Pond height is required");
    } else if (!req.body.width && isNaN(parseFloat(req.body.width))) {
      throw new Error("Pond width is required");
    } else if (!req.body.depth && isNaN(parseFloat(req.body.depth))) {
      throw new Error("Pond depth is required");
    } else if (!req.body.type) {
      throw new Error(
        "Pond type is required - (Storage/Percolation/Water hole)"
      );
    }
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
  
  try {
    const pond = PondRepository.addPond(req.body, isArray(req.files) ? req.files: [])
    res.status(status.created).json(pond);
  } catch (error) {
    res.status(status.error).json({ error });
  }
};

// export const updatePond = async (req: any,res: any) => {
  
//   if (!req.params.id || req.params.id === "") {
//     res.status(status.bad).send({error: "pond id is required to update the pond"});
//     return;
//   }

//   try {
//     let pond = await Pond.findById(req.params.id);
//     if(!pond) {
//       res.status(status.error).send({error: "pond not found for given id."});
//       return;
//     }

//     pond.name = req.body.name;
//     pond.tags = req.body.tags;
//     pond.desc = req.body.desc;
//     pond.type = req.body.type;
//     pond.boundaries = req.body.boundaries;
//     pond.date_added = req.body.date_added;
//     pond.images = req.body.images;
//     pond.lengthFt = req.body.lengthFt;
//     pond.widthFt = req.body.widthFt;
//     pond.depthFt = req.body.depthFt;
//     pond.updates = req.body.updates;


//     let pondRes = await pond.save();
//     res.status(status.success).json(pondRes);
//   } catch (error) {
//     res.status(status.error).json({ error });
//   }
// };

export const getPonds = async (req: Request ,res: Response) => {
  const {offset, limit } = getOffsetAndLimitFromRequest(req);
  let filters: Record<string,any> = {}
    if (req.query?.name) {
        filters["name"] = req.query?.name;
    }
    if (req.query?.type) {
        filters["type"] = req.query?.type;
    }
    req.files
  try {
    const result = await PondRepository.getPonds(filters, offset, limit);
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

// export const addWaterLevelUpdate = async (req: any,res: any) => {
//   try {
//     if (!req.body.pond_name) {
//       throw new Error("Pond name is required");
//     } else if (!req.body.levelFt) {
//       throw new Error("Water level is required");
//     }
//   } catch (error: any) {
//     res.status(status.bad).send({ error: error.message });
//     return;
//   }

//   let user = null;
//   if (req.body.user_id) {
//     user = await OnSiteStaff.findOne({ user_id: req.body.user_id });
//   }

//   let pondImageUrl: string = "";
//   if (req.files && req.files.length !== 0) {
//     pondImageUrl = await UploadFileToS3(req.files[0].filename, "ponds", req.body.pond_name);
//   }

//   let obj = {
//     date: req.body.date === null ? new Date().toISOString() : req.body.date,
//     levelFt: req.body.levelFt,
//     user: user === null ? null : user,
//     images: pondImageUrl,
//   };
//   try {
//     let result = await Pond.updateOne(
//       { name: req.body.pond_name },
//       { $push: { updates: obj } }
//     );
//     res.status(status.success).send(result);
//   } catch (error) {
//     res.status(status.error).json({ error });
//   }
// };

export const deletePond = async (req: any,res: any) => {
  try {
      // let resp = await Pond.findByIdAndDelete(req.params.id).exec();
      let resp = await PondRepository.deletePond(req.params.id) ;
      console.log("Delete Ponds Response for id: %s", req.params.id, resp);

      res.status(status.success).json({
        message: "Pond deleted successfully",
      });
  } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
  }
};

export const getHistory = async (req: any,res: any) => {
  if (!req.query.pond_name) {
    res.status(status.bad).send({ error: "Pond name required!" });
    return;
  }
  try {
    let result = await PondRepository.getHistory(req.query.pond_name);
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const searchPonds = async (req: Request, res: Response) => {
  try {
    if (!req.params.search || req.params.search.length < 3) {
      res.status(status.bad).send({ error: "Please provide at least 3 char to search"});
      return;
    }
    let filters: Record<string,any> = {}
    filters["name"] = req.params.search;
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const ponds = await PondRepository.getPonds(filters, offset, limit);
    res.status(status.success).send(ponds);
    return;
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};