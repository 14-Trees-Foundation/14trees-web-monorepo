import { status } from "../helpers/status";
import { Request, Response } from "express";
import { SyncHistoriesRepository } from "../repo/syncHistoryRepo";
import { SyncHistoryCreationAttributes } from "../models/sync_history";

/*
    Model - Sync History
    CRUD Operations for sync_history table
*/

export const addSyncHistory = async (req: Request, res: Response) => {
    const { user_id, sync_info } = req.body
    const userId = parseInt(user_id);
    if (!userId || isNaN(userId)) {
        console.log('[ERROR', 'SyncHistoryController::addSyncHistory', 'Invalid userId:', userId)
        res.status(status.error).json({
            status: status.error,
            error: "User Id is required",
        });
        return;
    }

    try {
        const now = new Date();
        const request: SyncHistoryCreationAttributes = {
            trees: sync_info.trees,
            users: sync_info.users ? sync_info.users : null,
            tree_images: sync_info.tree_images,
            visit_images: sync_info.visit_images,
            upload_error: sync_info.upload_error,
            upload_time: sync_info.upload_time,
            synced_at: new Date(sync_info.synced_at),
            user_id: userId,
            created_at: now,
            updated_at: now,
        }
        
        let result = await SyncHistoriesRepository.addSyncHistory(request);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log('[ERROR', 'SyncHistoryController::addSyncHistory', error)
        res.status(status.error).json({
            status: status.error,
            error: "Something went wrong!"
        });
    }
}