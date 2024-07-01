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
        const parsedData = data.map((user: any) => {
            return {
                id: user.id,
                name: user.name,
                assigned_trees: user.assigned_trees?.map((tree: any) => {
                    let profileImage = ""
                    try {
                        const jsonStr = JSON.parse(tree.profile_image.replace(/'/g, '"'))
                        if (jsonStr && jsonStr.length > 0) {
                            profileImage = jsonStr[0]
                        }
                    } catch (error) {
                        console.log("profile image error", error, `| ${tree.profile_image} |`)
                    }
                    return {
                        sapling_id: tree.sapling_id,
                        assigned_at: tree.assigned_at,
                        profile_image: profileImage
                    }
                })
            }
        })
        res.status(status.success).json({
            users: parsedData,
            total_results: data.length,
        })
    } catch (error: any) {
        console.log("search getAll", JSON.stringify(error))
        res.status(status.error).json({
            message: "Failed to search users!",
        });
    }
}