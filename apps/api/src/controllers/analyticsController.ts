import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

import { status } from '../helpers/status';
import { Logger } from '../helpers/logger';
import { QueryTypes } from 'sequelize';
import TreeRepository from '../repo/treeRepo';
import PlantTypeRepository from '../repo/plantTypeRepo';
import { UserRepository } from '../repo/userRepo';
import { PlotRepository } from '../repo/plotRepo';
import { PondRepository } from '../repo/pondsRepo';
import { OnsiteStaffRepository } from '../repo/onSiteStaffRepo';
import { SiteRepository } from '../repo/sitesRepo';
import { GiftCardsRepository } from '../repo/giftCardsRepo';
import PageVisitsRepository, { PageVisitSection } from '../repo/pageVisitsRepo';
import { sequelize } from '../config/postgreDB';

const aiSummaryCache: Record<number, { text: string; cachedAt: number }> = {};
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let dailyGenerationCount = 0;
let dailyGenerationDate = new Date().toDateString();
const DAILY_GENERATION_LIMIT = 5;

const parseYearFilter = (value: unknown): number | null => {
	if (value === undefined || value === null) {
		return null;
	}
	const normalized =
		typeof value === 'number'
			? value
			: typeof value === 'string'
				? parseInt(value.trim(), 10)
				: NaN;
	if (Number.isNaN(normalized) || normalized <= 0) {
		return null;
	}
	return normalized;
};

const parseRequestTypeFilter = (
	value: unknown,
): 'Corporate' | 'Personal' | null => {
	if (typeof value !== 'string') {
		return null;
	}
	const normalized = value.trim().toLowerCase();
	if (normalized === 'corporate') {
		return 'Corporate';
	}
	if (normalized === 'personal') {
		return 'Personal';
	}
	return null;
};

const parseRequestSourceFilter = (
	value: unknown,
): 'Website' | 'Manual' | null => {
	if (typeof value !== 'string') {
		return null;
	}
	const normalized = value.trim().toLowerCase();
	if (normalized === 'website') {
		return 'Website';
	}
	if (normalized === 'manual') {
		return 'Manual';
	}
	return null;
};

function checkDailyLimit(): boolean {
	const today = new Date().toDateString();
	if (dailyGenerationDate !== today) {
		dailyGenerationCount = 0;
		dailyGenerationDate = today;
	}
	return dailyGenerationCount < DAILY_GENERATION_LIMIT;
}

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
		const giftCardCounts = await GiftCardsRepository.getGiftCardSummaryCounts();

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
			totalGiftedTrees: giftCardCounts.total_gifted_trees,
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
		await Logger.logError(
			'analyticsController',
			'getTotalPlantType',
			error,
			req,
		);
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
		await Logger.logError(
			'analyticsController',
			'getTotalEmployees',
			error,
			req,
		);
		res.status(status.error).send({ error: error });
	}
};

