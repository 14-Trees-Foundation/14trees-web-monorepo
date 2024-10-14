import { Router } from 'express';
import * as utils from '../controllers/utilsController';

const routes = Router();

routes.get('/s3/:requestId', utils.getS3UploadSignedUrl);

export default routes;