// src/controllers/plot.controller.ts
import { FilterItem } from '../models/pagination';
import { AutoPrsReqPlotsRepository } from '../repo/autoPrsReqPlotRepo';
import { PlotRepository } from '../repo/plotRepo';
import { Request, Response } from 'express';

export const createPlot = async (req: Request, res: Response) => {
    try {
        const { plot_id, type } = req.body;

        // Validate input
        if (!plot_id || !type) {
            return res.status(400).json({ error: 'plot_id and type are required' });
        }

        if (type !== 'donation' && type !== 'gift') {
            return res.status(400).json({ error: 'type must be either "donation" or "gift"' });
        }

        // Create plot
        const newPlot = await AutoPrsReqPlotsRepository.createPlot({
            plot_id,
            type
            // Add other fields from req.body as needed
        });

        return res.status(201).json(newPlot);

    } catch (error) {
        console.error('Error creating plot:', error);
        return res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Failed to create plot' 
        });
    }
};

export const getPlotData = async (req: Request, res: Response) => {
    try {
        const { type } = req.query;

        if (type !== 'donation' && type !== 'gift') {
            return res.status(400).json({ error: 'Query param "type" must be "donation" or "gift"' });
        }

        // 1. Fetch plot records by type
        const autoPlots = await AutoPrsReqPlotsRepository.getPlots(type as 'donation' | 'gift');

        if (!autoPlots || autoPlots.length === 0) {
            return res.status(404).json({ message: 'No plots found for this type' });
        }

        // 2. Extract plot_ids
        const plotIds = autoPlots.map(p => p.plot_id);

        // 3. Prepare filters
        const filters: FilterItem[] = [
            {
                columnField: 'id',
                operatorValue: 'in',
                value: plotIds
            }
        ];

        // 4. Call PlotsRepository with required params
        const plotsData = await PlotRepository.getPlots(
            0,         // offset
            1000,      // limit (adjust if needed)
            filters,   // filters
            [{ column: 'id', order: 'ASC' }] // optional order
        );

        return res.status(200).json(plotsData);

    } catch (error) {
        console.error('Error fetching plot data:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch plot data'
        });
    }
};