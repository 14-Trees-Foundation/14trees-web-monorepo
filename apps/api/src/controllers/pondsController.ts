
// const uploadHelper = require("./helper/uploadtos3");

import { status } from "../helpers/status";
import { UploadFileToS3 } from "./helper/uploadtos3"; // Assuming UploadFileToS3 is a function
// import {OnsiteStaff}  from "../models/onsitestaff";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { PondRepository } from "../repo/pondsRepo";
import { isArray } from "lodash";
import { FilterItem } from "../models/pagination";
import { getQueryExpression } from "./helper/filters";

/*
    Model - Pond
    CRUD Operations for ponds collection
*/

export const addPond = async (req: Request, res: Response) => {
  try {
    if (!req.body.name) {
      throw new Error("Pond name is required");
    } else if (!req.body.length_ft && isNaN(parseFloat(req.body.length_ft))) {
      throw new Error("Pond height is required");
    } else if (!req.body.width_ft && isNaN(parseFloat(req.body.width_ft))) {
      throw new Error("Pond width is required");
    } else if (!req.body.depth_ft && isNaN(parseFloat(req.body.depth_ft))) {
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
    const pond = await PondRepository.addPond(req.body, isArray(req.files) ? req.files: [])
    res.status(status.created).json(pond);
  } catch (error) {
    res.status(status.error).json({ error });
  }
};

export const updatePond = async (req: Request, res: Response) => {
  
  if (!req.params.id || req.params.id === "") {
    res.status(status.bad).send({error: "pond id is required to update the pond"});
    return;
  }

  try {
    const pond = await PondRepository.updatePond(req.body, isArray(req.files) ? req.files: []);
    res.status(status.success).send(pond);
  } catch (error) {
    console.log(error);
    res.status(status.error).json({ error });
  }
};

export const getPonds = async (req: Request ,res: Response) => {
  const {offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;
  let whereClause = {};
  if (filters && filters.length > 0) {
      filters.forEach(filter => {
          whereClause = { ...whereClause, ...getQueryExpression(filter.columnField, filter.operatorValue, filter.value) }
      })
  }

  try {
    const result = await PondRepository.getPonds(offset, limit, whereClause);
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
      let resp = await PondRepository.deletePond(req.params.id) ;
      console.log("Delete Ponds Response for id: %s", req.params.id, resp);

      res.status(status.success).json({
        message: "Pond deleted successfully",
      });
  } catch (error: any) {
      res.status(status.error).send({ error: error.message });
  }
};

export const searchPonds = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  try {
    if (!req.params.search || req.params.search.length < 3) {
      res.status(status.bad).send({ error: "Please provide at least 3 char to search"});
      return;
    }

    let whereClause = getQueryExpression("name", "contains", req.params.search)
    const ponds = await PondRepository.getPonds(offset, limit, whereClause);
    res.status(status.success).send(ponds);
    return;
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
    return;
  }
};