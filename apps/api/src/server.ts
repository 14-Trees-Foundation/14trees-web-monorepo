import path from "path";
import express, { Request } from "express";
const morgan = require("morgan");
import mongoose from "mongoose";
import cors from "cors";
import swaggerUi from "swagger-ui-express"
import { readFileSync } from "fs"
import { MongoClient } from "mongodb";
import { getMongoDBConnectionString } from "./services/mongo";
const maxRequestSize = '50mb';
// Routes
import userRoutes from "./routes/userRoutes";
import treeRoutes from "./routes/treeRoutes";
import profileRoute from "./routes/profileRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import plotRoutes from "./routes/plotRoutes";
import activityRoutes from "./routes/activityRoutes";
import searchRoutes from "./routes/searchRoutes";
import eventRoutes from "./routes/eventRoutes";
import orgRoutes from "./routes/orgRoutes";
import loginRoutes from "./routes/loginRoutes";
import treesMappingRoutes from "./routes/treesMappingRoutes";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import templateRoutes from "./routes/templateRoute";
import contributionRoutes from "./routes/contributeRoutes";
import pondsRoutes from "./routes/pondsRoutes";
import imageRoutes from "./routes/imageRoutes";
import onSiteStaffRoutes from "./routes/onSiteStaffRoutes";
//appv2 route
import appV2Routes from "./routes/appV2Routes";

require("dotenv").config();

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
mongoose.Promise = global.Promise;

// Connect MongoDB
const connectDB = async () => {
  try {
    const mongo_connection_string = getMongoDBConnectionString();
    if (!mongo_connection_string) {
      throw new Error("MongoDB connection string is not provided");
    }
    const _client = new MongoClient(mongo_connection_string);
    await mongoose.connect(mongo_connection_string, { autoIndex: false });
  } catch (err: any) {
    console.error("Failed to connect to MongoDB - exiting", err.message);
    console.error(
      "Check if the MongoDB server is running and the connection string is correct."
    );
    process.exit(1);
  }
};

const port = process.env.SERVER_PORT ?? 8088;

const initExpressApp = (app: express.Application) => {
  console.log("Initializing Express App...");

  // log requests
  app.use(morgan("[:date[clf]] - :method :url - :status - :response-time ms"));

  app.use(express.static(path.join(__dirname, "client/build")));

  app.use(cors<Request>());
  // Add middleware for parsing JSON and urlencoded data and populating `req.body`
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json({ limit: maxRequestSize })); //added max Request Size 
  app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Pass to next layer of middleware
    next();
  });

  app.use("/api/templates", templateRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/trees", treeRoutes);
  app.use("/api/profile", profileRoute);
  app.use("/api/mytrees", treesMappingRoutes);
  app.use("/api/plots", plotRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/organizations", orgRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/activity", activityRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/login", loginRoutes);
  app.use("/api/auth", authRoutes);
  // app.use('/api/donations', donationRoutes);
  app.use("/api/contributions", contributionRoutes);
  app.use("/api/ponds", pondsRoutes);
  app.use("/api/images", imageRoutes);
  app.use("/api/onsitestaff", onSiteStaffRoutes);
  app.use("/api/appv2", appV2Routes); //app v2 route
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
  app.listen(port, function () {
    console.log("API Server listening on port " + port + "!");
  });

  return app;
};

const app = express();

const initServer = async () => {
  console.log("Connecting to MongoDB...");
  await connectDB();
  console.log("Connected to MongoDB");
  initExpressApp(app);
};

initServer();

export default app;