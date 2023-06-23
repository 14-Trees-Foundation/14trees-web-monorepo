const routes = require('express').Router();
const template = require('../controllers/templateController');

routes.post('/', template.getTemplate);

module.exports = routes;