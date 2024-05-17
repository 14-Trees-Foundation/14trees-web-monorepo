import { Router } from "express";
import * as profile from "../controllers/profileController";
import uploadImages from "../helpers/multer";

const routes = Router();

routes.get("/", profile.getProfile);
routes.get("/id", profile.getProfileById);
routes.get("/allprofile", profile.getAllProfile);
routes.get("/userid", profile.getUserProfile);
routes.delete("/", profile.deleteProfile);

routes.post("/usertreereg",uploadImages.array("files", 12),profile.assignTreeToUser);
routes.post("/usertreereg/multi",uploadImages.array("files", 12),profile.assignTreesToUser);

// not used
routes.get("/update", profile.update);

export default routes;
