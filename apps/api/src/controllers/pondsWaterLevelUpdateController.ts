import { Request, Response } from "express";
import { PondWaterLevelRepository } from "../repo/pondWaterLavelRepo";
import { status } from "../helpers/status";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Pond } from "../models/pond";
import { PondWaterLevelAttributes } from "../models/pond_water_level";

export const addPondWaterLevelUpdate = async (req: Request, res: Response) => {

    try {
        if (!req.body.pond_id) {
            throw new Error("Pond id is required");
        } else if (!req.body.level_ft && isNaN(parseFloat(req.body.level_ft))) {
            throw new Error("Pond level is required");
        } else if (!req.body.user_id) {
            throw new Error("User id is required");
        }
    } catch (error: any) {
        console.error("addPondWaterLevelUpdate:", error.message, JSON.stringify(req.body));
        res.status(status.bad).send({ message: error.message });
        return;
    }

    try {
        let result = await PondWaterLevelRepository.addPondWaterLevelUpdate(req.body, req.files as Express.Multer.File[]);
        res.status(status.created).json(result);
    } catch (error: any) {
        console.error("addPondWaterLevelUpdate:", error.message, JSON.stringify(req.body));
        console.error(error.stack);
        res.status(status.error).json({ message: "Something went wrong!" });
    }
}


export const getPondWaterLevelUpdates = async (req: Request, res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    const { pond_id } = req.params;
    if (isNaN(parseInt(pond_id))) {
        res.status(status.bad).send({ message: "Pond id is required" });
        return;
    }
    try {
        let result = await PondWaterLevelRepository.getPondWaterLevelUpdates(parseInt(pond_id), offset, limit);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.error("getPondWaterLevelUpdates:", error.message, JSON.stringify(req.body));
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const updatePondWaterLevelEntry = async (req: Request, res: Response) => {
    const body: PondWaterLevelAttributes = req.body;
    const { id } = req.params;
    if (isNaN(parseInt(id))) {
        res.status(status.bad).send({ message: "Pond water level id is required" });
        return;
    }
    body.id = parseInt(id);

    try {

        const pond = await Pond.findByPk(body.pond_id);
        if (!pond) {
            throw new Error("Pond not found");
        }

        let result = await PondWaterLevelRepository.updatePondWaterLevelEntry(body, pond.name, req.files as Express.Multer.File[]);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.error("updatePondWaterLevelEntry:", error.message, JSON.stringify(req.body));
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const deletePondWaterLevelUpdate = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (isNaN(parseInt(id))) {
        res.status(status.bad).send({ message: "Pond water level id is required" });
        return;
    }
    try {
        let result = await PondWaterLevelRepository.deletePondWaterLevelUpdate(parseInt(id));
        res.status(status.success).send(result);
    } catch (error: any) {
        console.error("deletePondWaterLevelUpdate:", error.message, id);
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}
