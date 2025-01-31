require("dotenv").config();
import path from "path";
import express, { Request } from "express";
const morgan = require("morgan");
import cors from "cors";
import swaggerUi from "swagger-ui-express"
import { readFileSync } from "fs"

// Routes
import appV2Routes from "./routes/appv2Routes";
import userRoutes from "./routes/userRoutes";
import groupRoutes from "./routes/groupRoutes";
import userGroupRoutes from "./routes/userGroupRoutes";
import plantTypeRoutes from "./routes/plantTypeRoutes";
import treeRoutes from "./routes/treeRoutes";
import profileRoute from "./routes/profileRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import plotRoutes from "./routes/plotRoutes";
import siteRoutes from "./routes/siteRoutes";
import giftCardRoutes from "./routes/giftCardRoutes";
// import activityRoutes from "./routes/activityRoutes";
import searchRoutes from "./routes/searchRoutes";
import eventRoutes from "./routes/eventRoutes";
import orgRoutes from "./routes/orgRoutes";
// import loginRoutes from "./routes/loginRoutes";
import treesMappingRoutes from "./routes/treesMappingRoutes";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
// import templateRoutes from "./routes/templateRoute";
// import contributionRoutes from "./routes/contributeRoutes";
import pondsRoutes from "./routes/pondsRoutes";
// import imageRoutes from "./routes/imageRoutes";
import onSiteStaffRoutes from "./routes/onSiteStaffRoutes";
import albumRoutes from "./routes/albumRoutes";
import donationRoutes from "./routes/donationRoutes";
import visitRoutes from "./routes/visitRoutes";
import visitUserRoutes from "./routes/visitUsersRoutes";
import visitImageRoutes from "./routes/visitImageRoutes";
import treeSnapshotRoutes from "./routes/treeSnapshotRoutes";
import tagRoutes from "./routes/tagRoutes";
import { cleanUpGiftCardLiveTemplates, startAppV2ErrorLogsCronJob } from "./services/cron";
import utilsRoutes from "./routes/utilsRoutes";
import emailTemplateRoutes from "./routes/emailTemplateRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import whatsAppRoutes from "./routes/whatsAppRoutes";

let swaggerFile: any;
try {
  const data = readFileSync('src/swagger_output.json', 'utf8');
  swaggerFile = JSON.parse(data);
} catch (error) {
  console.error("Error reading swagger file:", error);
}

interface ResponseError extends Error {
  status?: number;
}

const port = process.env.SERVER_PORT ?? 8088;

const initExpressApp = (app: express.Application) => {
  console.log("Initializing Express App...");

  // log requests
  app.use(morgan("[:date[clf]] - :method :url - :status - :response-time ms"));

  app.use(express.static(path.join(__dirname, "client/build")));

  app.use(cors<Request>());
  // Add middleware for parsing JSON and urlencoded data and populating `req.body`
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json({ limit: '50mb' }));
  app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Pass to next layer of middleware
    next();
  });

  // app.use("/api/templates", templateRoutes);
  app.use("/api/appv2", appV2Routes);
  app.use("/api/users", userRoutes);
  app.use("/api/groups", groupRoutes);
  app.use("/api/user-groups", userGroupRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/trees", treeRoutes);
  app.use("/api/plant-types", plantTypeRoutes);
  app.use("/api/profile", profileRoute);
  app.use("/api/mapping", treesMappingRoutes);
  app.use("/api/plots", plotRoutes);
  app.use("/api/sites", siteRoutes);
  app.use("/api/gift-cards", giftCardRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/organizations", orgRoutes);
  app.use("/api/analytics", analyticsRoutes);
  // // app.use("/api/activity", activityRoutes);
  app.use("/api/search", searchRoutes);
  // app.use("/api/login", loginRoutes);
  app.use("/api/auth", authRoutes);
  app.use('/api/donations', donationRoutes);
  // app.use("/api/contributions", contributionRoutes);
  app.use("/api/ponds", pondsRoutes);
  // app.use("/api/images", imageRoutes);
  app.use("/api/onsitestaff", onSiteStaffRoutes);
  app.use("/api/albums", albumRoutes);
  app.use("/api/visits", visitRoutes );
  app.use("/api/visit-users/" , visitUserRoutes);
  app.use("/api/visit-images", visitImageRoutes );
  app.use("/api/tree-snapshots", treeSnapshotRoutes );
  app.use("/api/tags", tagRoutes );
  app.use("/api/utils", utilsRoutes );
  app.use("/api/email-templates", emailTemplateRoutes );
  app.use("/api/payments", paymentRoutes );
  app.use("/api/wa", whatsAppRoutes);

  // swagger doc
  if (swaggerFile) {
    app.use('/api/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))
  }

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    const err: ResponseError = new Error("Not Found");
    err["status"] = 404;
    next(err);
  });

  // @ts-ignore
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      error: {
        message: err.message,
      },
    });
  });
  app.listen(port, function() {
    console.log("API Server listening on port " + port + "!");
    
  });

  return app;
};

const app = express();

const initServer = async () => {
  // startAppV2ErrorLogsCronJob();
  // cleanUpGiftCardLiveTemplates();
  initExpressApp(app);
};

initServer();

export default app;