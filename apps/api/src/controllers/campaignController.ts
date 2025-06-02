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

export const getCampaignAnalytics = async (req: Request, res: Response) => {
    const { c_key } = req.params;

    if (!c_key) {
        return res.status(400).json({ error: "Campaign key (c_key) is required" });
    }

    try {
        // Get campaign summary data
        const summary = await CampaignsRepository.getCampaignSummary(c_key);
        
        // Get campaign champion data
        const champion = await CampaignsRepository.getCampaignChampion(c_key);

        // Combine both results into single response
        const response = {
            summary,
            champion
        };

        return res.status(200).json(response);
    } catch (error: any) {
        console.error("[ERROR] CampaignAnalyticsController::getCampaignAnalytics", error);
        return res.status(500).json({
            message: 'Failed to fetch campaign analytics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getReferralCounts = async (req: Request, res: Response) => {
    try {
        // Get referral counts data
        const counts = await CampaignsRepository.getReferralCounts();
        
        return res.status(200).json(counts);
    } catch (error: any) {
        console.error("[ERROR] ReferralsController::getReferralCounts", error);
        return res.status(500).json({
            message: 'Failed to fetch referral counts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getReferralDashboard = async (req: Request, res: Response) => {
    try {
        const { rfr } = req.params; // Extract referral code from URL
        
        // Validate referral code format (basic example)
        if (!rfr || typeof rfr !== 'string' || rfr.trim().length === 0) {
            return res.status(400).json({ 
                message: 'Invalid referral code format' 
            });
        }

        // Fetch referral dashboard data
        const dashboardData = await CampaignsRepository.getReferralDashboard(rfr);
        
        return res.status(200).json(dashboardData);
    } catch (error: any) {
        console.error("[ERROR] ReferralsController::getReferralDashboard", error);
        return res.status(500).json({
            message: 'Failed to fetch referral dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const listCampaigns = async (req: Request, res: Response) => {
    try {
        const campaigns = await CampaignsRepository.getCampaigns({});
        res.status(200).json(campaigns);
    } catch (error: any) {
        console.error("[ERROR] CampaignsController::listCampaigns", error);
        res.status(status.error).json({
            message: 'Failed to list campaigns'
        });
    }
}

