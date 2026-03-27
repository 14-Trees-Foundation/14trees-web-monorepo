import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/postgreDB';
import { status } from '../helpers/status';
import { Logger } from '../helpers/logger';

const schema = process.env.POSTGRES_SCHEMA || '14trees';

const parseYearFilter = (value: unknown): number | null => {
    if (value === undefined || value === null) return null;
    const n = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);
    if (Number.isNaN(n) || n <= 0) return null;
    return n;
};

const parseTypeFilter = (value: unknown): 'personal' | 'corporate' | null => {
    if (typeof value !== 'string') return null;
    const v = value.trim().toLowerCase();
    if (v === 'personal') return 'personal';
    if (v === 'corporate') return 'corporate';
    return null;
};

const parseSourceFilter = (value: unknown): 'website' | 'manual' | null => {
    if (typeof value !== 'string') return null;
    const v = value.trim().toLowerCase();
    if (v === 'website') return 'website';
    if (v === 'manual') return 'manual';
    return null;
};

// Build WHERE clause for mv_donation_summary
function buildDonationWhere(year: number | null, type: 'personal' | 'corporate' | null, source: 'website' | 'manual' | null, replacements: Record<string, any>): string {
    const clauses: string[] = [];
    if (year !== null) {
        clauses.push('year = :year');
        replacements.year = year;
    }
    if (type === 'personal') {
        clauses.push('group_id IS NULL');
    } else if (type === 'corporate') {
        clauses.push('group_id IS NOT NULL');
    }
    if (source === 'website') {
        clauses.push("source_type = 'gift_card'");
    } else if (source === 'manual') {
        clauses.push("source_type = 'donation'");
    }
    return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
}

export const getDonationSummaryKPIs = async (req: Request, res: Response) => {
    try {
        const year = parseYearFilter(req.query.year);
        const type = parseTypeFilter(req.query.type);
        const source = parseSourceFilter(req.query.source);
        const currentYear = year ?? new Date().getFullYear();
        const replacements: Record<string, any> = {};
        const whereClause = buildDonationWhere(year, type, source, replacements);

        const prevYearReplacements: Record<string, any> = { ...replacements, prevYear: currentYear - 1 };

        const [current, previous] = await Promise.all([
            sequelize.query<any>(`
                SELECT
                    COUNT(*)::int AS total_donations,
                    COALESCE(SUM(amount_received), 0)::numeric AS total_amount,
                    COALESCE(SUM(trees_count), 0)::int AS total_trees,
                    COUNT(DISTINCT CASE WHEN group_id IS NOT NULL THEN 'g_' || group_id::text ELSE 'u_' || user_id::text END)::int AS active_donors,
                    CASE WHEN COUNT(*) > 0 THEN ROUND(AVG(amount_received)::numeric, 2) ELSE 0 END AS avg_donation,
                    COUNT(*) FILTER (WHERE trees_count IS NOT NULL AND trees_count > 0)::int AS with_trees_count,
                    COUNT(*) FILTER (WHERE (trees_count IS NULL OR trees_count = 0) AND amount_received > 0)::int AS monetary_only_count,
                    COALESCE(SUM(amount_received) FILTER (WHERE trees_count IS NULL OR trees_count = 0), 0)::numeric AS monetary_only_amount
                FROM "${schema}".mv_donation_summary
                ${whereClause}
            `, { type: QueryTypes.SELECT, replacements }),
            sequelize.query<any>(`
                SELECT
                    COUNT(*)::int AS total_donations,
                    COALESCE(SUM(amount_received), 0)::numeric AS total_amount,
                    COALESCE(SUM(trees_count), 0)::int AS total_trees,
                    COUNT(DISTINCT CASE WHEN group_id IS NOT NULL THEN 'g_' || group_id::text ELSE 'u_' || user_id::text END)::int AS active_donors
                FROM "${schema}".mv_donation_summary
                ${buildDonationWhere(year !== null ? currentYear - 1 : null, type, source, prevYearReplacements)}
            `, { type: QueryTypes.SELECT, replacements: prevYearReplacements }),
        ]);

        const cur = current[0] || {};
        const prev = previous[0] || {};
        const calcDelta = (c: number, p: number) => p > 0 ? Math.round(((c - p) / p) * 100) : null;
        const treeFulfillmentRate = cur.total_donations > 0
            ? Math.round((cur.with_trees_count / cur.total_donations) * 100)
            : 0;

        return res.status(status.success).json({
            success: true,
            data: {
                total_donations: cur.total_donations || 0,
                total_amount: parseFloat(cur.total_amount) || 0,
                total_trees: cur.total_trees || 0,
                active_donors: cur.active_donors || 0,
                avg_donation: parseFloat(cur.avg_donation) || 0,
                tree_fulfillment_rate: treeFulfillmentRate,
                monetary_only_count: cur.monetary_only_count || 0,
                monetary_only_amount: parseFloat(cur.monetary_only_amount) || 0,
                total_donations_delta: calcDelta(cur.total_donations, prev.total_donations),
                total_amount_delta: calcDelta(parseFloat(cur.total_amount), parseFloat(prev.total_amount)),
                total_trees_delta: calcDelta(cur.total_trees, prev.total_trees),
                active_donors_delta: calcDelta(cur.active_donors, prev.active_donors),
            },
        });
    } catch (error) {
        await Logger.logError('donationAnalyticsController', 'getDonationSummaryKPIs', error, req);
        return res.status(status.error).json({ success: false, error: 'Failed to fetch donation summary KPIs' });
    }
};

