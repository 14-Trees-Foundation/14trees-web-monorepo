import { Request, Response } from "express";
import * as jwt from 'jsonwebtoken';

require('dotenv').config();

export function verifyToken(req: Request, res: Response, next: any) {
  next();
  // var token = req.headers['x-access-token'];
  // if (!token)
  //   return res.status(403).send({ auth: false, message: 'No token provided.' });

  // jwt.verify(token, process.env.SECRET_KEY, function (err, decoded) {
  //   if (err) {
  //     return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
  //   }
  //   next();
  // });
}

const tokenPayloadFromRequest = (req: Request, res: Response) => {
  let payload: any = null;
  const key = process.env.SECRET_KEY || 'secret';
  let token = req.headers['x-access-token'];
  if (!token) res.status(403).send({ auth: false, message: 'No token provided.' }); 
  else {
      jwt.verify(token as string, key, function (err: any, decoded: any) {
      if (err) {
        res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
      } else {
        payload = decoded;
      }
    });
  }

  return payload;
}

const isAdmin = (payload: any) => {
  return payload.roles.includes('admin');
}

const isTreeLogger = (payload: any) => {
  return payload.roles.includes('treelogging');
}
export function verifyAdmin(req: Request, res: Response, next: any) {
  const payload = tokenPayloadFromRequest(req, res);

  if (payload && isAdmin(payload)) {
    next();
  }
}

export function verifyTreeLogger(req: Request, res: Response, next: any) {
  const payload = tokenPayloadFromRequest(req, res);

  if (payload && (isTreeLogger(payload) || isAdmin(payload))) {
    next();
  }
}