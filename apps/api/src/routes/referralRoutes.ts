import express from 'express';
import * as referral from '../controllers/referralController';

const routes = express.Router();

routes.post('/', referral.createReferral);

export default routes;