export const trackPageVisit = async (req: Request, res: Response) => {
	try {
		const { pathname, section, url } = req.body || {};

		if (!pathname || !section) {
			return res
				.status(status.bad)
				.send({ error: 'pathname and section are required' });
		}

		if (!['profile', 'dashboard'].includes(section)) {
			return res
				.status(status.bad)
				.send({ error: 'section must be profile or dashboard' });
		}

		const normalizedPathname = String(pathname).split('?')[0];

		if (
			!(
				normalizedPathname.startsWith('/profile/') ||
				normalizedPathname.startsWith('/dashboard/')
			)
		) {
			return res.status(status.nocontent).send();
		}

		let domain = 'unknown';
		if (typeof url === 'string' && url.trim().length > 0) {
			try {
				domain = new URL(url).hostname;
			} catch {}
		}

		if (domain === 'unknown') {
			const forwardedHostHeader = req.headers['x-forwarded-host'];
			const forwardedHost =
				typeof forwardedHostHeader === 'string'
					? forwardedHostHeader.split(',')[0].trim()
					: null;
			const hostHeader =
				forwardedHost || req.get('host') || req.hostname || 'unknown';
			domain = hostHeader.split(':')[0];
		}
		const visitorIdHeader = req.headers['x-visitor-id'];
		const visitorId =
			typeof visitorIdHeader === 'string' ? visitorIdHeader : null;

		const userAgentHeader = req.headers['user-agent'];
		const userAgent =
			typeof userAgentHeader === 'string' ? userAgentHeader : null;

		const xForwardedFor = req.headers['x-forwarded-for'];
		const forwardedIp =
			typeof xForwardedFor === 'string'
				? xForwardedFor.split(',')[0].trim()
				: null;
		const socketIp = req.socket?.remoteAddress || null;
		console.log('Tracking page visit:', {
			domain,
			pathname: normalizedPathname,
			section,
			visitorId,
			ipAddress: forwardedIp || socketIp,
			userAgent,
		});
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
		const topUrlsLimit =
			Number.isFinite(topUrlsLimitRaw) && topUrlsLimitRaw > 0
				? Math.min(topUrlsLimitRaw, 50)
				: 5;

		const domainFilterRaw = req.query.domain;
		const forwardedHostHeader = req.headers['x-forwarded-host'];
		const forwardedHost =
			typeof forwardedHostHeader === 'string'
				? forwardedHostHeader.split(',')[0].trim()
				: null;

		// prefer Origin headline (set by browser cross-origin requests) over the API server's own host header
		const originUrl = req.get('origin');
		const originHost = originUrl
			? (() => {
					try {
						return new URL(originUrl).hostname;
					} catch {
						return null;
					}
			  })()
			: null;
		const refererUrl = req.get('referer');
		const refererHost = refererUrl
			? (() => {
					try {
						return new URL(refererUrl).hostname;
					} catch {
						return null;
					}
			  })()
			: null;
		const requestHost = (req.get('host') || req.hostname || '').split(':')[0];

		let domainFilter: string;
		if (
			typeof domainFilterRaw === 'string' &&
			domainFilterRaw.trim().length > 0
		) {
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

		const summaryResp = await PageVisitsRepository.getSummary(
			domainFilter,
			topUrlsLimit,
		);

		console.log('Page visits summary response:', {
			resolvedDomain: domainFilter,
			totalHits: summaryResp.total_hits,
			trackedUrls: summaryResp.tracked_urls,
			topUrlsCount: summaryResp.top_urls.length,
		});

		return res.status(status.success).send(summaryResp);
	} catch (error) {
		await Logger.logError(
			'analyticsController',
			'pageVisitsSummary',
			error,
			req,
		);
		return res.status(status.error).send({ error: error });
	}
};

export const getGiftCardSummaryKPIs = async (req: Request, res: Response) => {
	const schema = process.env.POSTGRES_SCHEMA || '14trees';

	try {
		const yearFilter = parseYearFilter(req.query.year);
		const requestTypeFilter = parseRequestTypeFilter(req.query.type);
		const whereClauses = ["request_source != 'Test'"];
		const replacements: Record<string, any> = {};
		if (yearFilter !== null) {
			whereClauses.push('year = :year');
			replacements.year = yearFilter;
		}
		if (requestTypeFilter) {
			whereClauses.push('request_type = :requestType');
			replacements.requestType = requestTypeFilter;
		}
		const whereClause = `WHERE ${whereClauses.join(' AND ')}`;
		const query = `
      SELECT
        COUNT(DISTINCT request_id) AS total_requests,
        COUNT(*) FILTER (WHERE request_type = 'Corporate') AS corporate_count,
        COUNT(*) FILTER (WHERE request_type = 'Personal') AS personal_count,
        COALESCE(SUM(fulfilled_cards), 0) AS fulfilled_count,
        COALESCE(SUM(pending_cards), 0) AS pending_count,
        COALESCE(SUM(total_trees), 0) AS total_trees,
        ROUND(
          COALESCE(SUM(total_trees), 0)::numeric /
          NULLIF(COALESCE(SUM(total_cards_issued), 0), 0),
          1
        ) AS avg_trees_per_card
      FROM "${schema}".mv_gift_card_request_summary
      ${whereClause}
    `;

		const result = await sequelize.query(query, {
			replacements,
			type: QueryTypes.SELECT,
		});
		const row: any = result[0];

		if (!row) {
			return res.status(status.success).send({});
		}

		const toInt = (value: any) =>
			value === null || value === undefined ? 0 : parseInt(value, 10) || 0;
		const toFloat = (value: any) =>
			value === null || value === undefined ? 0 : parseFloat(value);

		const responsePayload = {
			total_requests: toInt(row.total_requests),
			corporate_count: toInt(row.corporate_count),
			personal_count: toInt(row.personal_count),
			fulfilled_count: toInt(row.fulfilled_count),
			pending_count: toInt(row.pending_count),
			total_trees: toInt(row.total_trees),
			avg_trees_per_card: toFloat(row.avg_trees_per_card),
		};

		return res.status(status.success).send(responsePayload);
	} catch (error) {
		await Logger.logError(
			'analyticsController',
			'getGiftCardSummaryKPIs',
			error,
			req,
		);
		return res.status(status.error).send({ error: error });
	}
};

export const getGiftCardSources = async (req: Request, res: Response) => {
	const schema = process.env.POSTGRES_SCHEMA || '14trees';

	try {
		const yearFilter = parseYearFilter(req.query.year);
		const requestTypeFilter = parseRequestTypeFilter(req.query.type);
		const whereClauses = ["request_source != 'Test'"];
		const replacements: Record<string, any> = {};
		if (yearFilter !== null) {
			whereClauses.push('year = :year');
			replacements.year = yearFilter;
		}
		if (requestTypeFilter) {
			whereClauses.push('request_type = :requestType');
			replacements.requestType = requestTypeFilter;
		}
		const whereClause = `WHERE ${whereClauses.join(' AND ')}`;
		const monthNames = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		];
		const summaryQuery = `
      SELECT
        COUNT(*) FILTER (WHERE request_source = 'Website') AS website_requests,
        COUNT(*) FILTER (WHERE request_source = 'Manual') AS manual_requests,
        COALESCE(SUM(no_of_cards) FILTER (WHERE request_source = 'Website'), 0) AS website_trees,
        COALESCE(SUM(no_of_cards) FILTER (WHERE request_source = 'Manual'), 0) AS manual_trees
      FROM "${schema}".mv_gift_card_request_summary
			${whereClause}
    `;

		const monthlyQuery = `
      SELECT
        EXTRACT(YEAR FROM created_at)::int AS year,
        EXTRACT(MONTH FROM created_at)::int AS month,
        COUNT(*) FILTER (WHERE request_source = 'Website') AS website,
        COUNT(*) FILTER (WHERE request_source = 'Manual') AS manual,
        COALESCE(SUM(no_of_cards) FILTER (WHERE request_source = 'Website'), 0) AS website_trees,
        COALESCE(SUM(no_of_cards) FILTER (WHERE request_source = 'Manual'), 0) AS manual_trees
      FROM "${schema}".mv_gift_card_request_summary
			${whereClause}
      GROUP BY
        EXTRACT(YEAR FROM created_at)::int,
        EXTRACT(MONTH FROM created_at)::int
      ORDER BY
        EXTRACT(YEAR FROM created_at)::int ASC,
        EXTRACT(MONTH FROM created_at)::int ASC
    `;

		const summaryRows: any[] = await sequelize.query(summaryQuery, {
			replacements,
			type: QueryTypes.SELECT,
		});
		const monthlyRows: any[] = await sequelize.query(monthlyQuery, {
			replacements,
			type: QueryTypes.SELECT,
		});

		const summaryRow = summaryRows[0] || {};
		const websiteRequests = parseInt(summaryRow.website_requests, 10) || 0;
		const manualRequests = parseInt(summaryRow.manual_requests, 10) || 0;
		const websiteTrees = parseInt(summaryRow.website_trees, 10) || 0;
		const manualTrees = parseInt(summaryRow.manual_trees, 10) || 0;
		const totalRequests = websiteRequests + manualRequests;

		const responsePayload = {
			summary: {
				website_requests: websiteRequests,
				manual_requests: manualRequests,
				website_trees: websiteTrees,
				manual_trees: manualTrees,
				website_pct:
					totalRequests > 0
						? Math.round((websiteRequests / totalRequests) * 1000) / 10
						: 0,
				manual_pct:
					totalRequests > 0
						? Math.round((manualRequests / totalRequests) * 1000) / 10
						: 0,
			},
			monthly: monthlyRows.map((row) => {
				const month = parseInt(row.month, 10) || 0;
				return {
					month,
					month_name: monthNames[month - 1],
					year: parseInt(row.year, 10) || 0,
					website: parseInt(row.website, 10) || 0,
					manual: parseInt(row.manual, 10) || 0,
					website_trees: parseInt(row.website_trees, 10) || 0,
					manual_trees: parseInt(row.manual_trees, 10) || 0,
				};
			}),
		};

		return res.status(status.success).send(responsePayload);
	} catch (error) {
		await Logger.logError(
			'analyticsController',
			'getGiftCardSources',
			error,
			req,
		);
		return res.status(status.error).send({ error: error });
	}
};

