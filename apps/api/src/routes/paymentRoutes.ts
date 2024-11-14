import express from 'express';
import * as payment from '../controllers/paymentController';

const routes = express.Router();

routes.get('/:id', payment.getPayment);
routes.post('/', payment.createPayment);
routes.put('/:id', payment.updatePayment);
routes.delete('/:id', payment.deletePayment);

export default routes;
