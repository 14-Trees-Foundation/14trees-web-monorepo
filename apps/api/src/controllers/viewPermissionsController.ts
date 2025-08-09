import { Request, Response } from "express";
import { status } from "../helpers/status";
import { ViewPermissionRepository } from "../repo/viewPermissionsRepo";
import { validate as isUUID, v7 as uuidv7 } from 'uuid'
import { ViewAttributes } from "../models/permissions";
import { Op } from "sequelize";
import { UserRepository } from "../repo/userRepo";


export const verifyUserAccessToView = async (req: Request, res: Response) => {
    const response = {
        code: status.forbidden,
        message: '',
        view_name: ''
    }

    const { view_id, user_id, metadata, path } = req.body;
    if (!view_id || !user_id || !isUUID(view_id)) {
        response.code = status.bad;
        response.message = "Page you are looking for doesn't exisits!";
        return res.status(status.success).send(response);
    }

    try {
        const view = await ViewPermissionRepository.getViewById(view_id);
        if (!view) {
            response.code = status.notfound;
            response.message = "Page you are looking for doesn't exisits!";
            return res.status(status.success).send(response);
        }

        response.code = status.success;
        response.message = "Success";
        response.view_name = view.name;

        const userResp = await UserRepository.getUsers(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: user_id }]);
        if (userResp.results.length === 0) {
            response.code = status.forbidden;
            response.message = "You are not authorized to access this page.";
            return res.status(status.success).send(response);
        }

        const user = userResp.results[0];
        if (user.roles && (user.roles.includes('admin') || user.roles.includes('super-admin'))) {
            return res.status(status.success).send(response);
        }

        const viewPermission = await ViewPermissionRepository.getUserPermissionByIds(view.id, user_id);
        if (!viewPermission || view.path !== path || (view.metadata && (!metadata || typeof metadata !== 'object'))) {
            response.code = status.forbidden;
            response.message = "You are not authorized to access this page.";
            return res.status(status.success).send(response);
        }

        if (metadata && view.metadata) {
            for (const [key, value] of Object.entries(metadata)) {
                if (view.metadata[key] !== value) {
                    response.code = status.forbidden;
                    response.message = "You are not authorized to access this page.";
                    return res.status(status.success).send(response);
                }
            }
        }

        return res.status(status.success).send(response);
    } catch (error: any) {
        console.log("[ERROR]", "ViewPermissionsController::verifyUserAccessToView", error);
        res.status(status.error).send({ message: "Something went wrong. Please try again later!" })
    }
}

export const verifyUserAccessByPath = async (req: Request, res: Response) => {
    const response = {
        code: status.forbidden,
        message: 'You are not authorized to access this page.',
        view_id: '',
        view_name: ''
    }

    const { user_id, path } = req.body;

    try {
        // Get view by path
        const view = await ViewPermissionRepository.getViewByPath(path);
        if (!view) {
            response.code = status.notfound;
            response.message = "Page doesn't exist";
            return res.status(status.success).send(response);
        }

        // Get all users with access to this view
        const viewPermissions = await ViewPermissionRepository.getViewUsers(view.id);

        // Check if user has access
        const hasAccess = viewPermissions.some(permission => permission.user_id === user_id);

        if (hasAccess) {
            response.code = status.success;
            response.message = "Success";
            response.view_id = view.view_id;
            response.view_name = view.name;
        }

        return res.status(status.success).send(response);

    } catch (error: any) {
        console.error("[ERROR] verifyUserAccessByPath:", error);
        return res.status(status.error).send({
            message: "Something went wrong"
        });
    }
}

export const getViewByPath = async (req: Request, res: Response) => {
    const path = req.query['path'] as string;
    if (!path) {
        return res.status(status.bad).send({ message: "Missing input params" })
    }
    
    try {
        const viewData = await ViewPermissionRepository.getViewByPath(path);
        res.status(status.success).send(viewData);
    } catch (error: any) {
        console.log("[ERROR]", "ViewPermissionsController::getViewByPath", error);
        res.status(status.error).send({ message: "Something went wrong. Please try again later!" })
    }
}

