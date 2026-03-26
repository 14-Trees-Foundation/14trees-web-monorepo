import cron from 'node-cron';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/postgreDB';

const schema = process.env.POSTGRES_SCHEMA || '14trees';
const giftCardViews = ['mv_gift_card_request_summary', 'mv_requester_leaderboard'];

async function refreshView(viewName: string): Promise<void> {
    const startTime = Date.now();

    try {
        await sequelize.query(
            `REFRESH MATERIALIZED VIEW "${schema}".${viewName}`,
            { type: QueryTypes.RAW }
        );
        console.log(`[MV] ✅ ${viewName} — ${Date.now() - startTime}ms`);
    } catch (error: any) {
        console.error(`[MV] ❌ Failed to refresh ${viewName}: ${error.message}`);
        console.error(`[MV]    Error name: ${error.name}`);
        if (error.original) console.error(`[MV]    DB error (${error.original.code}): ${error.original.message}`);
        if (error.sql) console.error(`[MV]    SQL: ${error.sql}`);
    }
}

async function refreshAll(views: string[]): Promise<void> {
    console.log(`[MV] Starting refresh for: ${views.join(', ')}`);

    for (const viewName of views) {
        await refreshView(viewName);
    }

    console.log('[MV] Refresh cycle complete after all done');
}

export async function refreshGiftCardViews(): Promise<void> {
    await refreshAll(giftCardViews);
}


export function initMaterializedViewJobs(): void {
    cron.schedule('0 */4 * * *', async () => {
        console.log('[MV] Frequent refresh triggered');
        await refreshGiftCardViews();
    });

    console.log('[MV] Materialized view refresh jobs scheduled ✅');
}

export { refreshAll, refreshView };
