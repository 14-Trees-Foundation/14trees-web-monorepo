import { Request, Response, NextFunction } from 'express';
import { status } from '../helpers/status';
import { Center } from '../models/common';

interface TreeValidationError {
    field: string;
    message: string;
}

const validateLocation = (location: any): TreeValidationError | null => {
    if (!location || typeof location !== 'object') {
        return { field: 'location', message: 'Location is required and must be an object' };
    }
    
    const { lat, lng } = location;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        return { field: 'location', message: 'Location must contain valid lat and lng coordinates' };
    }
    
    if (lat < -90 || lat > 90) {
        return { field: 'location.lat', message: 'Latitude must be between -90 and 90' };
    }
    
    if (lng < -180 || lng > 180) {
        return { field: 'location.lng', message: 'Longitude must be between -180 and 180' };
    }
    
    return null;
};

const validateTreeStatus = (status: string): TreeValidationError | null => {
    const validStatuses = ['healthy', 'dead', 'lost'];
    if (status && !validStatuses.includes(status)) {
        return { 
            field: 'tree_status', 
            message: `Tree status must be one of: ${validStatuses.join(', ')}` 
        };
    }
    return null;
};

const validateSystemStatus = (status: string): TreeValidationError | null => {
    const validStatuses = ['system_invalidated', 'user_validated'];
    if (status && !validStatuses.includes(status)) {
        return { 
            field: 'status', 
            message: `System status must be one of: ${validStatuses.join(', ')}` 
        };
    }
    return null;
};

const validateTags = (tags: any): TreeValidationError | null => {
    if (tags && !Array.isArray(tags)) {
        return { field: 'tags', message: 'Tags must be an array' };
    }
    
    if (tags && tags.some((tag: string) => typeof tag !== 'string')) {
        return { field: 'tags', message: 'All tags must be strings' };
    }
    
    return null;
};

export const validateTreeCreation = (req: Request, res: Response, next: NextFunction) => {
    const errors: TreeValidationError[] = [];
    
    // Required fields
    if (!req.body.sapling_id) {
        errors.push({ field: 'sapling_id', message: 'Sapling ID is required' });
    }
    
    if (!req.body.plant_type_id) {
        errors.push({ field: 'plant_type_id', message: 'Plant type ID is required' });
    }
    
    if (!req.body.plot_id) {
        errors.push({ field: 'plot_id', message: 'Plot ID is required' });
    }
    
    // Validate location
    const locationError = validateLocation(req.body.location);
    if (locationError) {
        errors.push(locationError);
    }
    
    // Validate optional fields
    const treeStatusError = validateTreeStatus(req.body.tree_status);
    if (treeStatusError) {
        errors.push(treeStatusError);
    }
    
    const systemStatusError = validateSystemStatus(req.body.status);
    if (systemStatusError) {
        errors.push(systemStatusError);
    }
    
    const tagsError = validateTags(req.body.tags);
    if (tagsError) {
        errors.push(tagsError);
    }
    
    if (errors.length > 0) {
        return res.status(status.bad).json({
            status: status.bad,
            errors: errors
        });
    }
    
    next();
};

export const validateTreeUpdate = (req: Request, res: Response, next: NextFunction) => {
    const errors: TreeValidationError[] = [];
    
    // Validate location if provided
    if (req.body.location) {
        const locationError = validateLocation(req.body.location);
        if (locationError) {
            errors.push(locationError);
        }
    }
    
    // Validate tree status if provided
    if (req.body.tree_status) {
        const treeStatusError = validateTreeStatus(req.body.tree_status);
        if (treeStatusError) {
            errors.push(treeStatusError);
        }
    }
    
    // Validate system status if provided
    if (req.body.status) {
        const systemStatusError = validateSystemStatus(req.body.status);
        if (systemStatusError) {
            errors.push(systemStatusError);
        }
    }
    
    // Validate tags if provided
    if (req.body.tags) {
        const tagsError = validateTags(req.body.tags);
        if (tagsError) {
            errors.push(tagsError);
        }
    }
    
    if (errors.length > 0) {
        return res.status(status.bad).json({
            status: status.bad,
            errors: errors
        });
    }
    
    next();
}; 