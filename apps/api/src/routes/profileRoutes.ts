import { Router } from "express";
import * as profile from "../controllers/profileController";
import uploadFiles from "../helpers/multer";

const routes = Router();

routes.get("/", profile.getProfile);
routes.get("/id", profile.getProfileById);
routes.get("/allprofile", profile.getAllProfile);
routes.get("/userid", profile.getUserProfile);
routes.get("/user/:user_id", profile.getUserProfileByUserId);

routes.post("/usertreereg",uploadFiles.array("files", 12),profile.assignTreeToUser);
routes.post("/usertreereg/multi",uploadFiles.array("files", 12),profile.assignTreesToUser);
routes.post("/", profile.unassignTrees);
// routes.post("/assignBulk/:donation_id", profile.assignTreesBulk);

// not used
routes.get("/update", profile.update);

export default routes;
