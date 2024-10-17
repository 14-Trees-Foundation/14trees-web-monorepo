import { Router } from 'express';
import * as utils from '../controllers/utilsController';

const routes = Router();

routes.get('/s3/:requestId', utils.getS3UploadSignedUrl);
routes.post('/scrap', utils.scrapImages);
routes.get('/s3keys/:request_id', utils.getImageUrlsForKeyPrefix);

export default routes;