import { Router } from "express";
import * as profile from "../controllers/profileController";
import uploadImages from "../helpers/multer";

const routes = Router();

routes.get("/", profile.getProfile);
routes.get("/id", profile.getProfileById);
routes.get("/userid", profile.getUserProfile);
routes.post(
  "/usertreereg",
  uploadImages.array("files", 12),
  profile.regUserTree
);
routes.post(
  "/usertreereg/multi",
  uploadImages.array("files", 12),
  profile.regMultiUserTree
);
routes.get("/update", profile.update);
routes.get("/allprofile", profile.getAllProfile);
routes.delete("/", profile.deleteProfile);

export default routes;
