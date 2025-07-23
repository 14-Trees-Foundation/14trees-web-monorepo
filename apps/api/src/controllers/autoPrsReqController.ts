// src/controllers/plot.controller.ts
import { FilterItem } from '../models/pagination';
import { AutoPrsReqPlotsRepository } from '../repo/autoPrsReqPlotRepo';
import { PlotRepository } from '../repo/plotRepo';
import { Request, Response } from 'express';

export const addPlot = async (req: Request, res: Response) => {
    try {
        const { plot_ids, type } = req.body;

        if (!plot_ids || plot_ids.length === 0 || !type) {
            return res.status(400).json({ error: 'plot_id and type are required' });
        }

        if (type !== 'donation' && type !== 'gift') {
            return res.status(400).json({ error: 'type must be either "donation" or "gift"' });
        }

        // Create plot
        const newPlots = await AutoPrsReqPlotsRepository.addPlots({
            plot_ids,
            type
        });

        return res.status(201).json(newPlots);

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
        const { filters, order_by } = req.body;

        if (type !== 'donation' && type !== 'gift') {
            return res.status(400).json({ error: 'Query param "type" must be "donation" or "gift"' });
        }

        const autoPlots = await AutoPrsReqPlotsRepository.getPlots(type);

        if (!autoPlots || autoPlots.length === 0) {
            return res.status(404).json({ message: 'No plots found for this type' });
        }

        const plotIds = autoPlots.map(p => p.plot_id);

        const Allfilters: FilterItem[] = [
            {
                columnField: 'id',
                operatorValue: 'isAnyOf',
                value: plotIds
            }
        ];

        if (filters && Array.isArray(filters)) {
            Allfilters.push(...filters);
        }

        const plotsData = await PlotRepository.getPlots(
            0,
            plotIds.length,
            Allfilters,
            order_by
        );

        if (!order_by || order_by.length === 0) {
            let orderedPlots = plotIds.map(id => {
                return plotsData.results.find((plot: any) => plot.id === id);
            }).filter(plot => plot !== undefined);

            orderedPlots = orderedPlots.reverse()
            return res.status(200).json({
                results: orderedPlots,
                total: orderedPlots.length,
                offset: 0,
            });
        }

        return res.status(200).json(plotsData);

    } catch (error) {
        console.error('Error fetching plot data:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch plot data'
        });
    }
};

export const removePlot = async (req: Request, res: Response) => {
    try {
        const { plot_ids, type } = req.body;

        if (!plot_ids || plot_ids.length === 0 || !type) {
            return res.status(400).json({ error: 'plot_ids and type are required' });
        }

        if (type !== 'donation' && type !== 'gift') {
            return res.status(400).json({ error: 'type must be either "donation" or "gift"' });
        }

        // Remove plots
        const deletedCount = await AutoPrsReqPlotsRepository.removePlots({
            plot_ids,
            type
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: 'No plots found to remove for the specified criteria' });
        }

        return res.status(200).json({ 
            message: `Successfully removed ${deletedCount} plot(s)`,
            deletedCount 
        });

    } catch (error) {
        console.error('Error removing plots:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to remove plots'
        });
    }
};

export const removeAllPlots = async (req: Request, res: Response) => {
    try {
        const { type } = req.body;

        if (!type) {
            return res.status(400).json({ error: 'type is required' });
        }

        if (type !== 'donation' && type !== 'gift') {
            return res.status(400).json({ error: 'type must be either "donation" or "gift"' });
        }

        // Remove all plots for the type
        const deletedCount = await AutoPrsReqPlotsRepository.removeAllPlots(type);

        if (deletedCount === 0) {
            return res.status(404).json({ message: `No plots found to remove for type "${type}"` });
        }

        return res.status(200).json({ 
            message: `Successfully removed all ${deletedCount} plot(s) for type "${type}"`,
            deletedCount 
        });

    } catch (error) {
        console.error('Error removing all plots:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to remove all plots'
        });
    }
};