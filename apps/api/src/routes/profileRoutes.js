const routes = require('express').Router();
const profile = require('../controllers/profileController');
const uploadImages = require('../helpers/multer');

routes.get('/', profile.getProfile);
routes.get('/id', profile.getProfileById);
routes.get('/userid', profile.getUserProfile);
routes.post('/usertreereg', uploadImages.array('files', 12), profile.regUserTree);
routes.post('/usertreereg/multi', uploadImages.array('files', 12), profile.regMultiUserTree);
routes.get('/update', profile.update);
routes.get('/allprofile', profile.getAllProfile);
routes.delete('/', profile.deleteProfile);

module.exports = routes;