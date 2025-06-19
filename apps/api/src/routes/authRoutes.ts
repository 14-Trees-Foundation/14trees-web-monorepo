import express from 'express';
import { signin, handleCorporateGoogleLogin, validateTokenId } from '../controllers/authController';

const routes = express.Router();

routes.post('/google', signin);
routes.post('/corporate', handleCorporateGoogleLogin);
routes.post('/validate-token', validateTokenId);

export default routes;
