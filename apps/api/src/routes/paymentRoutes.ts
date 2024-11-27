import express from 'express';
import * as payment from '../controllers/paymentController';

const routes = express.Router();

routes.get('/:id', payment.getPayment);
routes.post('/', payment.createPayment);
routes.put('/:id', payment.updatePayment);
routes.delete('/:id', payment.deletePayment);

routes.post('/history', payment.addPaymentHistory);
routes.put('/history/:id', payment.updatePaymentHistory);

routes.post('/verify/', payment.verifyPayment);
routes.get('/order-payments/:order_id', payment.getPaymentsForOrder);

export default routes;
