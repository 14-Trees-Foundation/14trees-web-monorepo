import { Router } from 'express';
import * as wa from '../controllers/whatsapp/whatsAppController'

const routes = Router();

routes.post('/incoming', wa.whatsAppWebHookController);
routes.get('/incoming', wa.verifyWebHookConnection);
routes.post('/incoming-flow', wa.webhookController);

export default routes;