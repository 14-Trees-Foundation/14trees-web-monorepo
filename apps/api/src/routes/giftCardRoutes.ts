import { Router } from 'express';
import * as giftCards from '../controllers/giftCardController';
import uploadFiles from "../helpers/multer";

const routes = Router();

routes.post('/requests/get', giftCards.getGiftCardRequests);
routes.post('/requests', uploadFiles.fields([{name: 'logo', maxCount: 1 }, {name: 'csv_file', maxCount: 1}]), giftCards.createGiftCardRequest);
routes.put('/requests/:id', uploadFiles.fields([{name: 'logo', maxCount: 1 }, {name: 'csv_file', maxCount: 1}]), giftCards.updateGiftCardRequest);
routes.delete('/requests/:id', giftCards.deleteGiftCardRequest);
routes.post('/', giftCards.createGiftCards);
routes.post('/plots', giftCards.createGiftCardPlots);
routes.post('/book', giftCards.bookGiftCardTrees);
routes.get('/:gift_card_id', giftCards.getBookedTrees);
routes.post('/card/', giftCards.generateGiftCardTemplateForSapling);
routes.post('/card/update', giftCards.updateGiftCardTemplate);
routes.post('/card/redeem', giftCards.redeemGiftCard);
routes.post('/auto-assign', giftCards.autoAssignTrees);
routes.get('/generate/:gift_card_request_id', giftCards.generateGiftCardTemplatesForGiftCardRequest);
routes.get('/download/:gift_card_request_id', giftCards.downloadGiftCardTemplatesForGiftCardRequest);

export default routes;
