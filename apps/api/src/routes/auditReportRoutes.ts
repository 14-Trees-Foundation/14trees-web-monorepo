import { Router } from 'express';
import { getAuditReport } from '../controllers/auditReportController';

const routes = Router();

routes.post('/', getAuditReport);

export default routes;
