// Export all seeders and factory for easy access
module.exports = {
  SeederFactory: require('./seederFactory'),
  BaseSeeder: require('./baseSeeder'),
  AnalyticsSeeder: require('./analyticsSeeder')
  // Add more seeders as they are created
};

// Helper function for backward compatibility
module.exports.createTestData = async function() {
  const { AnalyticsSeeder } = module.exports;
  const seeder = new AnalyticsSeeder();
  
  try {
    console.log('⚠️  Using legacy createTestData - consider migrating to SeederFactory');
    const data = await seeder.setup();
    // Don't auto-cleanup in legacy mode
    return data;
  } catch (error) {
    await seeder.close();
    throw error;
  }
};

module.exports.cleanTestData = async function() {
  const { AnalyticsSeeder } = module.exports;
  const seeder = new AnalyticsSeeder();
  
  try {
    console.log('⚠️  Using legacy cleanTestData - consider migrating to SeederFactory');
    await seeder.teardown();
  } finally {
    await seeder.close();
  }
};