export const getDonationMonthly = async (req: Request, res: Response) => {
    try {
        const year = parseYearFilter(req.query.year) ?? new Date().getFullYear();
        const type = parseTypeFilter(req.query.type);
        const source = parseSourceFilter(req.query.source);
        const replacements: Record<string, any> = { year };
        const typeClauses: string[] = ['year = :year'];
        if (type === 'personal') typeClauses.push('group_id IS NULL');
        else if (type === 'corporate') typeClauses.push('group_id IS NOT NULL');
        if (source === 'website') typeClauses.push("source_type = 'gift_card'");
        else if (source === 'manual') typeClauses.push("source_type = 'donation'");

        const rows = await sequelize.query<any>(`
            SELECT
                m.month,
                TO_CHAR(TO_DATE(m.month::text, 'MM'), 'Mon') AS month_name,
                COALESCE(SUM(d.amount_received), 0)::numeric AS amount,
                COALESCE(SUM(d.trees_count), 0)::int AS trees,
                COUNT(d.source_id)::int AS donation_count
            FROM generate_series(1, 12) AS m(month)
            LEFT JOIN "${schema}".mv_donation_summary d
                ON d.month = m.month AND ${typeClauses.join(' AND ')}
            GROUP BY m.month
            ORDER BY m.month
        `, { type: QueryTypes.SELECT, replacements });

        return res.status(status.success).json({ success: true, data: rows });
    } catch (error) {
        await Logger.logError('donationAnalyticsController', 'getDonationMonthly', error, req);
        return res.status(status.error).json({ success: false, error: 'Failed to fetch monthly donations' });
    }
};

export const getDonationYearly = async (req: Request, res: Response) => {
    try {
        const type = parseTypeFilter(req.query.type);
        const source = parseSourceFilter(req.query.source);
        const replacements: Record<string, any> = {};
        const clauses: string[] = [];
        if (type === 'personal') clauses.push('group_id IS NULL');
        else if (type === 'corporate') clauses.push('group_id IS NOT NULL');
        if (source === 'website') clauses.push("source_type = 'gift_card'");
        else if (source === 'manual') clauses.push("source_type = 'donation'");
        const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

        const rows = await sequelize.query<any>(`
            SELECT
                year,
                COALESCE(SUM(amount_received), 0)::numeric AS amount,
                COALESCE(SUM(trees_count), 0)::int AS trees,
                COUNT(*)::int AS donation_count
            FROM "${schema}".mv_donation_summary
            ${whereClause}
            GROUP BY year
            ORDER BY year
        `, { type: QueryTypes.SELECT, replacements });

        return res.status(status.success).json({ success: true, data: rows });
    } catch (error) {
        await Logger.logError('donationAnalyticsController', 'getDonationYearly', error, req);
        return res.status(status.error).json({ success: false, error: 'Failed to fetch yearly donations' });
    }
};

