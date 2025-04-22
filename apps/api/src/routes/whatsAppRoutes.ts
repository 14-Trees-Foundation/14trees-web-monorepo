import { Router } from 'express';
import * as wa from '../controllers/whatsAppController'

const routes = Router();

routes.post('/incoming', wa.whatsAppBotWebHook);
routes.get('/incoming', wa.verifyWebHookConnection);
routes.post('/incoming-flow', wa.whatsAppFlowWebHook);

export default routes;