export const getGiftCardMonthly = async (req: Request, res: Response) => {
	const schema = process.env.POSTGRES_SCHEMA || '14trees';

	try {
		const currentYear = new Date().getFullYear();
		const yearParam = req.query.year
			? parseInt(req.query.year as string, 10)
			: currentYear;
		const year = Number.isNaN(yearParam) ? currentYear : yearParam;
		const monthNames = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		];

		const query = `
      SELECT
        month,
        request_type,
        COUNT(*) AS total_count,
        COALESCE(SUM(total_trees), 0) AS total_trees,
        COALESCE(SUM(CASE WHEN request_type = 'Corporate' THEN total_trees ELSE 0 END), 0) AS corporate_trees,
        COALESCE(SUM(CASE WHEN request_type = 'Personal' THEN total_trees ELSE 0 END), 0) AS personal_trees
      FROM "${schema}".mv_gift_card_request_summary
      WHERE year = :year
      GROUP BY month, request_type
      ORDER BY month ASC
    `;

		const rows: any[] = await sequelize.query(query, {
			replacements: { year },
			type: QueryTypes.SELECT,
		});

		const monthlyMap = new Map<
			number,
			{
				month: number;
				month_name: string;
				corporate: number;
				personal: number;
				total: number;
				total_trees: number;
				corporate_trees: number;
				personal_trees: number;
			}
		>();
		for (let month = 1; month <= 12; month += 1) {
			monthlyMap.set(month, {
				month,
				month_name: monthNames[month - 1],
				corporate: 0,
				personal: 0,
				total: 0,
				total_trees: 0,
				corporate_trees: 0,
				personal_trees: 0,
			});
		}

		rows.forEach((row) => {
			const monthKey = parseInt(row.month, 10);
			if (Number.isNaN(monthKey)) {
				return;
			}
			const monthRow = monthlyMap.get(monthKey);
			if (!monthRow) return;
			const count = parseInt(row.total_count, 10) || 0;
			const totalTrees = parseInt(row.total_trees, 10) || 0;
			const corporateTrees = parseInt(row.corporate_trees, 10) || 0;
			const personalTrees = parseInt(row.personal_trees, 10) || 0;
			if (row.request_type === 'Corporate') monthRow.corporate = count;
			if (row.request_type === 'Personal') monthRow.personal = count;
			if (row.request_type === 'Corporate')
				monthRow.corporate_trees = corporateTrees;
			if (row.request_type === 'Personal')
				monthRow.personal_trees = personalTrees;
			monthRow.total = monthRow.corporate + monthRow.personal;
			monthRow.total_trees += totalTrees;
		});

		const responsePayload = Array.from(monthlyMap.values()).map((entry) => ({
			month: parseInt(String(entry.month), 10) || 0,
			month_name: entry.month_name,
			corporate: parseInt(String(entry.corporate), 10) || 0,
			personal: parseInt(String(entry.personal), 10) || 0,
			total: parseInt(String(entry.total), 10) || 0,
			total_trees: parseInt(String(entry.total_trees), 10) || 0,
			corporate_trees: parseInt(String(entry.corporate_trees), 10) || 0,
			personal_trees: parseInt(String(entry.personal_trees), 10) || 0,
		}));

		return res.status(status.success).send(responsePayload);
	} catch (error) {
		await Logger.logError(
			'analyticsController',
			'getGiftCardMonthly',
			error,
			req,
		);
		return res.status(status.error).send({ error: error });
	}
};