export const getDonorLeaderboard = async (req: Request, res: Response) => {
    try {
        const sortBy = (req.query.sortBy as string) || 'amount';
        const limit = Math.min(parseInt(String(req.query.limit || '10'), 10), 10000);
        const year = parseYearFilter(req.query.year);
        const type = parseTypeFilter(req.query.type);
        const source = parseSourceFilter(req.query.source);
        const replacements: Record<string, any> = { limit };

        const orderCol = sortBy === 'trees' ? 'total_trees' : sortBy === 'frequency' ? 'total_donations' : 'total_amount';

        // Build a subquery filter on mv_donation_summary for year/source constraints
        const mvWhere: string[] = [];
        if (year !== null) { mvWhere.push('ds.year = :year'); replacements.year = year; }
        if (source === 'website') mvWhere.push("ds.source_type = 'gift_card'");
        else if (source === 'manual') mvWhere.push("ds.source_type = 'donation'");

        const mvFilter = mvWhere.length > 0 ? `AND ${mvWhere.join(' AND ')}` : '';

        // If year or source filter, recalculate from mv_donation_summary; otherwise use leaderboard MV
        let personalRows: any[], corporateRows: any[];

        if (year !== null || source !== null) {
            [personalRows, corporateRows] = await Promise.all([
                type !== 'corporate' ? sequelize.query<any>(`
                    SELECT
                        ds.user_id,
                        MAX(ds.donor_name) AS donor_name,
                        NULL::int AS group_id,
                        NULL::text AS group_name,
                        NULL::text AS group_type,
                        'personal' AS donor_type,
                        COUNT(*)::int AS total_donations,
                        SUM(ds.amount_received)::numeric AS total_amount,
                        COALESCE(SUM(ds.trees_count), 0)::int AS total_trees,
                        ROUND(AVG(ds.amount_received)::numeric, 2) AS avg_donation,
                        MIN(ds.donation_date) AS first_donation_at,
                        MAX(ds.donation_date) AS last_donation_at
                    FROM "${schema}".mv_donation_summary ds
                    WHERE ds.group_id IS NULL ${mvFilter}
                    GROUP BY ds.user_id
                    ORDER BY ${orderCol} DESC
                    LIMIT :limit
                `, { type: QueryTypes.SELECT, replacements }) : Promise.resolve([]),
                type !== 'personal' ? sequelize.query<any>(`
                    SELECT
                        NULL::int AS user_id,
                        NULL::text AS donor_name,
                        ds.group_id,
                        MAX(ds.group_name) AS group_name,
                        MAX(ds.group_type) AS group_type,
                        'corporate' AS donor_type,
                        COUNT(*)::int AS total_donations,
                        SUM(ds.amount_received)::numeric AS total_amount,
                        COALESCE(SUM(ds.trees_count), 0)::int AS total_trees,
                        ROUND(AVG(ds.amount_received)::numeric, 2) AS avg_donation,
                        MIN(ds.donation_date) AS first_donation_at,
                        MAX(ds.donation_date) AS last_donation_at
                    FROM "${schema}".mv_donation_summary ds
                    WHERE ds.group_id IS NOT NULL ${mvFilter}
                    GROUP BY ds.group_id
                    ORDER BY ${orderCol} DESC
                    LIMIT :limit
                `, { type: QueryTypes.SELECT, replacements }) : Promise.resolve([]),
            ]);
        } else {
            [personalRows, corporateRows] = await Promise.all([
                type !== 'corporate' ? sequelize.query<any>(`
                    SELECT * FROM "${schema}".mv_donor_leaderboard
                    WHERE donor_type = 'personal'
                    ORDER BY ${orderCol} DESC
                    LIMIT :limit
                `, { type: QueryTypes.SELECT, replacements }) : Promise.resolve([]),
                type !== 'personal' ? sequelize.query<any>(`
                    SELECT * FROM "${schema}".mv_donor_leaderboard
                    WHERE donor_type = 'corporate'
                    ORDER BY ${orderCol} DESC
                    LIMIT :limit
                `, { type: QueryTypes.SELECT, replacements }) : Promise.resolve([]),
            ]);
        }

        return res.status(status.success).json({
            success: true,
            data: { personal: personalRows, corporate: corporateRows },
        });
    } catch (error) {
        await Logger.logError('donationAnalyticsController', 'getDonorLeaderboard', error, req);
        return res.status(status.error).json({ success: false, error: 'Failed to fetch donor leaderboard' });
    }
};

