
import { Request, Response } from "express";
import CryptoJS from 'crypto-js';

import { status } from "../helpers/status";
import { PaymentRepository } from "../repo/paymentsRepo";
import { PaymentCreationAttributes } from "../models/payment";
import { PaymentHistoryCreationAttributes } from "../models/payment_history";
import RazorpayService from "../services/razorpay/razorpay";

export const getPayment = async (req: Request, res: Response) => {
    if (!req.params.id || isNaN(parseInt(req.params.id))) {
        res.status(status.bad).json({ message: 'Invalid payment id!' });
        return;
    }

    try {
        let result = await PaymentRepository.getPayment(parseInt(req.params.id))
        if (!result) {
            res.status(status.notfound).json({ message: 'Payment not found!' });
            return;
        }
        res.status(status.success).json(result);
    } catch (error) {
        console.log("[ERROR]", "PaymentController::getPayment", error);
        res.status(status.error).send({
            status: status.error,
            message: 'Something went wrong. Please try again later.',
        })
    }
}

export const createPayment = async (req: Request, res: Response) => {
    const data = req.body;
    if (!data.amount || data.amount <= 0) {
        res.status(status.bad).json({ message: 'Initial amount is required to create a payment!' });
        return;
    }

    try {

        let orderId: string | null = null;
        const razorpayService = new RazorpayService();
        if (data.amount <= 500000) {
            const amount = Math.max(data.amount/2000, 1);
            const order = await razorpayService.createOrder(amount, data.notes);
            if (!order) {
                res.status(status.error).send({
                    status: status.error,
                    message: 'Something went wrong. Please try again later.',
                })
                return;
            }
            orderId = order.id;
        }

        const request: PaymentCreationAttributes = {
            amount: data.amount,
            donor_type: data.donor_type || null,
            pan_number: data.pan_number || null,
            order_id: orderId,
            consent: data.consent || false,
            created_at: new Date(),
            updated_at: new Date(),
        };
        
        const result = await PaymentRepository.createPayment(request);
        res.status(status.created).json(result);

    } catch (error: any) {
        console.log("[ERROR]", "PaymentController::createPayment", error);
        res.status(status.error).send({
            status: status.error,
            message: 'Something went wrong. Please try again later.',
        })
    }
}


export const updatePayment = async (req: Request, res: Response) => {
    try {
        let result = await PaymentRepository.updatePayment(req.body)
        res.status(status.success).json(result);
    } catch (error) {
        console.log("[ERROR]", "PaymentController::updatePayment", error);
        res.status(status.error).send({
            status: status.error,
            message: 'Something went wrong. Please try again later.',
        })
    }
}


export const deletePayment = async (req: Request, res: Response) => {
    if (!req.params.id || isNaN(parseInt(req.params.id))) {
        res.status(status.bad).json({ message: 'Invalid payment id!' });
        return;
    }

    try {
        await PaymentRepository.deletePayment(parseInt(req.params.id));
        res.status(status.success).json({
            message: "Payment deleted successfully",
        });

    } catch (error: any) {
        console.log("[ERROR]", "PaymentController::deletePayment", error);
        res.status(status.error).send({
            status: status.error,
            message: 'Something went wrong. Please try again later.',
        })
    }
}

export const addPaymentHistory = async (req: Request, res: Response) => {
    try {

        const data: PaymentHistoryCreationAttributes = {
            payment_id: req.body.payment_id,
            amount: req.body.amount,
            payment_method: req.body.payment_method,
            payment_proof: req.body.payment_proof || null,
            amount_received: req.body.amount,
            payment_date: new Date(),
            payment_received_date: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
        } 
        let result = await PaymentRepository.createPaymentHistory(data);
        res.status(status.success).json(result);
    } catch (error) {
        console.log("[ERROR]", "PaymentController::addPaymentHistory", error);
        res.status(status.error).send({
            status: status.error,
            message: 'Something went wrong. Please try again later.',
        })
    }
}

export const updatePaymentHistory = async (req: Request, res: Response) => {
    try {

        const history = await PaymentRepository.getPaymentHistory(req.body.id);
        if (!history) {
            res.status(status.notfound).json({ message: 'Payment history not found!' });
            return;
        }

        let result = await history.update(req.body);
        res.status(status.success).json(result);
    } catch (error) {
        console.log("[ERROR]", "PaymentController::updatePaymentHistory", error);
        res.status(status.error).send({
            status: status.error,
            message: 'Something went wrong. Please try again later.',
        })
    }
}

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const razorpay = new RazorpayService();
        if (razorpay.verifySignature(req.body.order_id, req.body.razorpay_payment_id, req.body.razorpay_signature)) {
            res.status(status.bad).json({ message: 'Transaction not legit!' });
            return;
        }
        res.status(status.success).json({ message: 'Transaction is legit!' });
    } catch (error) {
        console.log("[ERROR]", "PaymentController::verifyPayment", error);
        res.status(status.error).send({
            status: status.error,
            message: 'Something went wrong. Please try again later.',
        })
    }
}

export const getPaymentsForOrder = async (req: Request, res: Response) => {
    if (!req.params.order_id) {
        res.status(status.bad).json({ message: 'Invalid order id!' });
        return;
    }
    try {
        const razorpay = new RazorpayService();
        const payments = await razorpay.getPayments(req.params.order_id);
        if (!payments) {
            res.status(status.notfound).json({ message: 'Payment not found!' });
            return;
        }
        res.status(status.success).json(payments);
    } catch (error) {
        console.log("[ERROR]", "PaymentController::getPaymentsForOrder", error);
        res.status(status.error).send({
            status: status.error,
            message: 'Something went wrong. Please try again later.',
        })
    }
}