import { 
    addStaff, 
    updateUserRole, 
    grantAdminRole, 
    revokeAdminRole, 
    getUserRoles, 
    getAllUsersWithRoles 
} from "../controllers/adminController";
import { verifyAdmin } from "../auth/verifyToken";

const routes = require("express").Router();

// Staff management
routes.post("/users", verifyAdmin, addStaff);

// Role management endpoints
routes.put("/users/:id/roles", verifyAdmin, updateUserRole);
routes.post("/users/:id/grant-admin", verifyAdmin, grantAdminRole);
routes.post("/users/:id/revoke-admin", verifyAdmin, revokeAdminRole);
routes.get("/users/:id/roles", verifyAdmin, getUserRoles);
routes.get("/users", verifyAdmin, getAllUsersWithRoles);

// routes.get("/users/treelogging", admin.getTreeLoggingUsers);

export default routes;
