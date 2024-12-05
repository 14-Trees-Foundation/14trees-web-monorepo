import express from 'express';
import * as donations from '../controllers/donationsController';

const routes = express.Router();

routes.post('/get', donations.getDonations);
routes.post('/' , donations.createDonation);
routes.delete('/:donation_id' , donations.deleteDonation);
routes.put('/:id' , donations.updateDonation);
routes.post('/work-order/:donation_id' , donations.createWorkOrder);
routes.post('/update-feedback' , donations.updateFeedback);
routes.post('/book-trees' , donations.bookTreesForDonation);
routes.get('/users/:donation_id' , donations.getDonationUsers);

export default routes;
