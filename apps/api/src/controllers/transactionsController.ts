import { Request, Response } from "express";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { status } from "../helpers/status";
import { GRTransactionsRepository } from "../repo/giftRedeemTransactionsRepo";

export const getTransactions = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const { group_id } = req.params
    if (!group_id || isNaN(parseInt(group_id))) {
        return res.status(status.bad).send({ message: "Invalid request. Please provide valid group id!" })
    }

    try {
        let result = await GRTransactionsRepository.getDetailsTransactions(offset, limit, parseInt(group_id));
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}