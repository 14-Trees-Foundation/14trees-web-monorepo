const routes = require('express').Router();
const users = require('../controllers/usersController');
const { route } = require('./profileRoutes');

routes.post('/add', users.addUser);
routes.get('/', users.getUser);

module.exports = routes;