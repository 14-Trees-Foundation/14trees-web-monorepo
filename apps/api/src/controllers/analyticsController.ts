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

    const domainFilterRaw = req.query.domain;
    const forwardedHostHeader = req.headers['x-forwarded-host'];
    const forwardedHost = typeof forwardedHostHeader === 'string' ? forwardedHostHeader.split(',')[0].trim() : null;

    // prefer Origin headline (set by browser cross-origin requests) over the API server's own host header
    const originUrl = req.get('origin');
    const originHost = originUrl ? (() => { try { return new URL(originUrl).hostname; } catch { return null; } })() : null;
    const refererUrl = req.get('referer');
    const refererHost = refererUrl ? (() => { try { return new URL(refererUrl).hostname; } catch { return null; } })() : null;
    const requestHost = (req.get('host') || req.hostname || '').split(':')[0];

    let domainFilter: string;
    if (typeof domainFilterRaw === 'string' && domainFilterRaw.trim().length > 0) {
      // explicit query param takes highest priority
      domainFilter = domainFilterRaw.trim();
    } else if (forwardedHost) {
      domainFilter = forwardedHost.split(':')[0];
    } else if (originHost) {
      // Origin is the most reliable cross-origin signal for the actual frontend host
      domainFilter = originHost;
    } else if (refererHost) {
      domainFilter = refererHost;
    } else {
      domainFilter = requestHost || 'dashboard.14trees.org';
    }

    console.log('Page visits summary request:', {
      queryDomain: typeof domainFilterRaw === 'string' ? domainFilterRaw : null,
      resolvedDomain: domainFilter,
      host: requestHost || null,
      forwardedHost: forwardedHost || null,
      origin: originHost || null,
      referer: refererHost || null,
      ifNoneMatch: req.get('if-none-match') || null,
      limit: topUrlsLimit,
    });

    // disable ETag / conditional-GET so the browser always gets a fresh 200 with data
    res.set('Cache-Control', 'no-store');
    res.removeHeader('ETag');

    const summaryResp = await PageVisitsRepository.getSummary(domainFilter, topUrlsLimit);

    console.log('Page visits summary response:', {
      resolvedDomain: domainFilter,
      totalHits: summaryResp.total_hits,
      trackedUrls: summaryResp.tracked_urls,
      topUrlsCount: summaryResp.top_urls.length,
    });

    return res.status(status.success).send(summaryResp);
  } catch (error) {
    await Logger.logError('analyticsController', 'pageVisitsSummary', error, req);
    return res.status(status.error).send({ error: error });
  }
};

export const giftDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const dateField = (req.query.dateField as string) || 'created_at';
    const months = req.query.months ? parseInt(req.query.months as string) : 12;

    if (dateField !== 'created_at' && dateField !== 'gifted_on') {
      return res.status(status.bad).send({
        error: 'Invalid dateField parameter. Must be "created_at" or "gifted_on"'
      });
    }

    let startDate: Date;
    let endDate: Date;

    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate as string);
      endDate = new Date(req.query.endDate as string);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(status.bad).send({
          error: 'Invalid date format. Use ISO date format (YYYY-MM-DD)'
        });
      }
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
    }

    const analyticsResp = await GiftCardsRepository.getDashboardAnalytics(
      dateField,
      startDate,
      endDate
    );

    return res.status(status.success).send(analyticsResp);
  } catch (error) {
    await Logger.logError('analyticsController', 'giftDashboardAnalytics', error, req);
    return res.status(status.error).send({ error: error });
  }
};
