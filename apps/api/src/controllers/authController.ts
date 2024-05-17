import { Request, Response } from 'express';
import { errorMessage, successMessage, status } from '../helpers/status';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import StaffModel from '../models/onsitestaff';

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

        const { name, email, picture } = payload;

        const user = await StaffModel.findOne({ email: email });

        if (user === null) {
            res.status(status.notfound).send();
            return;
        }

        const jwtToken = jwt.sign({ id: email }, process.env.SECRET_KEY as string, {
            expiresIn: 3660, // expires in 61 mins
        });

        res.status(201).json({
            user: user,
            token: jwtToken,
        });
    } catch (error: any) {
        console.log(error);
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
};
