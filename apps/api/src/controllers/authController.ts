import { Request, Response } from 'express';
import { status } from '../helpers/status';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserRepository } from '../repo/userRepo';

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
