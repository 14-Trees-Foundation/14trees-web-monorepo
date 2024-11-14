
import { Request, Response } from "express";

import { status } from "../helpers/status";
import { PaymentRepository } from "../repo/paymentsRepo";
import { PaymentCreationAttributes } from "../models/payment";

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
        const request: PaymentCreationAttributes = {
            amount: data.amount,
            payment_method: data.payment_method || null,
            payment_received_date: data.payment_received_date || null,
            payment_proof: data.payment_proof || null,
            pan_number: data.pan_number || null,
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