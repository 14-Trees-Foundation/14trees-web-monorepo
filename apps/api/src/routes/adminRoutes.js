const routes = require('express').Router();
const admin = require('../controllers/adminController');

routes.get('/users/treelogging', admin.getTreeLoggingUsers);
routes.post('/users', admin.addStaff);

module.exports = routes;