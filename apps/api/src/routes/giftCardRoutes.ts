import { Router } from 'express';
import * as giftCards from '../controllers/giftCardController';
import uploadFiles from "../helpers/multer";

const routes = Router();

routes.post('/get', giftCards.getGiftCards);
routes.post('/', uploadFiles.single('file'), giftCards.addGiftCard);
routes.put('/:id', giftCards.updateGiftCard);
routes.delete('/:id', giftCards.deleteGiftCard);
routes.post('/users', giftCards.createGiftCardUsers);
routes.post('/plots', giftCards.createGiftCardPlots);
routes.post('/book', giftCards.bookGiftCardTrees);
routes.get('/booked/:gift_card_id', giftCards.getBookedTrees);
routes.post('/card/', giftCards.generateGiftCardTemplateForSapling);
routes.post('/card/update', giftCards.updateGiftCardTemplate);
routes.post('/card/redeem', giftCards.redeemGiftCard);

export default routes;
