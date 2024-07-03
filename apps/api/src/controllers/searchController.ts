import { Request, Response } from "express";
import { status } from "../helpers/status";
import { UserRepository } from "../repo/userRepo";


export const getAll = async (req: Request, res: Response): Promise<void> => {
    let key = req.query?.key?.toString();
    console.log("Search key", key)

    if (key === undefined || key === "") {
        res.status(status.bad).json({
            message: "Search value is required!",
        });
        return;
    }
    
    try {
        const data = await UserRepository.search(key);
        res.status(status.success).json({
            users: data,
            total_results: data.length,
        })
    } catch (error: any) {
        console.log("search getAll", JSON.stringify(error))
        res.status(status.error).json({
            message: "Failed to search users!",
        });
    }
}