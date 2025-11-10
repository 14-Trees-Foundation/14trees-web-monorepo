import { Request, Response } from 'express';
import { TreesSnapshotRepository } from '../repo/treesSnapshotsRepo';
import { Logger } from '../helpers/logger';
import { status } from '../helpers/status';

export const getAuditReport = async (req: Request, res: Response) => {
  try {
    // Prefer POST body, fallback to query params for backward compatibility
    const body = req.body || {};
    const offset = Number(body.offset ?? req.query.offset ?? 0);
    const limit = Number(body.limit ?? req.query.limit ?? 20);
    let startDate = (body.startDate as string) || (req.query.startDate as string) || undefined;
    let endDate = (body.endDate as string) || (req.query.endDate as string) || undefined;
    let userId = (body.userId ?? req.query.userId) ? Number(body.userId ?? req.query.userId) : undefined;
    let plotId = (body.plotId ?? req.query.plotId) ? Number(body.plotId ?? req.query.plotId) : undefined;
    let siteId = (body.siteId ?? req.query.siteId) ? Number(body.siteId ?? req.query.siteId) : undefined;
    let search = (body.search as string) || (req.query.search as string) || undefined;
    const sortBy = (body.sortBy as string) || (req.query.sortBy as string) || undefined;
    const sortDir = ((body.sortDir as string) || (req.query.sortDir as string)) as 'asc' | 'desc' | undefined;

    // Support frontend-style `filters` array (optional). Map common filters to existing params.
    // Expected filter item: { columnField: string, operatorValue: string, value: any }
    const filters = Array.isArray(body.filters) ? body.filters : undefined;
    if (filters && filters.length > 0) {
      for (const f of filters) {
        const col = (f.columnField || '').toString();
        const op = (f.operatorValue || '').toString();
        const val = f.value;

        // normalize column names (accept snake_case and camelCase)
        const c = col.toLowerCase();

        if ((c === 'user_name' || c === 'username' || c === 'user') && (op === 'contains' || op === 'equals')) {
          // map to search on user/plot/site names
          search = String(val);
        } else if ((c === 'plot_name' || c === 'plotname' || c === 'plot') && (op === 'contains' || op === 'equals')) {
          search = String(val);
        } else if ((c === 'site_name' || c === 'sitename' || c === 'site') && (op === 'contains' || op === 'equals')) {
          search = String(val);
        } else if ((c === 'user_id' || c === 'userid') && (val || val === 0)) {
          userId = Number(val);
        } else if ((c === 'plot_id' || c === 'plotid') && (val || val === 0)) {
          plotId = Number(val);
        } else if ((c === 'site_id' || c === 'siteid') && (val || val === 0)) {
          siteId = Number(val);
        } else if ((c === 'audit_date' || c === 'image_date' || c === 'date') ) {
          // support between or equals
          if (op === 'between' && Array.isArray(val) && val.length >= 2) {
            startDate = String(val[0]);
            endDate = String(val[1]);
          } else if (op === 'equals' || op === 'is') {
            startDate = endDate = String(val);
          }
        } else if (c === 'search' && (val || val === '')) {
          search = String(val);
        }
      }
    }

    const resp = await TreesSnapshotRepository.getAuditReportPaginated({
      offset,
      limit,
      startDate,
      endDate,
      userId,
      plotId,
      siteId,
      search,
      sortBy,
      sortDir,
      filters: Array.isArray(body.filters) ? body.filters : undefined,
    });

    res.status(status.success).send(resp);
  } catch (error) {
    await Logger.logError('auditReportController', 'getAuditReport', error, req);
    res.status(status.error).send({ message: 'Failed to fetch audit report' });
  }
};