export const getDonorProfile = async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const profileType = req.query.profileType === 'group' ? 'group' : 'user';
        const replacements: Record<string, any> = { id };

        if (Number.isNaN(id)) {
            return res.status(status.bad).json({ success: false, error: 'Invalid id' });
        }

        const whereId = profileType === 'group' ? 'group_id = :id' : 'user_id = :id';
        const [statsRows, recentRows] = await Promise.all([
            sequelize.query<any>(`
                SELECT
                    COUNT(*)::int AS total_donations,
                    COALESCE(SUM(amount_received), 0)::numeric AS total_amount,
                    COALESCE(SUM(trees_count), 0)::int AS total_trees,
                    ROUND(AVG(amount_received)::numeric, 2) AS avg_donation,
                    MIN(donation_date) AS first_donation_at,
                    MAX(donation_date) AS last_donation_at,
                    ARRAY_AGG(DISTINCT year ORDER BY year) AS years_active,
                    ARRAY_AGG(DISTINCT donation_method) FILTER (WHERE donation_method IS NOT NULL) AS payment_methods
                FROM "${schema}".mv_donation_summary
                WHERE ${whereId}
            `, { type: QueryTypes.SELECT, replacements }),
            sequelize.query<any>(`
                SELECT source_type, source_id, amount_received, trees_count, donation_date, donation_method, status, donor_name, group_name
                FROM "${schema}".mv_donation_summary
                WHERE ${whereId}
                ORDER BY donation_date DESC
                LIMIT 20
            `, { type: QueryTypes.SELECT, replacements }),
        ]);

        const stats = statsRows[0] || {};
        return res.status(status.success).json({
            success: true,
            data: { stats, recent_donations: recentRows },
        });
    } catch (error) {
        await Logger.logError('donationAnalyticsController', 'getDonorProfile', error, req);
        return res.status(status.error).json({ success: false, error: 'Failed to fetch donor profile' });
    }
};

export const getPaymentMethods = async (req: Request, res: Response) => {
    try {
        const year = parseYearFilter(req.query.year);
        const type = parseTypeFilter(req.query.type);
        const replacements: Record<string, any> = {};
        const clauses: string[] = ["source_type = 'donation'"]; // only donations have donation_method
        if (year !== null) { clauses.push('year = :year'); replacements.year = year; }
        if (type === 'personal') clauses.push('group_id IS NULL');
        else if (type === 'corporate') clauses.push('group_id IS NOT NULL');
        const whereClause = `WHERE ${clauses.join(' AND ')}`;

        const rows = await sequelize.query<any>(`
            SELECT
                COALESCE(donation_method, 'unknown') AS method,
                COUNT(*)::int AS count,
                COALESCE(SUM(amount_received), 0)::numeric AS total_amount
            FROM "${schema}".mv_donation_summary
            ${whereClause}
            GROUP BY donation_method
            ORDER BY count DESC
        `, { type: QueryTypes.SELECT, replacements });

        const total = rows.reduce((s: number, r: any) => s + r.count, 0);
        const data = rows.map((r: any) => ({
            ...r,
            pct: total > 0 ? Math.round((r.count / total) * 100) : 0,
        }));

        return res.status(status.success).json({ success: true, data });
    } catch (error) {
        await Logger.logError('donationAnalyticsController', 'getPaymentMethods', error, req);
        return res.status(status.error).json({ success: false, error: 'Failed to fetch payment methods' });
    }
};

