const routes = require('express').Router();
const auth = require('../controllers/authController');

routes.post('/google', auth.signin);

module.exports = routes;