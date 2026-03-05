import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/postgreDB';

export type PageVisitSection = 'profile' | 'dashboard';

interface TrackPageVisitParams {
  domain: string;
  pathname: string;
  section: PageVisitSection;
  url?: string | null;
  visitorId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface PageVisitTotalsRow {
  section: PageVisitSection;
  total_hits: string | number;
}

interface PageVisitTrackedUrlsRow {
  tracked_urls: string | number;
}

interface PageVisitTopUrlRow {
  pathname: string;
  section: PageVisitSection;
  hit_count: string | number;
}

class PageVisitsRepository {
  public static async trackPageVisit(params: TrackPageVisitParams): Promise<void> {
    const {
      domain,
      pathname,
      section,
      url = null,
      visitorId = null,
      ipAddress = null,
      userAgent = null,
    } = params;

    const transaction = await sequelize.transaction();

    try {
      // qualify table names with schema to avoid search_path issues
        const rawSchema = process.env.POSTGRES_SCHEMA || 'public';
        const schema = rawSchema.replace(/^['\"]+|['\"]+$/g, '');

      await sequelize.query(
        `
            INSERT INTO "${schema}"."dashboard_page_visit_totals" (domain, section, total_hits, updated_at)
          VALUES (:domain, :section, 1, NOW())
          ON CONFLICT (domain, section)
          DO UPDATE SET
              total_hits = "${schema}"."dashboard_page_visit_totals".total_hits + 1,
            updated_at = NOW()
        `,
        {
          replacements: { domain, section },
          type: QueryTypes.INSERT,
          transaction,
        }
      );

      await sequelize.query(
        `
            INSERT INTO "${schema}"."dashboard_page_visit_urls" (
            domain,
            pathname,
            section,
            hit_count,
            last_url,
            last_visitor_id,
            last_ip_address,
            last_user_agent,
            updated_at
          )
          VALUES (
            :domain,
            :pathname,
            :section,
            1,
            :url,
            :visitorId,
            :ipAddress,
            :userAgent,
            NOW()
          )
          ON CONFLICT (domain, pathname)
          DO UPDATE SET
              hit_count = "${schema}"."dashboard_page_visit_urls".hit_count + 1,
            section = EXCLUDED.section,
            last_url = EXCLUDED.last_url,
            last_visitor_id = EXCLUDED.last_visitor_id,
            last_ip_address = EXCLUDED.last_ip_address,
            last_user_agent = EXCLUDED.last_user_agent,
            updated_at = NOW()
        `,
        {
          replacements: {
            domain,
            pathname,
            section,
            url,
            visitorId,
            ipAddress,
            userAgent,
          },
          type: QueryTypes.INSERT,
          transaction,
        }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public static async getSummary(domain: string, topUrlsLimit: number = 5): Promise<{
    total_hits: number;
    profile_hits: number;
    dashboard_hits: number;
    tracked_urls: number;
    top_urls: Array<{ pathname: string; section: PageVisitSection; hit_count: number }>;
  }> {
    const totalsResp = await sequelize.query<PageVisitTotalsRow>(
      `
        SELECT section, total_hits
        FROM dashboard_page_visit_totals
        WHERE domain = :domain
      `,
      {
        replacements: { domain },
        type: QueryTypes.SELECT,
      }
    );

    const trackedUrlsResp = await sequelize.query<PageVisitTrackedUrlsRow>(
      `
        SELECT COUNT(*)::int AS tracked_urls
        FROM dashboard_page_visit_urls
        WHERE domain = :domain
      `,
      {
        replacements: { domain },
        type: QueryTypes.SELECT,
      }
    );

    const topUrlsResp = await sequelize.query<PageVisitTopUrlRow>(
      `
        SELECT pathname, section, hit_count
        FROM dashboard_page_visit_urls
        WHERE domain = :domain
        ORDER BY hit_count DESC, pathname ASC
        LIMIT :topUrlsLimit
      `,
      {
        replacements: { domain, topUrlsLimit },
        type: QueryTypes.SELECT,
      }
    );

    const profileHits = Number(totalsResp.find((row) => row.section === 'profile')?.total_hits || 0);
    const dashboardHits = Number(totalsResp.find((row) => row.section === 'dashboard')?.total_hits || 0);

    return {
      total_hits: profileHits + dashboardHits,
      profile_hits: profileHits,
      dashboard_hits: dashboardHits,
      tracked_urls: Number(trackedUrlsResp[0]?.tracked_urls || 0),
      top_urls: topUrlsResp.map((row) => ({
        pathname: row.pathname,
        section: row.section,
        hit_count: Number(row.hit_count || 0),
      })),
    };
  }
}

export default PageVisitsRepository;