export const createNewView = async (req: Request, res: Response) => {
    const { name, path, users } = req.body;
    if (!name || !path) {
        return res.status(status.bad).send({ message: "Missing input params" })
    }
    
    try {
        const viewId = uuidv7().toString();
        const viewData = await ViewPermissionRepository.createView(viewId, name, path, null);

        if (users && users.length !== 0) {
            const userIds = users.map((user: any) => user.id);
            await ViewPermissionRepository.addViewUsers(viewData.id, userIds);
        }

        const view = await ViewPermissionRepository.getViewByPath(path);
        res.status(status.success).send(view);
    } catch (error: any) {
        console.log("[ERROR]", "ViewPermissionsController::createNewView", error);
        res.status(status.error).send({ message: "Something went wrong. Please try again later!" })
    }
}

export const updateView = async (req: Request, res: Response) => {
    const view: ViewAttributes = req.body;
    
    try {

        const updated = await ViewPermissionRepository.updateView(view);
        if (!updated) {
            return res.status(status.notfound).send({ message: "Request page not found!" })
        }

        const viewData = await ViewPermissionRepository.getViewByPath(updated.path);
        res.status(status.success).send(viewData);
    } catch (error: any) {
        console.log("[ERROR]", "ViewPermissionsController::updateView", error);
        res.status(status.error).send({ message: "Something went wrong. Please try again later!" })
    }
}

export const updateViewUsers = async (req: Request, res: Response) => {
    const { view_id } = req.body;
    const users: any[] = req.body.users;
    
    try {
        const view = await ViewPermissionRepository.getViewByPk(view_id);
        if (!view) {
            return res.status(status.notfound).send({ message: "Request page not found!" });
        }

        const exisiting = await ViewPermissionRepository.getViewUsers({ view_id: view.id });
        const removeList = exisiting.filter(item => !users.some(user => user.id === item.user_id));
        const addList = users.filter(item => !exisiting.some(user => user.user_id === item.id))
        
        if (removeList.length > 0) await ViewPermissionRepository.deleteViewUsers({ view_id: view.id, user_id: { [Op.in]: removeList.map(item => item.user_id)}});
        if (addList.length > 0) await ViewPermissionRepository.addViewUsers(view.id, addList.map(item => item.id));

        const viewData = await ViewPermissionRepository.getViewByPath(view.path);
        res.status(status.success).send(viewData);
    } catch (error: any) {
        console.log("[ERROR]", "ViewPermissionsController::updateViewUsers", error);
        res.status(status.error).send({ message: "Something went wrong. Please try again later!" })
    }
}

export const addViewUsers = async (req: Request, res: Response) => {
    const { view_id } = req.body;
    const users: any[] = req.body.users;
    
    try {
        const view = await ViewPermissionRepository.getViewByPk(view_id);
        if (!view) {
            return res.status(status.notfound).send({ message: "Request page not found!" });
        }

        const exisiting = await ViewPermissionRepository.getViewUsers({ view_id: view.id });
        const addList = users.filter(item => !exisiting.some(user => user.user_id === item.id));
        
        if (addList.length > 0) { await ViewPermissionRepository.addViewUsers(view.id, addList.map(item => item.id)) }

        const viewData = await ViewPermissionRepository.getViewByPath(view.path);
        res.status(status.success).send(viewData);
    } catch (error: any) {
        console.log("[ERROR]", "ViewPermissionsController::addViewUsers", error);
        res.status(status.error).send({ message: "Something went wrong. Please try again later!" });
    }
}

export const deleteViewUsers = async (req: Request, res: Response) => {
    const { view_id } = req.body;
    const users: any[] = req.body.users;
    
    try {
        const view = await ViewPermissionRepository.getViewByPk(view_id);
        if (!view) {
            return res.status(status.notfound).send({ message: "Request page not found!" });
        }

        const usersToDelete = users.map(user => user.id);
        
        if (usersToDelete.length > 0) {
            await ViewPermissionRepository.deleteViewUsers({ 
                view_id: view.id, 
                user_id: { [Op.in]: usersToDelete }
            });
        }

        const viewData = await ViewPermissionRepository.getViewByPath(view.path);
        res.status(status.success).send(viewData);
    } catch (error: any) {
        console.log("[ERROR]", "ViewPermissionsController::deleteViewUsers", error);
        res.status(status.error).send({ message: "Something went wrong. Please try again later!" });
    }
}
