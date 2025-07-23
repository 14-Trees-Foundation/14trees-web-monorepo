// import express from 'express';
// import { status } from '../helpers/status';
// import verifyToken from '../auth/verifyToken';
// import jwt, { Secret } from 'jsonwebtoken';

// const routes = express.Router();

// // Rest of the code...

// require('dotenv').config();
// const secret_key = process.env.SECRET_KEY ?? ""

// routes.post('/user', (req, res) => {
//     let username = req.body.params.username;
//     let password = req.body.params.password;
//     if (username === 'admin' && password === 'admin') {
//         const token = jwt.sign({ id: username }, secret_key, {
//             expiresIn: 86400 // expires in 24 hours
//         });
//         res.status(200).send({ auth: true, token: token });
//     } else {
//         res.status(status.unauthorized).send('Invalid credentials!');
//     }
// });

// routes.post('/verifytoken', verifyToken, (req, res) => {
//     res.status(200).send('Successful token verification');
// })

// export default routes;