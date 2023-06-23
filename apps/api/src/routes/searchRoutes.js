const routes = require('express').Router();
const search = require('../controllers/searchController');

routes.get('/', search.getAll)

module.exports = routes;