export const getDonationTypeSplit = async (req: Request, res: Response) => {
    try {
        const year = parseYearFilter(req.query.year);
        const type = parseTypeFilter(req.query.type);
        const source = parseSourceFilter(req.query.source);
        const replacements: Record<string, any> = {};
        const whereClause = buildDonationWhere(year, type, source, replacements);

        const rows = await sequelize.query<any>(`
            SELECT
                SUM(CASE WHEN trees_count > 0 AND amount_received > 0 THEN 1 ELSE 0 END)::int AS both_count,
                SUM(CASE WHEN trees_count > 0 AND (amount_received IS NULL OR amount_received = 0) THEN 1 ELSE 0 END)::int AS trees_only_count,
                SUM(CASE WHEN (trees_count IS NULL OR trees_count = 0) AND amount_received > 0 THEN 1 ELSE 0 END)::int AS money_only_count,
                COUNT(*)::int AS total
            FROM "${schema}".mv_donation_summary
            ${whereClause}
        `, { type: QueryTypes.SELECT, replacements });

        const r = rows[0] || { both_count: 0, trees_only_count: 0, money_only_count: 0, total: 0 };
        const total = r.total || 1;
        return res.status(status.success).json({
            success: true,
            data: {
                both_count: r.both_count,
                trees_only_count: r.trees_only_count,
                money_only_count: r.money_only_count,
                total: r.total,
                both_pct: Math.round((r.both_count / total) * 100),
                trees_only_pct: Math.round((r.trees_only_count / total) * 100),
                money_only_pct: Math.round((r.money_only_count / total) * 100),
            },
        });
    } catch (error) {
        await Logger.logError('donationAnalyticsController', 'getDonationTypeSplit', error, req);
        return res.status(status.error).json({ success: false, error: 'Failed to fetch donation type split' });
    }
};

export const getDonationFrequency = async (req: Request, res: Response) => {
    try {
        const year = parseYearFilter(req.query.year);
        const type = parseTypeFilter(req.query.type);
        const replacements: Record<string, any> = {};
        const clauses: string[] = [];
        if (year !== null) { clauses.push('year = :year'); replacements.year = year; }
        if (type === 'personal') clauses.push('group_id IS NULL');
        else if (type === 'corporate') clauses.push('group_id IS NOT NULL');
        const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

        const rows = await sequelize.query<any>(`
            SELECT
                SUM(CASE WHEN cnt = 1 THEN 1 ELSE 0 END)::int AS once,
                SUM(CASE WHEN cnt BETWEEN 2 AND 3 THEN 1 ELSE 0 END)::int AS two_to_three,
                SUM(CASE WHEN cnt BETWEEN 4 AND 6 THEN 1 ELSE 0 END)::int AS four_to_six,
                SUM(CASE WHEN cnt >= 7 THEN 1 ELSE 0 END)::int AS seven_plus
            FROM (
                SELECT COALESCE(user_id::text, group_id::text) AS donor_key, COUNT(*) AS cnt
                FROM "${schema}".mv_donation_summary
                ${whereClause}
                GROUP BY donor_key
            ) t
        `, { type: QueryTypes.SELECT, replacements });

        return res.status(status.success).json({ success: true, data: rows[0] || {} });
    } catch (error) {
        await Logger.logError('donationAnalyticsController', 'getDonationFrequency', error, req);
        return res.status(status.error).json({ success: false, error: 'Failed to fetch donation frequency' });
    }
};

export const getRepeatDonorStats = async (req: Request, res: Response) => {
    try {
        const year = parseYearFilter(req.query.year);
        const type = parseTypeFilter(req.query.type);
        const replacements: Record<string, any> = {};
        const clauses: string[] = [];
        if (year !== null) { clauses.push('year = :year'); replacements.year = year; }
        if (type === 'personal') clauses.push('group_id IS NULL');
        else if (type === 'corporate') clauses.push('group_id IS NOT NULL');
        const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

        const rows = await sequelize.query<any>(`
            SELECT
                COUNT(*) FILTER (WHERE cnt > 1)::int AS repeat_donors,
                COUNT(*)::int AS total_donors,
                CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE cnt > 1)::numeric / COUNT(*)) * 100, 1) ELSE 0 END AS repeat_rate,
                ROUND(AVG(cnt)::numeric, 2) AS avg_lifetime_donations,
                ROUND(AVG(total_amt)::numeric, 2) AS avg_lifetime_value
            FROM (
                SELECT COALESCE(user_id::text, group_id::text) AS donor_key, COUNT(*) AS cnt, SUM(amount_received) AS total_amt
                FROM "${schema}".mv_donation_summary
                ${whereClause}
                GROUP BY donor_key
            ) t
        `, { type: QueryTypes.SELECT, replacements });

        return res.status(status.success).json({ success: true, data: rows[0] || {} });
    } catch (error) {
        await Logger.logError('donationAnalyticsController', 'getRepeatDonorStats', error, req);
        return res.status(status.error).json({ success: false, error: 'Failed to fetch repeat donor stats' });
    }
};
