#!/usr/bin/env node

const newman = require('newman');
const path = require('path');

// Configuration
const config = {
  collection: path.join(__dirname, 'Event-Associations-API.postman_collection.json'),
  environment: {
    values: [
      {
        key: 'baseUrl',
        value: process.env.API_BASE_URL || 'http://localhost:8088'
      }
    ]
  },
  reporters: ['cli', 'json'],
  reporter: {
    json: {
      export: path.join(__dirname, 'test-results', 'event-associations-test-results.json')
    }
  }
};

console.log('🚀 Starting Event Associations API Tests...');
console.log(`📍 Base URL: ${config.environment.values[0].value}`);
console.log(`📋 Collection: ${config.collection}`);
console.log('');

// Run Newman
newman.run(config, function (err, summary) {
  if (err) {
    console.error('❌ Newman run failed:', err);
    process.exit(1);
  }

  console.log('');
  console.log('📊 Test Summary:');
  console.log(`   Total Requests: ${summary.run.stats.requests.total}`);
  console.log(`   ✅ Passed: ${summary.run.stats.requests.total - summary.run.stats.requests.failed}`);
  console.log(`   ❌ Failed: ${summary.run.stats.requests.failed}`);
  console.log(`   ⏱️  Total Time: ${summary.run.timings.completed - summary.run.timings.started}ms`);

  if (summary.run.failures && summary.run.failures.length > 0) {
    console.log('');
    console.log('❌ Failed Tests:');
    summary.run.failures.forEach((failure, index) => {
      console.log(`   ${index + 1}. ${failure.source.name || 'Unknown'}`);
      console.log(`      Error: ${failure.error.message}`);
    });
    process.exit(1);
  }

  console.log('');
  console.log('🎉 All tests passed successfully!');
  process.exit(0);
});