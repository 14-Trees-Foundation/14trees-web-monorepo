import { Request, Response } from 'express';
import { status } from '../helpers/status';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserRepository } from '../repo/userRepo';
import { getTokenPayload } from '../auth/verifyToken';
import { FilterItem } from '../models/pagination';
import { ViewPermissionRepository } from '../repo/viewPermissionsRepo';

dotenv.config();

const client = new OAuth2Client(process.env.CLIENT_ID);

interface CustomRequest extends Request {
    body: {
        token: string;
    };
}

export const signin = async (req: CustomRequest, res: Response) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,
        });

        const payload = ticket.getPayload() as TokenPayload;

        if (!payload) {
            res.status(status.error).json({
                status: status.error,
                message: 'Invalid token payload',
            });
            return;
        }

        const { email } = payload;
        if (email) {
            const user = await UserRepository.getUsers(0, 1, [{ columnField: 'email', operatorValue: 'equals', value: email }]);
            if (user.results.length === 0) {
                res.status(status.notfound).send();
                return;
            }
            const jwtToken = jwt.sign({ id: email }, process.env.SECRET_KEY as string, {
                expiresIn: 3660, // expires in 61 mins
            });
    
            res.status(201).json({
                user: user.results[0],
                token: jwtToken,
            });
        } else {
            throw new Error("email is empty or is undefined")
        }
    } catch (error: any) {
        console.log(error);
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
};


export const handleCorporateGoogleLogin = async (req: Request, res: Response) => {
    const { token } = req.body;

    let email: string | undefined;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,
        });

        const payload = ticket.getPayload() as TokenPayload;

        if (!payload) {
            res.status(status.error).json({
                status: status.error,
                message: 'Invalid token payload',
            });
            return;
        }

        email = payload.email;
    } catch (error: any) {
        return res.status(status.unauthorized).send({ success: false, message: error.message ? error.message : "You are not authorized!" }); 
    }

    if (!email) {
        return res.status(status.bad).send({
            success: false,
            message: "Email is required"
        });
    }

    try {

        const filters: FilterItem[] = [
            { columnField: "email", operatorValue: "equals", value: email }
        ];

        const userResponse = await UserRepository.getUsers(0, 1, filters);
        if (userResponse.total === 0) {
            return res.status(status.notfound).send({
                success: false,
                message: "User not found"
            });
        }

        const user = userResponse.results[0];
        const permissions = await ViewPermissionRepository.getViewUsers({ user_id: user.id });
        if (!permissions || permissions.length === 0) {
            return res.status(status.unauthorized).send({
                success: false,
                message: "User is not authorized for any views"
            });
        }

        const viewId = permissions[0].view_id;
        const view = await ViewPermissionRepository.getViewByPk(viewId);
        if (!view) {
            return res.status(status.notfound).send({
                success: false,
                message: "View not found"
            });
        }

        return res.status(status.success).send({
            success: true,
            view_id: view.view_id,
            path: view.path,
            name: view.name
        });

    } catch (error: any) {
        console.error("[ERROR] GoogleLoginController:", error);
        return res.status(status.error).send({
            success: false,
            message: "Failed to process Google login"
        });
    }
};