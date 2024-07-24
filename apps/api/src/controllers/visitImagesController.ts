import { status } from "../helpers/status";
import { Request, Response } from "express";
import { VisitRepository } from "../repo/visitsRepo";
import { VisitImagesRepository } from "../repo/visitImagesRepo";
import { VisitImageCreationAttributes } from "../models/visit_images";
import { uploadBase64DataToS3 } from "./helper/uploadtos3";

/*
    Model - Visit Images
    CRUD Operations for visit images collection
*/

export const getVisitImages = async (req: Request, res: Response) => {
    const { visit_id } = req.params;
    const visitId = parseInt(visit_id);
    if (!visitId || isNaN(visitId)) {
        res.status(status.error).json({
            status: status.error,
            message: "Visit Id is required",
        });
        return;
    }

    try {
        let result = await VisitImagesRepository.getVisitImages(0, 100, { visit_id: visitId });
        res.status(status.success).json(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const addVisitImages = async (req: Request, res: Response) => {
    const { visit_id, images } = req.body
    const visitId = parseInt(visit_id);
    if (!visitId || isNaN(visitId)) {
        res.status(status.error).json({
            status: status.error,
            message: "Visit Id is required",
        });
        return;
    }

    try {
        const resp = await VisitRepository.getVisits(0, 1, { id: visitId });
        if (!resp || resp.results.length === 0) {
            res.status(status.notfound).json({
                status: status.notfound,
                message: "Visit not found",
            });
            return;
        }
        const visit = resp.results[0];
        

        const requests: VisitImageCreationAttributes[] = []
        for (let image of images) {
            const resp = await uploadBase64DataToS3(image.name, 'visits', image.data, null, visit.visit_name)
            if (resp.success) {
                requests.push({
                    visit_id: visitId,
                    image_url: resp.location,
                    created_at: new Date()
                })
            } else {
                console.log('[ERROR]', 'VisitImages::addVisitImages:', resp.error);
            }
        }
        let result = await VisitImagesRepository.addVisitImages(requests);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}
