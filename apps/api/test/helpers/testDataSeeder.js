// Legacy file - redirects to new seeder system
// This maintains backward compatibility while encouraging migration to new system

const { createTestData, cleanTestData } = require('../seeders');

module.exports = {
  createTestData,
  cleanTestData
};