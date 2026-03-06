/**
 * Global test bootstrap
 * Runs before all tests and handles setup/teardown
 */

import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
const envPath = path.join(__dirname, '../.env.test');
dotenv.config({ path: envPath });

// Force test environment
process.env.NODE_ENV = 'test';

/**
 * Global test setup
 */
before(async function () {
  // Increase timeout for test initialization
  this.timeout(15000);

  // Initialize database connection pool if needed
  // This will be called once before all tests run
  console.log('🧪 Test environment initialized');
  console.log(`📦 Database: ${process.env.POSTGRES_DB}`);
  console.log(`🔌 Host: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`);
});

/**
 * Global test teardown
 */
after(async function () {
  // Close any open connections
  // Clean up test data
  console.log('\n✅ All tests completed');
});

/**
 * Global error handler for unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});
