import { Router } from 'express';
import * as utils from '../controllers/utilsController';

const routes = Router();

routes.get('/signedPutUrl', utils.getS3UploadSignedUrl);
routes.post('/scrap', utils.scrapImages);
routes.get('/s3keys/:request_id', utils.getImageUrlsForKeyPrefix);
routes.post('/gmail', utils.test);
routes.post('/donation', utils.handleDonationSheetRequests);

export default routes;