export const getGiftCardYearly = async (req: Request, res: Response) => {
	const schema = process.env.POSTGRES_SCHEMA || '14trees';

	try {
		const requestTypeFilter = parseRequestTypeFilter(req.query.type);
		const requestSourceFilter = parseRequestSourceFilter(req.query.source);
		const whereClauses = ["request_source != 'Test'"];
		const replacements: Record<string, any> = {};
		if (requestTypeFilter) {
			whereClauses.push('request_type = :requestType');
			replacements.requestType = requestTypeFilter;
		}
		if (requestSourceFilter) {
			whereClauses.push('request_source = :requestSource');
			replacements.requestSource = requestSourceFilter;
		}
		const whereClause = `WHERE ${whereClauses.join(' AND ')}`;

		const query = `
      SELECT
        year::int AS year,
        COUNT(*) FILTER (WHERE request_type = 'Corporate') AS corporate,
        COUNT(*) FILTER (WHERE request_type = 'Personal') AS personal,
        COUNT(*) AS total,
        COALESCE(SUM(no_of_cards) FILTER (WHERE request_type = 'Corporate'), 0) AS corporate_trees,
        COALESCE(SUM(no_of_cards) FILTER (WHERE request_type = 'Personal'), 0) AS personal_trees,
        COALESCE(SUM(no_of_cards), 0) AS total_trees
      FROM "${schema}".mv_gift_card_request_summary
      ${whereClause}
      GROUP BY year
      ORDER BY year ASC
    `;

		const rows: any[] = await sequelize.query(query, {
			replacements,
			type: QueryTypes.SELECT,
		});

		const responsePayload = rows.map((row) => ({
			year: parseInt(row.year, 10) || 0,
			corporate: parseInt(row.corporate, 10) || 0,
			personal: parseInt(row.personal, 10) || 0,
			total: parseInt(row.total, 10) || 0,
			corporate_trees: parseInt(row.corporate_trees, 10) || 0,
			personal_trees: parseInt(row.personal_trees, 10) || 0,
			total_trees: parseInt(row.total_trees, 10) || 0,
		}));

		return res.status(status.success).send(responsePayload);
	} catch (error) {
		await Logger.logError(
			'analyticsController',
			'getGiftCardYearly',
			error,
			req,
		);
		return res.status(status.error).send({ error: error });
	}
};

export const getGiftCardTreeDistribution = async (
	req: Request,
	res: Response,
) => {
	const schema = process.env.POSTGRES_SCHEMA || '14trees';

	try {
		const yearFilter = parseYearFilter(req.query.year);
		const requestTypeFilter = parseRequestTypeFilter(req.query.type);
		const whereClauses = ["request_source != 'Test'"];
		const replacements: Record<string, any> = {};
		if (yearFilter !== null) {
			whereClauses.push('year = :year');
			replacements.year = yearFilter;
		}
		if (requestTypeFilter) {
			whereClauses.push('request_type = :requestType');
			replacements.requestType = requestTypeFilter;
		}
		const whereClause = `WHERE ${whereClauses.join(' AND ')}`;
		const buckets = [
			'1',
			'2-5',
			'6-10',
			'11-25',
			'26-50',
			'51-100',
			'101-250',
			'250+',
		];
		const query = `
      SELECT
        CASE
          WHEN no_of_cards = 1 THEN '1'
          WHEN no_of_cards BETWEEN 2 AND 5 THEN '2-5'
          WHEN no_of_cards BETWEEN 6 AND 10 THEN '6-10'
          WHEN no_of_cards BETWEEN 11 AND 25 THEN '11-25'
          WHEN no_of_cards BETWEEN 26 AND 50 THEN '26-50'
          WHEN no_of_cards BETWEEN 51 AND 100 THEN '51-100'
          WHEN no_of_cards BETWEEN 101 AND 250 THEN '101-250'
          ELSE '250+'
        END AS bucket,
        request_type,
        COUNT(*) AS request_count,
        COALESCE(SUM(no_of_cards), 0) AS total_trees
      FROM "${schema}".mv_gift_card_request_summary
			${whereClause}
      GROUP BY bucket, request_type
      ORDER BY MIN(no_of_cards)
    `;

		const rows: any[] = await sequelize.query(query, {
			replacements,
			type: QueryTypes.SELECT,
		});

		const distribution = {
			buckets,
			corporate: buckets.map(() => 0),
			personal: buckets.map(() => 0),
			corporate_trees: buckets.map(() => 0),
			personal_trees: buckets.map(() => 0),
		};

		rows.forEach((row) => {
			const bucketIndex = buckets.indexOf(row.bucket);
			if (bucketIndex === -1) {
				return;
			}

			const requestCount = parseInt(row.request_count, 10) || 0;
			const totalTrees = parseInt(row.total_trees, 10) || 0;

			if (row.request_type === 'Corporate') {
				distribution.corporate[bucketIndex] = requestCount;
				distribution.corporate_trees[bucketIndex] = totalTrees;
			}

			if (row.request_type === 'Personal') {
				distribution.personal[bucketIndex] = requestCount;
				distribution.personal_trees[bucketIndex] = totalTrees;
			}
		});

		return res.status(status.success).send({
			buckets: distribution.buckets,
			corporate: distribution.corporate.map(
				(value) => parseInt(String(value), 10) || 0,
			),
			personal: distribution.personal.map(
				(value) => parseInt(String(value), 10) || 0,
			),
			corporate_trees: distribution.corporate_trees.map(
				(value) => parseInt(String(value), 10) || 0,
			),
			personal_trees: distribution.personal_trees.map(
				(value) => parseInt(String(value), 10) || 0,
			),
		});
	} catch (error) {
		await Logger.logError(
			'analyticsController',
			'getGiftCardTreeDistribution',
			error,
			req,
		);
		return res.status(status.error).send({ error: error });
	}
};

