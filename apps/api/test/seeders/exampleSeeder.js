const BaseSeeder = require('./baseSeeder');

// Example template for creating new controller-specific seeders
class ExampleSeeder extends BaseSeeder {
  constructor() {
    super();
    this.testData = null;
  }

  async setup() {
    console.log('🌱 Setting up example test data...');
    
    // Create controller-specific test data
    const users = await this.seedUsers([
      {
        name: 'Example User 1',
        email: 'example1@test.com',
        phone: '+1234567890'
      }
    ]);

    const plantTypes = await this.seedPlantTypes([
      {
        name: 'Example Plant',
        scientific_name: 'Exampleus testicus',
        image: '/images/example.jpg',
        tree_type: 'example'
      }
    ]);

    // Create any additional data specific to this controller
    const plots = await this.seedPlots([
      {
        name: 'Example Plot',
        boundary: 'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
        area: 50.25
      }
    ]);

    this.testData = {
      users,
      plantTypes,
      plots
    };

    console.log('✅ Example test data created');
    return this.testData;
  }

  async teardown() {
    console.log('🧹 Cleaning up example test data...');
    await this.cleanup();
    this.testData = null;
    console.log('✅ Example test data cleanup completed');
  }

  getTestData() {
    return this.testData;
  }
}

module.exports = ExampleSeeder;