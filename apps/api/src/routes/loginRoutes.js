const routes = require('express').Router();
const { status } = require('../helpers/status');
var jwt = require('jsonwebtoken');
const verifyToken = require('../auth/verifyToken');
require('dotenv').config();

routes.post('/user', (req, res) => {
    let username = req.body.params.username;
    let password = req.body.params.password;
    if (username === 'admin' && password === 'admin') {
        var token = jwt.sign({ id: username }, process.env.SECRET_KEY, {
            expiresIn: 86400 // expires in 24 hours
        });
        res.status(200).send({ auth: true, token: token });
    } else {
        res.status(status.unauthorized).send('Invalid credentials!');
    }
});

routes.post('/verifytoken', verifyToken, (req, res) => {
    res.status(200).send('Successful token verification');
})

module.exports = routes;