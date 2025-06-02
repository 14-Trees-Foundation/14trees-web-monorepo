import express from 'express';
import * as referral from '../controllers/referralController';

const routes = express.Router();

routes.post('/', referral.createReferral);
routes.post('/details', referral.getReferralDetails);
routes.post('/referralname', referral.getUserNameByReferral);

export default routes;
