import { Request, Response } from 'express'; // Assuming you're using Express
import { status } from '../helpers/status'; // Assuming status is an object with status codes

const TreeModel = require("../models/tree");
const TreeTypeModel = require("../models/treetype");
const UserModel = require("../models/user");
const PlotModel = require("../models/plot");
const { PondModel, pondUpdate } = require("../models/pond");
const UserTreeModel = require("../models/userprofile");

interface SummaryResponse {
  treeCount: number;
  treeTypeCount: number;
  userCount: number;
  assignedTreeCount: number;
  plotCount: number;
  pondCount: number;
}

interface CountResponse {
  count: number;
}

export const summary = async (req: Request, res: Response) => {
  try {
    const treeCount = await TreeModel.estimatedDocumentCount({});
    const treeTypeCount = await TreeTypeModel.estimatedDocumentCount({});
    const userCount = await UserModel.distinct('user_id').count();
    const assignedTreeCount = await UserTreeModel.estimatedDocumentCount({});
    const plotCount = await PlotModel.estimatedDocumentCount({});
    const pondCount = await PondModel.estimatedDocumentCount({});

    res.status(status.success).send({
      treeCount,
      treeTypeCount,
      userCount,
      assignedTreeCount,
      plotCount,
      pondCount,
    });
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const getTotalTree = async (req: Request, res: Response) => {
  try {
    const count = await TreeModel.estimatedDocumentCount({});
    res.status(status.success).send({
      count,
    });
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const getTotalTreeType = async (req: Request, res: Response) => {
  try {
    const count = await TreeTypeModel.estimatedDocumentCount({});
    res.status(status.success).send({
      count,
    });
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const getUniqueUsers = async (req: Request, res: Response) => {
  try {
    const count = await UserModel.distinct('user_id').count();
    res.status(status.success).send({
      count,
    });
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const getTotalPlots = async (req: Request, res: Response) => {
  try {
    const count = await PlotModel.estimatedDocumentCount({});
    res.status(status.success).send({
      count,
    });
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const getTotalPonds = (req: Request, res: Response) => {
  res.status(status.success).send({
    count: 70,
  });
};

export const getTotalEmployees = (req: Request, res: Response) => {
  res.status(status.success).send({
    count: 100,
  });
};
