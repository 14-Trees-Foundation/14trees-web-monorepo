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
        const { users, groups } = await UserRepository.search(key);
        res.status(status.success).json({
            users: users.map(item => ({
                id: item.id,
                name: item.name,
                type: 'user',
                sponsored_trees: Number(item.sponsored_trees),
                assigned_trees_count: Number(item.assigned_trees_count),
                profile_image: item.profile_image
            })),
            groups: groups.map(item => ({
                id: item.id,
                name: item.name,
                type: 'group',
                group_type: item.group_type,
                sponsored_trees: Number(item.sponsored_trees),
                profile_image: item.profile_image
            })),
            total_results: users.length + groups.length,
        })
    } catch (error: any) {
        console.log("search getAll", JSON.stringify(error))
        res.status(status.error).json({
            message: "Failed to search users and groups!",
        });
    }
}