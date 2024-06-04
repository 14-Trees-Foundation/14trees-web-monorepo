import { Request, Response } from 'express';
import { status } from '../helpers/status'; 
import TreeRepository from '../repo/treeRepo';
import PlantTypeRepository from '../repo/plantTypeRepo';
import { UserRepository } from '../repo/userRepo';
import { PlotRepository } from '../repo/plotRepo';
import { PondRepository } from '../repo/pondsRepo';
import { UserTreeRepository } from '../repo/userTreeRepo';
import { OnsiteStaffRepository } from '../repo/onSiteStaffRepo';

export const summary = async (req: Request, res: Response) => {
  try {
    const treeCount = await TreeRepository.treeCount();
    const plantTypeCount = await PlantTypeRepository.plantTypeCount();
    const userCount = await UserRepository.userCount();
    // const assignedTreeCount = await UserTreeRepository.userTreeCount();
    const plotCount = await PlotRepository.plotCount();
    const pondCount = await PondRepository.pondCount();

    res.status(status.success).send({
      treeCount,
      plantTypeCount,
      userCount,
      assignedTreeCount: 1000,
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
    const count = await TreeRepository.treeCount();
    res.status(status.success).send({
      count,
    });
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const getTotalPlantType = async (req: Request, res: Response) => {
  try {
    const count = await PlantTypeRepository.plantTypeCount();
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
    const count = await UserRepository.userCount();
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
    const count = await PlotRepository.plotCount();
    res.status(status.success).send({
      count,
    });
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const getTotalPonds = async (req: Request, res: Response) => {
    try {
        const count = await PondRepository.pondCount();
        res.status(status.success).send({
          count,
        });
    } catch (error) {
        res.status(status.error).send({
          error: error,
        });
    }
};

export const getTotalEmployees = async (req: Request, res: Response) => {
    try {
        const count = await OnsiteStaffRepository.staffCount();
        res.status(status.success).send({
          count,
        });
    } catch (error) {
        res.status(status.error).send({
          error: error,
        });
    }
};
