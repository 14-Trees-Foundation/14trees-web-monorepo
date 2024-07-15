import express from 'express';
import * as donations from '../controllers/donationsController';

const routes = express.Router();

routes.post('/get', donations.getDonations);
routes.post('/' , donations.addDonation);
routes.delete('/:id' , donations.deleteDonation);
routes.put('/:id' , donations.updateDonation);

export default routes;