export const getGiftCardOccasions = async (req: Request, res: Response) => {
	const schema = process.env.POSTGRES_SCHEMA || '14trees';

	try {
		const rawType =
			typeof req.query.type === 'string' ? req.query.type.toLowerCase() : 'all';
		const type = ['all', 'corporate', 'personal'].includes(rawType)
			? rawType
			: 'all';
		const monthNames = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		];

		const replacements: Record<string, any> = {};
		let whereClause = '';
		if (type !== 'all') {
			replacements.requestType =
				type === 'corporate' ? 'Corporate' : 'Personal';
			whereClause = 'WHERE request_type = :requestType';
		}

		const query = `
      SELECT
        COALESCE(occasion, 'Unassigned') AS occasion,
        month,
        year,
        COUNT(*) AS total_count
      FROM "${schema}".mv_gift_card_request_summary
      ${whereClause}
      GROUP BY COALESCE(occasion, 'Unassigned'), month, year
      ORDER BY COALESCE(occasion, 'Unassigned') ASC, year ASC, month ASC
    `;

		const rows: any[] = await sequelize.query(query, {
			replacements,
			type: QueryTypes.SELECT,
		});

		const occasions: Record<string, number> = {};
		const monthlyByOccasion: Record<
			string,
			Array<{ month: number; month_name: string; count: number }>
		> = {};

		rows.forEach((row) => {
			const occasion = row.occasion || 'Unassigned';
			const count = parseInt(row.total_count, 10) || 0;
			const month = parseInt(row.month, 10);

			occasions[occasion] = (occasions[occasion] || 0) + count;

			if (!monthlyByOccasion[occasion]) {
				monthlyByOccasion[occasion] = monthNames.map((monthName, index) => ({
					month: index + 1,
					month_name: monthName,
					count: 0,
				}));
			}

			if (month >= 1 && month <= 12) {
				monthlyByOccasion[occasion][month - 1].count += count;
			}
		});

		const normalizedOccasions = Object.fromEntries(
			Object.entries(occasions).map(([key, value]) => [
				key,
				parseInt(String(value), 10) || 0,
			]),
		);

		const normalizedMonthlyByOccasion = Object.fromEntries(
			Object.entries(monthlyByOccasion).map(([key, entries]) => [
				key,
				entries.map((entry) => ({
					month: parseInt(String(entry.month), 10) || 0,
					month_name: entry.month_name,
					count: parseInt(String(entry.count), 10) || 0,
				})),
			]),
		);

		return res.status(status.success).send({
			occasions: normalizedOccasions,
			monthly_by_occasion: normalizedMonthlyByOccasion,
		});
	} catch (error) {
		await Logger.logError(
			'analyticsController',
			'getGiftCardOccasions',
			error,
			req,
		);
		return res.status(status.error).send({ error: error });
	}
};

