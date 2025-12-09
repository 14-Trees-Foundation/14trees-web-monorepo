const AnalyticsSeeder = require('./analyticsSeeder');
// Import other seeders as they are created
// const UsersSeeder = require('./usersSeeder');
// const TreesSeeder = require('./treesSeeder');

class SeederFactory {
  static getSeeder(controllerName) {
    switch (controllerName.toLowerCase()) {
      case 'analytics':
        return new AnalyticsSeeder();
      
      // Add more seeders as needed
      // case 'users':
      //   return new UsersSeeder();
      // case 'trees':
      //   return new TreesSeeder();
      
      default:
        throw new Error(`No seeder found for controller: ${controllerName}`);
    }
  }

  static async withSeeder(controllerName, testFunction) {
    const seeder = this.getSeeder(controllerName);
    
    try {
      // Setup data before test
      const testData = await seeder.setup();
      
      // Run the test function with the test data
      await testFunction(testData, seeder);
      
    } finally {
      // Always cleanup, even if test fails
      try {
        await seeder.teardown();
      } finally {
        await seeder.close();
      }
    }
  }
}

module.exports = SeederFactory;