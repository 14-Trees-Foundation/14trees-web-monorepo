// const routes = require('express').Router();
// const donations = require('../controllers/donationController');

// // routes.post('/get', donations.updateTrees);
// routes.get('/', donations.getAllDonations);
// routes.get('/donor/:email', donations.getDonor);
// routes.get('/unassigned', donations.getAllUnassignedDonations);
// routes.get('/email/:email', donations.getDonationsForEmail);
// routes.get('/:id', donations.getDonationsById);
// routes.put('/:id/assign', donations.assignDonation);

// module.exports = routes;

import express from 'express';
import * as donations from '../controllers/donationsController';

const routes = express.Router();

routes.post('/getDonations', donations.getDonations);
routes.post('/add' , donations.addDonation);  //to add a new donation
routes.delete('/:id' , donations.deleteDonation);
routes.put('/:id' , donations.updateDonation);
export default routes;
