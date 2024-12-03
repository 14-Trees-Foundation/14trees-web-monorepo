import { Request, Response } from "express";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { FilterItem } from "../models/pagination";
import { status } from "../helpers/status";
import { OrderRepository } from "../repo/ordersRepo";
import { OrderCreationAttributes } from "../models/order";



export const getOrders = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;

    try {
        const result = await OrderRepository.getOrders(offset, limit, filters);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "OrdersController::getOrders", error);
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time.',
        });
    }

}

export const createOrder = async (req: Request, res: Response) => {
    const { user_id, group_id, payment_id, trees_count, category, grove } = req.body;
    if (!user_id || !group_id || !payment_id || !trees_count) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        });
        return;
    }

    try {
        const data: OrderCreationAttributes = {
            user_id: user_id,
            group_id: group_id,
            payment_id: payment_id,
            trees_count: trees_count,
            category: category,
            grove: grove,
            created_at: new Date(),
            updated_at: new Date(),
        }

        const result = await OrderRepository.createOrder(data);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "OrdersController::createOrder", error);
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time.',
        });
    }
}

