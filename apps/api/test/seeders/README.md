# Test Data Seeders

This directory contains modular data seeders for different controllers, providing isolated test data management.

## Structure

- `baseSeeder.js` - Base class with common seeding functionality
- `analyticsSeeder.js` - Analytics controller specific seeder
- `seederFactory.js` - Factory for getting controller-specific seeders
- `index.js` - Main exports and backward compatibility

## Usage

### New Seeder System (Recommended)

```javascript
const { SeederFactory } = require('../seeders');

// Method 1: Using SeederFactory helper (automatic cleanup)
await SeederFactory.withSeeder('analytics', async (testData, seeder) => {
  // Your tests here - data is automatically cleaned up after
  expect(testData.users).to.have.length(2);
});

// Method 2: Manual seeder management
const seeder = SeederFactory.getSeeder('analytics');
try {
  const testData = await seeder.setup();
  // Your tests here
} finally {
  await seeder.teardown();
  await seeder.close();
}
```

### In Mocha Tests

```javascript
describe('Analytics API Tests', function() {
  let analyticsSeeder;
  let testData;

  before(async function() {
    analyticsSeeder = SeederFactory.getSeeder('analytics');
  });

  beforeEach(async function() {
    // Fresh data for each test
    testData = await analyticsSeeder.setup();
  });

  afterEach(async function() {
    // Clean up after each test
    await analyticsSeeder.teardown();
  });

  after(async function() {
    await analyticsSeeder.close();
  });

  it('should test analytics endpoint', function() {
    // Test with testData
  });
});
```

## Creating New Seeders

1. Create a new seeder class extending `BaseSeeder`
2. Implement `setup()` and `teardown()` methods
3. Add it to `seederFactory.js`
4. Export it from `index.js`

```javascript
const BaseSeeder = require('./baseSeeder');

class UsersSeeder extends BaseSeeder {
  async setup() {
    // Create user-specific test data
    const users = await this.seedUsers([...]);
    return { users };
  }

  async teardown() {
    await this.cleanup();
  }
}

module.exports = UsersSeeder;
```

## Benefits

- **Isolation**: Each controller gets fresh, isolated test data
- **No Conflicts**: Data is cleaned up between tests
- **Modularity**: Easy to add new controller-specific seeders
- **Consistency**: Standardized seeding patterns
- **Flexibility**: Can seed only what each test needs
