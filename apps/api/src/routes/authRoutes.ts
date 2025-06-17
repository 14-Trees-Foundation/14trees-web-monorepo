import express from 'express';
import { signin, handleCorporateGoogleLogin } from '../controllers/authController';

const routes = express.Router();

routes.post('/google', signin);
routes.post('/corporate', handleCorporateGoogleLogin);

export default routes;