export const getGiftCardLeaderboard = async (req: Request, res: Response) => {
	const schema = process.env.POSTGRES_SCHEMA || '14trees';

	try {
		const sortBy = req.query.sortBy === 'cards' ? 'cards' : 'trees';
		const limitRaw = req.query.limit
			? parseInt(req.query.limit as string, 10)
			: 10;
		const limit = Number.isNaN(limitRaw)
			? 10
			: Math.min(Math.max(limitRaw, 1), 50);
		const yearFilter = parseYearFilter(req.query.year);
		const requestTypeFilter = parseRequestTypeFilter(req.query.type);
		const orderColumn = sortBy === 'cards' ? 'total_cards' : 'total_trees';
		const filterClauses = ["request_source != 'Test'"];
		const filterReplacements: Record<string, any> = {};
		if (yearFilter !== null) {
			filterClauses.push('year = :year');
			filterReplacements.year = yearFilter;
		}
		if (requestTypeFilter) {
			filterClauses.push('request_type = :requestType');
			filterReplacements.requestType = requestTypeFilter;
		}
		const filterWhere = `WHERE ${filterClauses.join(' AND ')}`;
		const requestTypeCase = `
			CASE
				WHEN g.type IN ('corporate', 'ngo', 'alumni') THEN 'Corporate'
				ELSE 'Personal'
			END
		`;
		const query = `
			WITH filtered_requests AS (
				SELECT DISTINCT request_id
				FROM "${schema}".mv_gift_card_request_summary
				${filterWhere}
			),
			gift_card_stats AS (
				SELECT
					gift_card_request_id,
					COUNT(id) AS total_cards,
					COUNT(id) FILTER (WHERE assigned_to IS NOT NULL) AS fulfilled_cards,
					COUNT(id) FILTER (WHERE assigned_to IS NULL) AS pending_cards,
					COUNT(tree_id) AS total_trees
				FROM "${schema}".gift_cards
				GROUP BY gift_card_request_id
			)
			SELECT
				gcr.user_id,
				u.name AS requester_name,
				COALESCE(g.id, -1) AS group_id,
				g.name AS group_name,
				${requestTypeCase} AS request_type,
				COUNT(DISTINCT gcr.id) AS total_requests,
				COALESCE(SUM(gc_stats.total_cards), 0) AS total_cards,
				COALESCE(SUM(gc_stats.fulfilled_cards), 0) AS fulfilled_cards,
				COALESCE(SUM(gc_stats.pending_cards), 0) AS pending_cards,
				COALESCE(SUM(gc_stats.total_trees), 0) AS total_trees,
				COALESCE(SUM(gcr.amount_received), 0) AS total_amount_received,
				ARRAY_REMOVE(ARRAY_AGG(DISTINCT gcr.event_type), NULL) AS occasion_types,
				MIN(gcr.created_at) AS first_request_at,
				MAX(gcr.created_at) AS last_request_at
			FROM "${schema}".gift_card_requests gcr
			JOIN filtered_requests fr ON fr.request_id = gcr.id
			LEFT JOIN "${schema}".users u ON u.id = gcr.user_id
			LEFT JOIN "${schema}".groups g ON g.id = gcr.group_id
			LEFT JOIN gift_card_stats gc_stats ON gc_stats.gift_card_request_id = gcr.id
			GROUP BY gcr.user_id, u.name, g.id, g.name, g.type
			ORDER BY ${orderColumn} DESC, total_requests DESC
			LIMIT :limit
		`;

		const rows: any[] = await sequelize.query(query, {
			replacements: { ...filterReplacements, limit },
			type: QueryTypes.SELECT,
		});
		const toNullableInt = (value: any) =>
			value === null || value === undefined ? null : parseInt(value, 10) || 0;
		const toFloat = (value: any) =>
			value === null || value === undefined ? 0 : parseFloat(value);

		const responsePayload = rows.map((row) => ({
			user_id: toNullableInt(row.user_id),
			requester_name: row.requester_name,
			group_id: toNullableInt(row.group_id),
			group_name: row.group_name,
			request_type: row.request_type,
			total_requests: parseInt(row.total_requests, 10) || 0,
			total_cards: parseInt(row.total_cards, 10) || 0,
			fulfilled_cards: parseInt(row.fulfilled_cards, 10) || 0,
			pending_cards: parseInt(row.pending_cards, 10) || 0,
			total_trees: parseInt(row.total_trees, 10) || 0,
			total_amount_received: toFloat(row.total_amount_received),
			occasion_types: row.occasion_types,
			first_request_at: row.first_request_at,
			last_request_at: row.last_request_at,
		}));

		return res.status(status.success).send(responsePayload);
	} catch (error) {
		await Logger.logError(
			'analyticsController',
			'getGiftCardLeaderboard',
			error,
			req,
		);
		return res.status(status.error).send({ error: error });
	}
};

