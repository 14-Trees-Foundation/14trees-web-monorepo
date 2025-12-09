import { Request, Response } from 'express';
import { status } from '../helpers/status'; 
import { Logger } from '../helpers/logger';
import TreeRepository from '../repo/treeRepo';
import PlantTypeRepository from '../repo/plantTypeRepo';
import { UserRepository } from '../repo/userRepo';
import { PlotRepository } from '../repo/plotRepo';
import { PondRepository } from '../repo/pondsRepo';
import { OnsiteStaffRepository } from '../repo/onSiteStaffRepo';
import { SiteRepository } from '../repo/sitesRepo';
import { GiftCardsRepository } from '../repo/giftCardsRepo';

export const summary = async (req: Request, res: Response) => {
  try {
    const treeCount = await TreeRepository.treesCount();
    const plantTypeCount = await PlantTypeRepository.plantTypesCount();
    const userCount = await UserRepository.usersCount();
    const treesCount = await TreeRepository.assignedAndBookedTreesCount();
    const plotCount = await PlotRepository.plotsCount();
    const pondCount = await PondRepository.pondsCount();
    const sitesResp = await SiteRepository.countAllSites();
    const sitesLandTypeResp = await SiteRepository.getLandTypeTreesCount();
    const giftCardCounts= await GiftCardsRepository.getGiftCardSummaryCounts();

    res.status(status.success).send({
      treeCount,
      plantTypeCount,
      userCount,
      assignedTreeCount: treesCount.assigned,
      bookedTreeCount: treesCount.booked,
      plotCount,
      pondCount,
      sitesCount: parseInt(sitesResp.sites),
      districtsCount: parseInt(sitesResp.districts),
      talukasCount: parseInt(sitesResp.talukas),
      villagesCount: parseInt(sitesResp.villages),
      landTypeCounts: sitesLandTypeResp,
      personalGiftRequestsCount: giftCardCounts.personal_gift_requests,
      corporateGiftRequestsCount: giftCardCounts.corporate_gift_requests,
      personalGiftedTreesCount: giftCardCounts.personal_gifted_trees,
      corporateGiftedTreesCount: giftCardCounts.corporate_gifted_trees,
      totalGiftRequests: giftCardCounts.total_gift_requests,
      totalGiftedTrees: giftCardCounts.total_gifted_trees
    });
  }
  /* c8 ignore next 4 */
  catch (error) {
    await Logger.logError('analyticsController', 'summary', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const getTotalTree = async (req: Request, res: Response) => {
  try {
    const count = await TreeRepository.treesCount();
    res.status(status.success).send({
      count,
    });
  }
  /* c8 ignore next 4 */
  catch (error) {
    await Logger.logError('analyticsController', 'getTotalTree', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const getTotalPlantType = async (req: Request, res: Response) => {
  try {
    const count = await PlantTypeRepository.plantTypesCount();
    res.status(status.success).send({
      count,
    });
  }
  /* c8 ignore next 4 */
  catch (error) {
    await Logger.logError('analyticsController', 'getTotalPlantType', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const getUniqueUsers = async (req: Request, res: Response) => {
  try {
    const count = await UserRepository.usersCount();
    res.status(status.success).send({
      count,
    });
  }
  /* c8 ignore next 4 */
  catch (error) {
    await Logger.logError('analyticsController', 'getUniqueUsers', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const getTotalPlots = async (req: Request, res: Response) => {
  try {
    const count = await PlotRepository.plotsCount();
    res.status(status.success).send({
      count,
    });
  }
  /* c8 ignore next 4 */
  catch (error) {
    await Logger.logError('analyticsController', 'getTotalPlots', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const getTotalPonds = async (req: Request, res: Response) => {
    try {
        const count = await PondRepository.pondsCount();
        res.status(status.success).send({
          count,
        });
    }
    /* c8 ignore next 4 */
    catch (error) {
        await Logger.logError('analyticsController', 'getTotalPonds', error, req);
        res.status(status.error).send({ error: error });
    }
};

export const getTotalEmployees = async (req: Request, res: Response) => {
    try {
        const count = await OnsiteStaffRepository.staffCount();
        res.status(status.success).send({
          count,
        });
    }
    /* c8 ignore next 4 */
    catch (error) {
        await Logger.logError('analyticsController', 'getTotalEmployees', error, req);
        res.status(status.error).send({ error: error });
    }
};
