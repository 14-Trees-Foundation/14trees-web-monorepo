const routes = require("express").Router();
const images = require("../controllers/imageController");
const uploadImages = require("../helpers/multer");

routes.post(
  "/addmemories",
  uploadImages.array("files", 10),
  images.addMemories
);

module.exports = routes;