export const getGiftCardRequesterProfile = async (
	req: Request,
	res: Response,
) => {
	const schema = process.env.POSTGRES_SCHEMA || '14trees';

	try {
		const userId = parseInt(req.params.userId, 10);
		if (Number.isNaN(userId)) {
			return res.status(status.bad).send({ error: 'Invalid userId' });
		}

		const statsQuery = `
      SELECT
        user_id,
        requester_name,
        group_id,
        group_name,
        request_type,
        total_requests,
        total_cards,
        fulfilled_cards,
        pending_cards,
        total_trees,
        total_amount_received,
        occasion_types,
        first_request_at,
        last_request_at
      FROM "${schema}".mv_requester_leaderboard
      WHERE user_id = :userId
      ORDER BY total_trees DESC, total_requests DESC
      LIMIT 1
    `;

		const statsRows: any[] = await sequelize.query(statsQuery, {
			replacements: { userId },
			type: QueryTypes.SELECT,
		});

		if (statsRows.length === 0) {
			return res.status(status.notfound).send({ error: 'Requester not found' });
		}

		const historyQuery = `
      SELECT
        id,
        request_id,
        event_type AS occasion,
        no_of_cards,
        status,
        gifted_on,
        created_at
      FROM "${schema}".gift_card_requests
      WHERE created_by = :userId
      ORDER BY created_at DESC
      LIMIT 20
    `;

		const historyRows: any[] = await sequelize.query(historyQuery, {
			replacements: { userId },
			type: QueryTypes.SELECT,
		});
		const toNullableInt = (value: any) =>
			value === null || value === undefined ? null : parseInt(value, 10) || 0;
		const toFloat = (value: any) =>
			value === null || value === undefined ? 0 : parseFloat(value);

		const rawStats = statsRows[0];
		const stats = {
			user_id: toNullableInt(rawStats.user_id),
			requester_name: rawStats.requester_name,
			group_id: toNullableInt(rawStats.group_id),
			group_name: rawStats.group_name,
			request_type: rawStats.request_type,
			total_requests: parseInt(rawStats.total_requests, 10) || 0,
			total_cards: parseInt(rawStats.total_cards, 10) || 0,
			fulfilled_cards: parseInt(rawStats.fulfilled_cards, 10) || 0,
			pending_cards: parseInt(rawStats.pending_cards, 10) || 0,
			total_trees: parseInt(rawStats.total_trees, 10) || 0,
			total_amount_received: toFloat(rawStats.total_amount_received),
			occasion_types: rawStats.occasion_types,
			first_request_at: rawStats.first_request_at,
			last_request_at: rawStats.last_request_at,
		};

		const recentHistory = historyRows.map((row) => ({
			id: toNullableInt(row.id),
			request_id: row.request_id,
			occasion: row.occasion,
			no_of_cards: parseInt(row.no_of_cards, 10) || 0,
			status: row.status,
			gifted_on: row.gifted_on,
			created_at: row.created_at,
		}));

		return res.status(status.success).send({
			stats,
			recent_history: recentHistory,
		});
	} catch (error) {
		await Logger.logError(
			'analyticsController',
			'getGiftCardRequesterProfile',
			error,
			req,
		);
		return res.status(status.error).send({ error: error });
	}
};

