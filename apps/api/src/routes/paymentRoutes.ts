import express from 'express';
import * as payment from '../controllers/paymentController';

const routes = express.Router();

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get payment details
 *     description: Fetches details of a specific payment by ID.
 *     tags:
 *       - Payments
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the payment
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Payment details fetched successfully
 *         schema:
 *           $ref: '#/definitions/Payment'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid payment id!"
 *       404:
 *         description: Payment not found
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Payment not found!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.get('/:id', payment.getPayment);


/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a new payment
 *     description: Creates a new payment record.
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for creating a new payment
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *               example: 1000.0
 *             donor_type:
 *               type: string
 *               example: "Individual"
 *             pan_number:
 *               type: string
 *               example: "ABCDE1234F"
 *             consent:
 *               type: boolean
 *               example: true
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         schema:
 *           $ref: '#/definitions/Payment'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Initial amount is required to create a payment!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/', payment.createPayment);


/**
 * @swagger
 * /payments:
 *   put:
 *     summary: Update payment
 *     description: Updates an existing payment record.
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for updating a payment
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Payment'
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *         schema:
 *           $ref: '#/definitions/Payment'
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.put('/:id', payment.updatePayment);
routes.delete('/:id', payment.deletePayment);


/**
 * @swagger
 * /payments/history:
 *   post:
 *     summary: Add payment history
 *     description: Adds a new payment history record.
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for adding a new payment history
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             payment_id:
 *               type: integer
 *               example: 1
 *             amount:
 *               type: number
 *               example: 1000.0
 *             payment_method:
 *               type: string
 *               example: "Credit Card"
 *             payment_proof:
 *               type: string
 *               example: "https://example.com/payment_proof.jpg"
 *     responses:
 *       200:
 *         description: Payment history added successfully
 *         schema:
 *           $ref: '#/definitions/PaymentHistory'
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/history', payment.addPaymentHistory);


/**
 * @swagger
 * /payments/history:
 *   put:
 *     summary: Update payment history
 *     description: Updates an existing payment history record.
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for updating a payment history
 *         required: true
 *         schema:
 *           $ref: '#/definitions/PaymentHistory'
 *     responses:
 *       200:
 *         description: Payment history updated successfully
 *         schema:
 *           $ref: '#/definitions/PaymentHistory'
 *       404:
 *         description: Payment history not found
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Payment history not found!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.put('/history/:id', payment.updatePaymentHistory);


/**
 * @swagger
 * /payments/verify:
 *   post:
 *     summary: Verify payment
 *     description: Verifies the legitimacy of a payment transaction.
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for verifying a payment
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             order_id:
 *               type: string
 *               example: "order_9A33XWu170gUtm"
 *             razorpay_payment_id:
 *               type: string
 *               example: "pay_29QQoUBi66xm2f"
 *             razorpay_signature:
 *               type: string
 *               example: "5b1e5c9e5f1e5c9e5f1e5c9e5f1e5c9e5f1e5c9e"
 *     responses:
 *       200:
 *         description: Transaction is legit
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Transaction is legit!"
 *       400:
 *         description: Transaction not legit
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Transaction not legit!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/verify/', payment.verifyPayment);


/**
 * @swagger
 * /payments/order-payments/{order_id}:
 *   get:
 *     summary: Get payments for order
 *     description: Fetches all payments associated with a specific order ID.
 *     tags:
 *       - Payments
 *     parameters:
 *       - name: order_id
 *         in: path
 *         description: ID of the order
 *         required: true
 *         type: string
 *         example: "order_9A33XWu170gUtm"
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "pay_29QQoUBi66xm2f"
 *               amount:
 *                 type: number
 *                 example: 1000.0
 *               currency:
 *                 type: string
 *                 example: "INR"
 *               status:
 *                 type: string
 *                 example: "captured"
 *               order_id:
 *                 type: string
 *                 example: "order_9A33XWu170gUtm"
 *               created_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-10-01T12:34:56Z"
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid order id!"
 *       404:
 *         description: Payment not found
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Payment not found!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.get('/order-payments/:order_id', payment.getPaymentsForOrder);

export default routes;
