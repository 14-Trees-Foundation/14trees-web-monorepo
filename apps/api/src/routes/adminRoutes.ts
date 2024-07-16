import { addStaff  } from "../controllers/adminController";

const routes = require("express").Router();

// routes.get("/users/treelogging", admin.getTreeLoggingUsers);
routes.post("/users", addStaff);

export default routes;
