const routes = require('express').Router();
const orgs = require('../controllers/orgController');

routes.post('/add', orgs.addOrg);
routes.get('/', orgs.getOrg);

module.exports = routes;