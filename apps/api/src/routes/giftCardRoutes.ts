import { Router } from 'express';
import * as giftCards from '../controllers/giftCardController';
import uploadFiles from "../helpers/multer";

const routes = Router();

routes.post('/requests/get', giftCards.getGiftCardRequests);
routes.post('/requests', uploadFiles.fields([{name: 'logo', maxCount: 1 }, {name: 'csv_file', maxCount: 1}]), giftCards.createGiftCardRequest);
routes.put('/requests/:id', uploadFiles.fields([{name: 'logo', maxCount: 1 }, {name: 'csv_file', maxCount: 1}]), giftCards.updateGiftCardRequest);
routes.delete('/requests/:id', giftCards.deleteGiftCardRequest);
routes.post('/requests/clone', giftCards.cloneGiftCardRequest);
routes.post('/', giftCards.createGiftCards);
routes.get('/users/:gift_card_request_id', giftCards.getGiftRequestUsers);
routes.post('/users', giftCards.upsertGiftRequestUsers);
routes.post('/plots', giftCards.createGiftCardPlots);
routes.post('/book', giftCards.bookTreesForGiftRequest);
routes.post('/unbook', giftCards.unBookTrees);
routes.get('/trees/:gift_card_request_id', giftCards.getBookedTrees);
routes.post('/generate-template/', giftCards.generateGiftCardSlide);
routes.post('/update-template', giftCards.updateGiftCardTemplate);
routes.post('/card/redeem', giftCards.redeemGiftCard);
routes.post('/assign', giftCards.assignGiftRequestTrees);
routes.get('/generate/:gift_card_request_id', giftCards.generateGiftCardTemplatesForGiftCardRequest);
routes.get('/download/:gift_card_request_id', giftCards.downloadGiftCardTemplatesForGiftCardRequest);
routes.post('/email', giftCards.sendEmailForGiftCardRequest);
routes.post('/update-album/', giftCards.updateGiftCardRequestAlbum);
routes.post('/update-users/', giftCards.updateGiftCardUserDetails);
routes.get('/requests/tags', giftCards.getGiftRequestTags);
routes.get('/requests/fund-request/:gift_card_request_id', giftCards.generateFundRequest);
routes.post('/requests/gift-trees', giftCards.quickServeGiftRequest);

export default routes;

