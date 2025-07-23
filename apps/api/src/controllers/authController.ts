import { Request, Response } from 'express';
import { status } from '../helpers/status';
import { Logger } from '../helpers/logger';
import { auth, OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserRepository } from '../repo/userRepo';
import { FilterItem } from '../models/pagination';
import { ViewPermissionRepository } from '../repo/viewPermissionsRepo';
import { AuthService } from '../facade/authService';

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
            
            // Create JWT token
            const jwtToken = jwt.sign({ id: email }, process.env.SECRET_KEY as string, {
                expiresIn: 24 * 60 * 60,
            });
            
            // Save or update token in database
            const userId = user.results[0].id;
            const expiresInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            const authToken = await AuthService.upsertAuthToken(userId, jwtToken, expiresInMs);
            
            if (!authToken) {
                throw new Error("Failed to create authentication token");
            }

            let path = "";
            let view_id = "";
            const permissions = await ViewPermissionRepository.getViewUsers({ user_id: user.results[0].id });
            if (permissions.length > 0) {
                const viewId = permissions[0].view_id;
                const view = await ViewPermissionRepository.getViewByPk(viewId);
                if (view) {
                    view_id= view.view_id;
                    path = view.path;
                }
            }
    
            res.status(201).json({
                user: user.results[0],
                token: jwtToken,
                token_id: authToken.token_id,
                expires_at: new Date(authToken.expires_at).getTime(),
                view_id: view_id,
                path: path,
            });
        } else {
            throw new Error("email is empty or is undefined")
        }
    } catch (error: any) {
        await Logger.logError('authController', 'signin', error, req);
        res.status(status.error).send({ error: error });
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

        // Create JWT token
        const jwtToken = jwt.sign({ id: email }, process.env.SECRET_KEY as string, {
            expiresIn: 24 * 60 * 60,
        });
        
        // Save or update token in database
        const userId = user.id;
        const expiresInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const authToken = await AuthService.upsertAuthToken(userId, jwtToken, expiresInMs);
        
        if (!authToken) {
            throw new Error("Failed to create authentication token");
        }

        return res.status(status.success).send({
            success: true,
            view_id: view.view_id,
            path: view.path,
            name: view.name,
            token: jwtToken,
            expires_at: new Date(authToken.expires_at).getTime(),
            token_id: authToken.token_id
        });

    } catch (error: any) {
        console.error("[ERROR] GoogleLoginController:", error);
        return res.status(status.error).send({
            success: false,
            message: "Failed to process Google login"
        });
    }
};

/**
 * Validate a token_id and return user and JWT token if valid
 * This endpoint is used to validate short-lived token_ids and retrieve the main JWT token
 */
export const validateTokenId = async (req: Request, res: Response) => {
    const { token_id } = req.body;

    if (!token_id) {
        return res.status(status.bad).json({
            success: false,
            message: "token_id is required"
        });
    }

    try {
        // Find and validate the token using the token_id
        const authToken = await AuthService.authenticateWithTokenId(token_id);
        
        if (!authToken) {
            return res.status(status.unauthorized).json({
                success: false,
                message: "Invalid or expired token_id"
            });
        }

        // Get the user associated with the token
        const userId = authToken.user_id;
        const userResponse = await UserRepository.getUserById(userId);
        
        if (!userResponse) {
            return res.status(status.notfound).json({
                success: false,
                message: "User not found"
            });
        }

        // Return the user and JWT token
        return res.status(status.success).json({
            success: true,
            user: userResponse,
            token: authToken.token,
            expires_at: new Date(authToken.expires_at).getTime()
        });
    } catch (error: any) {
        console.error("[ERROR] ValidateTokenId:", error);
        return res.status(status.error).json({
            success: false,
            message: "Failed to validate token_id"
        });
    }
};