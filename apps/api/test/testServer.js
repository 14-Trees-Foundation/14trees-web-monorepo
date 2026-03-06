require("dotenv").config({ path: "./.env.test" });
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const createTestApp = () => {
  const app = express();

  // Basic middleware
  app.use(morgan("[:date[clf]] - :method :url - :status - :response-time ms"));
  app.use(cors());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json({ limit: "50mb" }));

  // CORS headers
  app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });

  // Test-only routes that don't depend on database
  app.get("/test/health", (req, res) => {
    res.status(200).json({ 
      status: "OK", 
      message: "Test server is running",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database_disabled: process.env.DISABLE_DATABASE === 'true'
    });
  });

  // Import and use actual analytics routes to test real controller
  try {
    const analyticsRoutes = require("../src/routes/analyticsRoutes.ts").default;
    app.use("/api/analytics", analyticsRoutes);
    console.log("✅ Analytics routes loaded successfully");
  } catch (error) {
    console.warn("⚠️  Analytics routes failed to load, using mock fallback:", error.message);
  }

  // Mock some basic API routes for testing
  app.get("/api/v2/health", (req, res) => {
    res.status(200).json({ 
      status: "OK", 
      service: "14trees-api",
      version: "test",
      database: "mocked"
    });
  });

  // Mock API endpoints for basic testing
  app.get("/api/users", (req, res) => {
    res.status(200).json({ 
      success: true, 
      data: [
        { id: 1, name: "Test User 1", email: "test1@example.com" },
        { id: 2, name: "Test User 2", email: "test2@example.com" }
      ],
      message: "Mock user data"
    });
  });

  app.get("/api/trees", (req, res) => {
    res.status(200).json({ 
      success: true, 
      data: [
        { id: 1, species: "Test Tree 1", planted_date: "2023-01-01" },
        { id: 2, species: "Test Tree 2", planted_date: "2023-02-01" }
      ],
      message: "Mock trees data"
    });
  });

  app.get("/api/plots", (req, res) => {
    res.status(200).json({ 
      success: true, 
      data: [
        { id: 1, name: "Test Plot 1", area: 100 },
        { id: 2, name: "Test Plot 2", area: 150 }
      ],
      message: "Mock plots data"
    });
  });

  // Mock POST endpoints
  app.post("/api/users", (req, res) => {
    res.status(201).json({ 
      success: true, 
      data: { id: 999, ...req.body },
      message: "Mock user created"
    });
  });

  app.post("/api/trees", (req, res) => {
    res.status(201).json({ 
      success: true, 
      data: { id: 999, ...req.body },
      message: "Mock tree created"
    });
  });

  // Catch-all for unhandled routes
  app.use("*", (req, res) => {
    res.status(404).json({
      error: "Route not found",
      path: req.originalUrl,
      method: req.method,
      message: "This is a test server with limited mocked routes",
      available_routes: [
        "GET /test/health",
        "GET /api/v2/health", 
        "GET /api/users",
        "GET /api/trees",
        "GET /api/plots",
        "POST /api/users",
        "POST /api/trees"
      ]
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error("Test server error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
      stack: process.env.NODE_ENV === 'test' ? err.stack : undefined
    });
  });

  return app;
};

module.exports = createTestApp;