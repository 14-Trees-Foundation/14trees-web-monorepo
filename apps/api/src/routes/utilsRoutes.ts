import { Router } from 'express';
import * as utils from '../controllers/utilsController';

const routes = Router();

routes.get('/signedPutUrl', utils.getS3UploadSignedUrl);
routes.post('/scrap', utils.scrapImages);
routes.get('/s3keys/:request_id', utils.getImageUrlsForKeyPrefix);
routes.post('/donation', utils.handleDonationSheetRequests);
routes.post('/donation-revert', utils.handleRevertDonationSheetRequests);

export default routes;