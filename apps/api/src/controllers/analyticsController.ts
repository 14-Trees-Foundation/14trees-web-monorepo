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
import PageVisitsRepository, { PageVisitSection } from '../repo/pageVisitsRepo';

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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
        await Logger.logError('analyticsController', 'getTotalEmployees', error, req);
        res.status(status.error).send({ error: error });
    }
};

export const trackPageVisit = async (req: Request, res: Response) => {
  try {
    const { pathname, section, url } = req.body || {};

    if (!pathname || !section) {
      return res.status(status.bad).send({ error: 'pathname and section are required' });
    }

    if (!['profile', 'dashboard'].includes(section)) {
      return res.status(status.bad).send({ error: 'section must be profile or dashboard' });
    }

    const normalizedPathname = String(pathname).split('?')[0];

    if (!(normalizedPathname.startsWith('/profile/') || normalizedPathname.startsWith('/dashboard/'))) {
      return res.status(status.nocontent).send();
    }

    let domain = 'unknown';
    if (typeof url === 'string' && url.trim().length > 0) {
      try {
        domain = new URL(url).hostname;
      } catch {
      }
    }

    if (domain === 'unknown') {
      const forwardedHostHeader = req.headers['x-forwarded-host'];
      const forwardedHost = typeof forwardedHostHeader === 'string' ? forwardedHostHeader.split(',')[0].trim() : null;
      const hostHeader = forwardedHost || req.get('host') || req.hostname || 'unknown';
      domain = hostHeader.split(':')[0];
    }
    const visitorIdHeader = req.headers['x-visitor-id'];
    const visitorId = typeof visitorIdHeader === 'string' ? visitorIdHeader : null;

    const userAgentHeader = req.headers['user-agent'];
    const userAgent = typeof userAgentHeader === 'string' ? userAgentHeader : null;

    const xForwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0].trim() : null;
    const socketIp = req.socket?.remoteAddress || null;
    console.log('Tracking page visit:', { domain, pathname: normalizedPathname, section, visitorId, ipAddress: forwardedIp || socketIp, userAgent });
    await PageVisitsRepository.trackPageVisit({
      domain,
      pathname: normalizedPathname,
      section: section as PageVisitSection,
      url: typeof url === 'string' ? url : null,
      visitorId,
      ipAddress: forwardedIp || socketIp,
      userAgent,
    });

    return res.status(status.nocontent).send();
  } catch (error) {
    await Logger.logError('analyticsController', 'trackPageVisit', error, req);
    return res.status(status.nocontent).send();
  }
};

export const pageVisitsSummary = async (req: Request, res: Response) => {
  try {
    const topUrlsLimitRaw = Number(req.query.limit);
    const topUrlsLimit = Number.isFinite(topUrlsLimitRaw) && topUrlsLimitRaw > 0 ? Math.min(topUrlsLimitRaw, 50) : 5;

    // Allow domain to be passed as query parameter, otherwise default to the request's domain
    const domainFilterRaw = req.query.domain;
    let domainFilter = 'dashboard.14trees.org'; // fallback

    if (typeof domainFilterRaw === 'string' && domainFilterRaw.trim().length > 0) {
      // Domain explicitly provided
      domainFilter = domainFilterRaw.trim();
    } else {
      // Default to the current request's domain
      const hostHeader = req.get('host') || req.hostname || 'dashboard.14trees.org';
      domainFilter = hostHeader.split(':')[0]; // strip port
    }

    const summaryResp = await PageVisitsRepository.getSummary(domainFilter, topUrlsLimit);

    return res.status(status.success).send(summaryResp);
  } catch (error) {
    await Logger.logError('analyticsController', 'pageVisitsSummary', error, req);
    return res.status(status.error).send({ error: error });
  }
};
