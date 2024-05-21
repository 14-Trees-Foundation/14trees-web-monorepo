/*
  Model - TreeType
  CRUD Operations for tree_types collection
*/

import { Request, Response } from "express";
import TreeTypeRepository from "../repo/treetypeRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { status } from "../helpers/status";
import { isArray } from "lodash";

export const getTreeTypes = async (req: Request, res: Response) => {
  const {offset, limit } = getOffsetAndLimitFromRequest(req);
  try {
    let result = await TreeTypeRepository.getTreeTypes(req.query, offset, limit);
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const addTreeType = async (req: Request, res: Response) => {
    try {
    if (!req.body.name) {
        throw new Error("Tree name is required");
    }
    if (!req.body.tree_id) {
        throw new Error("Tree ID required");
    }
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
        return;
    }

    // Save the info into the sheet
    try {
        const treeType = await TreeTypeRepository.addTreeType(req.body, isArray(req.files)? req.files: [])
        res.status(status.created).json(treeType);
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
};


export const updateTreeType = async (req: Request, res: Response) => {
    try {
        const treeType = await TreeTypeRepository.updateTreeType(req.body, isArray(req.files)? req.files: [])
        res.status(status.success).json(treeType);
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
};

export const deleteTreeType = async (req: Request, res: Response) => {
    try {
      const resp = TreeTypeRepository.deleteTreeType(req.params.id)
      console.log("Delete TreeTypes Response for id: %s", req.params.id, resp);

      res.status(status.success).json({
        message: "Tree Type deleted successfully",
      });
    } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
    }
  };
  
  export const searchTreeTypes = async (req: Request, res: Response) => {
    try {
      if (!req.params.search || req.params.search.length < 3) {
        res.status(status.bad).send({ error: "Please provide at least 3 char to search"});
        return;
      }
  
      const { offset, limit } = getOffsetAndLimitFromRequest(req);
      const query: Record<string, any> = {
        "name": req.params.search
      }
      const treeTypes = await TreeTypeRepository.getTreeTypes(query, offset, limit);
      res.status(status.success).send(treeTypes);
      return;
    } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
      return;
    }
  };
  