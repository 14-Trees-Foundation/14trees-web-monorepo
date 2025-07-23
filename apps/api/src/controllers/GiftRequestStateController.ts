import { Request, Response } from "express";
import { status } from "../helpers/status";
import { GiftRequestStatesRepository } from "../repo/GiftRequestStatesRepo";


export const getGiftRequestStates = async (req: Request, res: Response) => {
    const { gift_request_id } = req.params;
    const giftRequestId = parseInt(gift_request_id);
    if (isNaN(giftRequestId)) {
        res.status(status.bad).send({ message: "Please provide valid gift request id!" });
        return;
    }

    try {
        const giftRequestStates = await GiftRequestStatesRepository.getGiftRequestStates(giftRequestId);
        res.status(status.success).json(giftRequestStates);
    } catch (error: any) {
        console.log("[ERROR]", "GiftRequestStatesController::getGiftRequestStates:", error.message, JSON.stringify(req.body));
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again later.",
        });
    }
}

