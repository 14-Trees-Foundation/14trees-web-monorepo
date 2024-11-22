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
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
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

export const getPlantTypesForPlot = async (req: Request, res: Response) => {
  try {
    const plotId = parseInt(req.params.plot_id)
    if (isNaN(plotId)) {
      res.status(status.bad).send({ error: "Please provide valid plot id!" });
      return;
    }

    const plantTypes = await PlantTypeRepository.plantTypesPresentInPlot(plotId);
    res.status(status.success).send(plantTypes);
    return;
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

export const getPlantTypeTags = async (req: Request, res: Response) => {
  try {
    const plantTypeTags = await PlantTypeRepository.getPlantTypeTags(0, 100);
    res.status(status.success).send(plantTypeTags);
  } catch (error: any) {
    console.log("[ERROR]", "PlantTypeController::getPlantTypeTags", error);
    res.status(status.error).send({ message: "Something went wrong. Please try again after some time" });
  }
}

const parseCountToInt = (data: any[]) => {
  return data.map(item => {
    return {
      ...item,
      total: parseInt(item.total),
      booked: parseInt(item.booked),
      assigned: parseInt(item.assigned),
      available: parseInt(item.available),
      card_available: parseInt(item.card_available),
      unbooked_assigned: parseInt(item.unbooked_assigned),
      void_available: parseInt(item.void_available),
      void_assigned: parseInt(item.void_assigned),
      void_booked: parseInt(item.void_booked),
      void_total: parseInt(item.void_total),
    }
  })
}

export const getTreeCountsForPlantTypes = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;
  const order_by: { column: string, order: "ASC" | "DESC" }[] = req.body?.order_by;

  try {
    let result = await PlantTypeRepository.getPlantTypeStates(offset, limit, filters, order_by);
    result.results = parseCountToInt(result.results);
    res.status(status.success).send(result);
  } catch (error: any) {
    console.log("[ERROR]", "PlantTypeController::getTreeCountsForPlantTypes", error);
    res.status(status.error).json({
      status: status.error,
      message: "Something went wrong. Please try again after some time",
    });
  }
}