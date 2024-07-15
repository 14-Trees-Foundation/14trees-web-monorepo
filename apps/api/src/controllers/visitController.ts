import { status } from "../helpers/status";
import { FilterItem } from "../models/pagination";
import { getWhereOptions } from "./helper/filters";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { VisitRepository } from "../repo/visitsRepo";

/*
    Model - Visit
    CRUD Operations for visits collection
*/

export const getVisits = async (req: Request, res: Response) => {
  const {offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;
  let whereClause = {};
  
  if (filters && filters.length > 0) {
      filters.forEach(filter => {
          whereClause = { ...whereClause, ...getWhereOptions(filter.columnField, filter.operatorValue, filter.value) }
      })
  }

  try {
      let result = await VisitRepository.getVisits(offset, limit, whereClause);
      res.status(status.success).send(result);
  } catch (error: any) {
      res.status(status.error).json({
          status: status.error,
          message: error.message,
      });
  }
}

export const addVisit = async (req: Request, res: Response) => {
  const reqData = req.body

  
  try {
      let result = await VisitRepository.addVisit(reqData);
      res.status(status.success).send(result);
  } catch (error: any) {
      res.status(status.error).json({
          status: status.error,
          message: error.message,
      });
  }
}


export const updateVisit = async (req: Request, res: Response) => {
    


  try {
      let result = await VisitRepository.updateVisit(req.body)
      res.status(status.created).json(result);
  } catch (error) {
      console.log(error)
      res.status(status.error).json({ error: error });
  }
}

export const deleteVisit = async (req: Request, res: Response) => {
  try {
      let resp = await VisitRepository.deleteVisit(req.params.id);
      console.log("Delete Visit Response for id: %s", req.params.id, resp);
      res.status(status.success).json({
        message: "Visit deleted successfully",
      });
  } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
  }
}