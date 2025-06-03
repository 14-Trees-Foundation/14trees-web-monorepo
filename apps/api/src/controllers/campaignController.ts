import { Request, Response } from "express";
import { CampaignsRepository } from "../repo/campaignsRepo";
import { status } from "../helpers/status";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { FilterItem } from "../models/pagination";
import { SortOrder } from "../models/common";


export const createCampaign = async (req: Request, res: Response) => {

    const { name, c_key, description } = req.body;
    if (!name || !c_key) {
        return res.status(400).json({ error: "Name and campaign key are required" });
    }

    try {
        // First check if c_key already exists
        const existingCampaign = await CampaignsRepository.getCampaigns(0, 1, [{ columnField: 'c_key', operatorValue: 'equals', value: c_key }]);
        if (existingCampaign.results.length == 1) {
            return res.status(400).json({
                error: "Campaign with this key already exists"
            });
        }

        // If c_key is unique, proceed with creation
        const campaign = await CampaignsRepository.createCampaign(
            name,
            c_key,
            description,
        );

        return res.status(201).json(campaign);
    } catch (error: any) {
        console.error("[ERROR] CampaignsController::createCampaign", error);
        return res.status(status.error).json({
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
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    const orderBy: SortOrder[] = req.body?.order_by;

    try {
        const result = await CampaignsRepository.getCampaigns(offset, limit, filters, orderBy);

        res.status(status.success).send({
            offset: result.offset,
            total: Number(result.total),
            results: result.results
        });
    } catch (error: any) {
        console.error("[ERROR] CampaignsController::listCampaigns", error);
        res.status(status.error).json({
            status: status.error,
            message: 'Failed to list campaigns. Please try again after some time!',
        });
    }
}

export const updateCampaign = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateFields: string[] = req.body.updateFields; // Fields to update (mask)
    const updateData = req.body.data; // New data

    const campaignId = parseInt(id);
    if (isNaN(campaignId)) {
        return res.status(status.bad).json({
            message: 'Invalid campaign ID'
        });
    }

    if (!updateFields || !updateData) {
        return res.status(400).json({ message: "Invalid request format" });
    }

    // Build dynamic update object with only allowed fields
    const updateObject: Record<string, any> = {};
    updateFields.forEach((field) => {
        if (updateData[field] !== undefined) {
            updateObject[field] = updateData[field];
        }
    });

    try {
        // Update the campaign with only specified fields
        const updatedCampaign = await CampaignsRepository.updateCampaign(campaignId, updateObject);

        // Fetch the full updated campaign with joins (if needed)
        const result = await CampaignsRepository.getCampaigns(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: updatedCampaign.id }
        ]);

        res.status(status.success).json(
            result.results.length === 1 ? result.results[0] : updatedCampaign
        );
    } catch (error) {
        console.error("[ERROR] CampaignsController::updateCampaign:", error);
        res.status(status.error).json({
            message: 'Failed to update campaign'
        });
    }
};