export const getGiftCardAISummary = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const year = parseInt(
		(req.query.year as string) || String(new Date().getFullYear()),
		10,
	);
	const force = req.query.force === 'true';

	const cached = aiSummaryCache[year];
	// Check daily limit only for fresh generations (force=true or no cache)
	if (force || !cached) {
		const today = new Date().toDateString();
		if (dailyGenerationDate !== today) {
			dailyGenerationCount = 0;
			dailyGenerationDate = today;
		}
		if (dailyGenerationCount >= DAILY_GENERATION_LIMIT) {
			res.setHeader('Content-Type', 'text/event-stream');
			res.setHeader('Cache-Control', 'no-cache');
			res.setHeader('Connection', 'keep-alive');
			res.setHeader('X-Rate-Limited', 'true');
			res.flushHeaders();
			if (cached) {
				// Serve stale cache with a warning
				const words = cached.text.split(' ');
				for (const word of words) {
					res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
				}
			} else {
				res.write(
					`data: ${JSON.stringify({
						text: 'Daily generation limit reached (5/day). Please try again tomorrow.',
					})}\n\n`,
				);
			}
			res.write('data: [DONE]\n\n');
			res.end();
			return;
		}
	}
	if (!force && cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('X-Cache', 'HIT');
		res.flushHeaders();

		const words = cached.text.split(' ');
		for (const word of words) {
			res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
		}
		res.write('data: [DONE]\n\n');
		res.end();
		return;
	}

	try {
		const [kpiRows, monthlyRows, occasionRows, sourceRows, leaderboardRows] =
			await Promise.all([
				// 1. KPI — aggregate from row-level materialized view
				sequelize.query<Record<string, unknown>>(
					`SELECT
           COUNT(*)                                                        AS total_requests,
           COUNT(*) FILTER (WHERE request_type = 'Corporate')             AS corporate_requests,
           COUNT(*) FILTER (WHERE request_type = 'Personal')              AS personal_requests,
           SUM(fulfilled_cards)                                            AS fulfilled_requests,
           SUM(pending_cards)                                              AS pending_requests,
           SUM(total_trees)                                                AS total_trees_planted,
           AVG(no_of_cards) FILTER (WHERE request_type = 'Corporate')     AS avg_trees_corporate,
           AVG(no_of_cards) FILTER (WHERE request_type = 'Personal')      AS avg_trees_personal
         FROM "14trees".mv_gift_card_request_summary
         WHERE request_source != 'Test'`,
					{ type: QueryTypes.SELECT },
				),

				// 2. Monthly breakdown
				sequelize.query<Record<string, unknown>>(
					`SELECT
  TO_CHAR(month_bucket, 'Mon')  AS month,
  month::int                    AS month_num,
  COUNT(*)                      AS requests,
  COALESCE(SUM(no_of_cards), 0) AS trees,
  LAG(COUNT(*)) OVER (ORDER BY month::int)                      AS prev_requests,
  LAG(COALESCE(SUM(no_of_cards), 0)) OVER (ORDER BY month::int) AS prev_trees
FROM "14trees".mv_gift_card_request_summary
WHERE year = :year
  AND request_source != 'Test'
GROUP BY month_bucket, month
ORDER BY month_num`,
					{ type: QueryTypes.SELECT, replacements: { year } },
				),

				// 3. Top 5 occasions
				sequelize.query<Record<string, unknown>>(
					`SELECT
           occasion,
           COUNT(*)                      AS request_count,
           COALESCE(SUM(no_of_cards), 0) AS trees
         FROM "14trees".mv_gift_card_request_summary
         WHERE request_source != 'Test'
         GROUP BY occasion
         ORDER BY request_count DESC
         LIMIT 5`,
					{ type: QueryTypes.SELECT },
				),

				// 4. Request sources
				sequelize.query<Record<string, unknown>>(
					`SELECT
           request_source                AS source,
           COUNT(*)                      AS request_count,
           COALESCE(SUM(no_of_cards), 0) AS trees
         FROM "14trees".mv_gift_card_request_summary
         GROUP BY request_source`,
					{ type: QueryTypes.SELECT },
				),

				// 5. Top 3 requesters
				sequelize.query<Record<string, unknown>>(
					`SELECT
           requester_name                AS name,
           total_requests,
           total_trees
         FROM "14trees".mv_requester_leaderboard
         ORDER BY total_trees DESC
         LIMIT 3`,
					{ type: QueryTypes.SELECT },
				),
			]);

		const kpi = kpiRows[0] ?? {};

		const analyticsContext = `
Gift Card Platform Analytics Summary — Year ${year}

OVERALL KPIs:
- Total requests: ${kpi['total_requests'] ?? 'N/A'}
- Corporate requests: ${kpi['corporate_requests'] ?? 'N/A'} (avg ${Number(
			kpi['avg_trees_corporate'] ?? 0,
		).toFixed(0)} trees/req)
- Personal requests: ${kpi['personal_requests'] ?? 'N/A'} (avg ${Number(
			kpi['avg_trees_personal'] ?? 0,
		).toFixed(0)} trees/req)
- Fulfilled: ${kpi['fulfilled_requests'] ?? 'N/A'}
- Pending: ${kpi['pending_requests'] ?? 'N/A'}
- Total trees planted: ${kpi['total_trees_planted'] ?? 'N/A'}

MONTHLY BREAKDOWN FOR ${year} (with month-over-month change):
${monthlyRows.map((r) => {
  const reqDelta = r['prev_requests']
    ? (((Number(r['requests']) - Number(r['prev_requests'])) / Number(r['prev_requests'])) * 100).toFixed(0)
    : null;
  const treeDelta = r['prev_trees']
    ? (((Number(r['trees']) - Number(r['prev_trees'])) / Number(r['prev_trees'])) * 100).toFixed(0)
    : null;
  const reqChange = reqDelta ? ` (${Number(reqDelta) >= 0 ? '+' : ''}${reqDelta}% vs prev month)` : '';
  const treeChange = treeDelta ? ` (${Number(treeDelta) >= 0 ? '+' : ''}${treeDelta}% vs prev month)` : '';
  return `  ${r['month']}: ${r['requests']} requests${reqChange}, ${r['trees']} trees${treeChange}`;
}).join('\n')}

TOP OCCASIONS:
${occasionRows
	.map(
		(r, i) =>
			`  ${i + 1}. ${r['occasion']}: ${r['request_count']} requests, ${
				r['trees']
			} trees`,
	)
	.join('\n')}

REQUEST SOURCES:
${sourceRows
	.map(
		(r) =>
			`  ${r['source']}: ${r['request_count']} requests, ${r['trees']} trees`,
	)
	.join('\n')}

TOP REQUESTERS (all time):
${leaderboardRows
	.map(
		(r, i) =>
			`  ${i + 1}. ${r['name']}: ${r['total_requests']} requests, ${
				r['total_trees']
			} trees`,
	)
	.join('\n')}
`.trim();

		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('X-Cache', 'MISS');
		res.flushHeaders();

		const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
		let fullText = '';

		const stream = await anthropic.messages.stream({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 300,
			system: `You are a concise data analyst for a tree plantation platform.
Generate exactly 3 executive insights from the analytics data provided.
Each insight must be on its own line and start with exactly one of these prefixes:
TREND:
HIGHLIGHT:
ACTION:
Rules: plain text only, no markdown, no bullet points, no numbering, English only.
Keep each insight to one sentence (max 25 words).
Focus on month-over-month changes and recent trends, not just all-time totals.
Today's date is ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`,
			messages: [{ role: 'user', content: analyticsContext }],
		});

		for await (const chunk of stream) {
			if (
				chunk.type === 'content_block_delta' &&
				chunk.delta.type === 'text_delta'
			) {
				const text = chunk.delta.text;
				fullText += text;
				res.write(`data: ${JSON.stringify({ text })}\n\n`);
			}
		}

		dailyGenerationCount++;
		console.log(
			`[AI Summary] Daily generations used: ${dailyGenerationCount}/${DAILY_GENERATION_LIMIT}`,
		);
		aiSummaryCache[year] = { text: fullText, cachedAt: Date.now() };
		res.write('data: [DONE]\n\n');
		res.end();
	} catch (err) {
		console.error('[AI Summary] Error:', err);
		if (!res.headersSent) {
			res.status(500).json({ error: 'AI summary generation failed' });
		} else {
			res.write('data: [ERROR]\n\n');
			res.end();
		}
	}
};
