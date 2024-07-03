/*
  Model - PlantType
  CRUD Operations for plant_types table
*/

import { Request, Response } from "express";
import PlantTypeRepository from "../repo/plantTypeRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { status } from "../helpers/status";
import { isArray } from "lodash";
import { FilterItem } from "../models/pagination";
import { getWhereOptions } from "./helper/filters";

export const getPlantTypes = async (req: Request, res: Response) => {
  const {offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;
  let whereClause = {};
  if (filters && filters.length > 0) {
      filters.forEach(filter => {
          whereClause = { ...whereClause, ...getWhereOptions(filter.columnField, filter.operatorValue, filter.value) }
      })
  }

  try {
    let result = await PlantTypeRepository.getPlantTypes(offset, limit, whereClause);
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const addPlantType = async (req: Request, res: Response) => {
  try {
    if (!req.body.name) {
      throw new Error("PlantName (name) is required");
    }
    if (!req.body.plant_type_id) {
      throw new Error("PlantTypeID (plant_type_id) is required");
    }
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  // Save the info into the sheet
  try {
    const plantType = await PlantTypeRepository.addPlantType(req.body, isArray(req.files) ? req.files : [])
    res.status(status.created).json(plantType);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};


export const updatePlantType = async (req: Request, res: Response) => {
  try {
    const plantType = await PlantTypeRepository.updatePlantType(req.body, isArray(req.files) ? req.files : [])
    res.status(status.success).json(plantType);
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
  }
};

export const deletePlantType = async (req: Request, res: Response) => {
  try {
    const resp = await PlantTypeRepository.deletePlantType(req.params.id)
    console.log("Delete PlantTypes Response for id: %s", req.params.id, resp);

    res.status(status.success).json({
      message: `Plant Type with id '${req.params.id}' deleted successfully`,
    });
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};

export const searchPlantTypes = async (req: Request, res: Response) => {
  try {
    if (!req.params.search || req.params.search.length < 3) {
      res.status(status.bad).send({ error: "Please provide at least 3 char to search" });
      return;
    }

    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    let whereClause = getWhereOptions("name", "contains", req.params.search);
    const plantTypes = await PlantTypeRepository.getPlantTypes(offset, limit, whereClause);
    res.status(status.success).send(plantTypes);
    return;
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};
