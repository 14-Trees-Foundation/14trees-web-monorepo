import { Request, Response } from "express";
import { TagRepository } from "../repo/tagRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { status } from "../helpers/status";

export const getTags = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);

    try {
        const result = await TagRepository.getTags(offset, limit, {});
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "TagsController::getTags", error)
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again later.',
        });
    }
};

export const createTags = async (req: Request, res: Response) => {
    const { tags }: { tags: any[] } = req.body;
    for (const item of tags) {
        if (!item.tag || (item.type !== 'SYSTEM_DEFINED' && item.type !== 'USER_DEFINED')) {
            res.status(status.bad).send({
                status: status.bad,
                message: 'Invalid input. please check tag value and type.',
            })
        }
    }

    try {
        const result = await TagRepository.createTags(tags);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "TagsController::createTags", error)
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again later.',
        });
    }
};