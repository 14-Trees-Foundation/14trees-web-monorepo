import { Request, Response } from 'express';
import { status } from '../helpers/status'; 
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
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const getTotalTree = async (req: Request, res: Response) => {
  try {
    const count = await TreeRepository.treesCount();
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
    const count = await PlantTypeRepository.plantTypesCount();
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
    const count = await UserRepository.usersCount();
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
    const count = await PlotRepository.plotsCount();
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
        const count = await PondRepository.pondsCount();
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

export const getTimeRangeAnalytics = async (req: Request, res: Response) => {
  try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
          return res.status(status.error).send({
              error: "Start date and end date are required"
          });
      }

      // Fetch all analytics in parallel
      const [
          plantTypeAnalytics,
          treeAnalytics,
          siteAnalytics,
          plotAnalytics,
          giftRequestAnalytics
      ] = await Promise.all([
          PlantTypeRepository.getPlantTypeAnalytics(startDate.toString(), endDate.toString()),
          TreeRepository.getTreesAnalytics(startDate.toString(), endDate.toString()),
          SiteRepository.getSitesAnalytics(startDate.toString(), endDate.toString()),
          PlotRepository.getPlotAnalytics(startDate.toString(), endDate.toString()),
          GiftCardsRepository.getGiftRequestsAnalytics(startDate.toString(), endDate.toString())
      ]);

      res.status(status.success).send({
          plantTypes: {
              newCount: plantTypeAnalytics.newPlantTypesCount,
              topPlanted: plantTypeAnalytics.topPlantedTrees
          },
          trees: {
              newCount: treeAnalytics.newTreesCount,
              assignedCount: treeAnalytics.assignedTreesCount
          },
          sites: {
              newCount: siteAnalytics.newSitesCount,
              topSites: siteAnalytics.topSitesByTrees
          },
          plots: {
              newCount: plotAnalytics.newPlotsCount,
              topPlots: plotAnalytics.topPlotsByTrees
          },
          giftRequests: {
              newPersonalRequests: giftRequestAnalytics.newPersonalRequests,
              newCorporateRequests: giftRequestAnalytics.newCorporateRequests,
              totalTreesServed: giftRequestAnalytics.totalTreesServed
          }
      });
  } catch (error) {
      console.error('[ERROR] analyticsController::getTimeRangeAnalytics:', error);
      res.status(status.error).send({
          error: error instanceof Error ? error.message : 'Failed to fetch time range analytics'
      });
  }
};