import { status } from "../helpers/status";
import { Request, Response } from "express";
import { uploadBase64DataToS3 } from "./helper/uploadtos3";
import { TreesSnapshotRepository } from "../repo/treesSnapshotsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { TreesSnapshotCreationAttributes } from "../models/trees_snapshots";
import { isValidDateString } from "../helpers/utils";

/*
    Model - Tree Snapshots
    CRUD Operations for tree_snapshots collection
*/

export const getTreeSnapshots = async (req: Request, res: Response) => {
    const { sapling_id } = req.params;
    const {offset, limit } = getOffsetAndLimitFromRequest(req);

    try {
        let result = await TreesSnapshotRepository.getTreesSnapshots(offset, limit, [ { columnField: "sapling_id", operatorValue: "equals", value: sapling_id } ]);
        res.status(status.success).json(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const addTreeSnapshots = async (req: Request, res: Response) => {
    const { sapling_id, user_id, images } = req.body
    const userId = parseInt(user_id);
    if (!userId || isNaN(userId)) {
        console.log("[ERROR]", 'TreeSnapshots::addTreeSnapshots:', "missing user id", req.body)
        res.status(status.error).json({
            status: status.error,
            message: "User id is required",
        });
        return;
    }

    if (!sapling_id || sapling_id.length === 0) {
        console.log("[ERROR]", 'TreeSnapshots::addTreeSnapshots:', "missing sapling id", req.body)
        res.status(status.error).json({
            status: status.error,
            message: "Sapling id is required",
        });
        return;
    }

    try {
        const requests: TreesSnapshotCreationAttributes[] = []
        for (let image of images) {
            let imageUrl: string | null = null;
            if (image.data)  {
                const resp = await uploadBase64DataToS3(image.name, 'trees', image.data, null)
                if (resp.success) {
                    imageUrl = resp.location;
                } else {
                    console.log('[ERROR]', 'TreeSnapshots::addTreeSnapshots:', resp.error);
                }
            }

            let imageDate = new Date();
            if (!isValidDateString(image.image_date)) {
                imageDate = new Date();
            }
            requests.push({
                sapling_id: sapling_id,
                user_id: userId,
                image: imageUrl,
                image_date: imageDate,
                tree_status: image.tree_status,
                is_active: true,
                created_at: new Date()
            })
        }
        let result = await TreesSnapshotRepository.bulkAddTreesSnapshots(requests);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log('[ERROR]', 'TreeSnapshots::addTreeSnapshots:', error);
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const deleteTreeSnapshots = async (req: Request, res: Response) => {
    const { image_ids } = req.body
    try {
        await TreesSnapshotRepository.deleteTreeSnapshots(image_ids);
        res.status(status.success).send();
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}