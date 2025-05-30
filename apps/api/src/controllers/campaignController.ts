import { Request, Response } from "express";
import { CampaignsRepository } from "../repo/campaignsRepo";
import { status } from "../helpers/status";



export const createCampaign = async (req: Request, res: Response) => {

    const { name, c_key, description } = req.body;
    if (!name || !c_key) {
        res.status(400).json({ error: "Name and campaign key are required" });
        return;
    }

    try {
        const campaign = await CampaignsRepository.createCampaign(
            name,
            c_key,
            description,
        );

        res.status(201).json(campaign);
    } catch (error: any) {
        console.error("[ERROR] CampaignsController::createCampaign", error);
        res.status(status.error).json({
            message: 'Failed to create campaign'
        });
    }
}