/* eslint-disable */
// Load test environment first
require("dotenv").config({ path: "./.env.test" });

// Import test server from test folder
const createTestApp = require('./testServer');

// Set globals for tests similar to coachdashboard-api
global.app = null;

before(async function () {
  this.timeout(60000);
  
  console.log("🧪 Starting test environment with real database...");
  
  try {
    global.app = createTestApp();
    console.log("✅ Test server started successfully");
    
    // Wait a bit for database connections to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (err) {
    console.error("❌ Failed to start test server:", err);
    throw err;
  }
});

after(function (done) {
  console.log("🛑 Shutting down test server...");
  done();
});