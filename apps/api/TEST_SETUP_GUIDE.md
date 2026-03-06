# Test Setup Guide

## Overview
This test framework is designed to work consistently across different development machines with minimal configuration.

## Prerequisites

### PostgreSQL Installation
You need PostgreSQL installed locally. The setup will automatically detect your system user:

**macOS:**
```bash
# Install via Homebrew
brew install postgresql
brew services start postgresql

# Or install Postgres.app from https://postgresapp.com/
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
```bash
# Install via Chocolatey
choco install postgresql

# Or download from https://www.postgresql.org/download/windows/
```

## Automatic User Detection

The test setup automatically detects the appropriate PostgreSQL user:

1. **Environment Variable**: If `POSTGRES_USER` is set in `.env.test`
2. **System User**: Falls back to current system user (`whoami`)
3. **OS Module**: Uses Node.js `os.userInfo().username` as final fallback

This means the setup works out-of-the-box on most machines without manual configuration.

## Database Setup

### Automatic Setup
```bash
# Set up test database and run tests
npm run test:with-db
```

### Manual Setup
```bash
# Just set up the database
npm run test:db:setup

# Run tests with existing database
npm test
```

### What the setup does:
1. Detects your PostgreSQL user automatically
2. Creates `14trees_test` database
3. Creates required tables with proper schema
4. Sets up indexes for performance

## Test Structure

```
test/
├── bootstrap.test.js          # Global test setup
├── setup-test-db.sh          # Database initialization script
├── helpers/
│   ├── testDataSeeder.js     # Test data creation/cleanup
│   └── mockDatabase.js       # Database mocking utilities
├── unit/
│   ├── basic.test.js         # Basic unit tests
│   └── sourceCoverage.test.js # Source code coverage tests
└── integration/
    ├── serverHealth.test.js   # Server health checks
    └── analytics.e2e.test.js  # Analytics API E2E tests
```

## Environment Variables

The test environment (`.env.test`) is pre-configured with sensible defaults:

```bash
NODE_ENV=test
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=14trees_test
POSTGRES_USER=                 # Auto-detected
POSTGRES_PD=                   # Usually empty for local dev
POSTGRES_SCHEMA=public
```

## Cross-Platform Compatibility

### User Detection Priority:
1. `process.env.POSTGRES_USER` (if explicitly set)
2. `process.env.USER` (Unix/Linux systems)
3. `os.userInfo().username` (Cross-platform Node.js)
4. `$(whoami)` (Shell command in setup script)

### Database Connection:
- **Local Development**: No SSL, uses system user
- **Production**: SSL enabled, uses specified credentials

## Troubleshooting

### "role does not exist" Error
If you get a role/user error, check your PostgreSQL installation:

```bash
# Check available databases and users
psql -l

# Connect to PostgreSQL as superuser (if needed)
sudo -u postgres psql

# Create user if needed (replace 'yourusername')
CREATE USER yourusername SUPERUSER;
```

### "database does not exist" Error
The setup script should create the database automatically. If it fails:

```bash
# Manual database creation
createdb 14trees_test

# Or via psql
psql -c "CREATE DATABASE 14trees_test;"
```

### Permission Issues
Ensure your user has sufficient privileges:

```bash
# Grant privileges (run as postgres or superuser)
psql -c "ALTER USER yourusername CREATEDB;"
```

## Test Data Management

### Modular Seeder System

The test framework uses a modular seeder system that provides isolated data management for different controllers:

```
test/
├── seeders/
│   ├── README.md              # Detailed seeder documentation
│   ├── index.js              # Main exports
│   ├── baseSeeder.js         # Base seeding functionality
│   ├── seederFactory.js      # Factory for controller seeders
│   ├── analyticsSeeder.js    # Analytics-specific seeder
│   └── exampleSeeder.js      # Template for new seeders
└── helpers/
    └── testDataSeeder.js     # Legacy redirect
```

### Using Seeders in Tests

#### Method 1: Automatic Management (Recommended)
```javascript
const { SeederFactory } = require('../seeders');

await SeederFactory.withSeeder('analytics', async (testData, seeder) => {
  // Data automatically cleaned up after this block
  expect(testData.trees).to.have.length(3);
});
```

#### Method 2: Manual Management (More Control)
```javascript
const seeder = SeederFactory.getSeeder('analytics');

beforeEach(async function() {
  testData = await seeder.setup(); // Fresh data for each test
});

afterEach(async function() {
  await seeder.teardown(); // Clean up after each test
});
```

### Benefits of Modular Seeders

- **Isolation**: Each controller gets fresh, conflict-free data
- **Speed**: Only seeds data needed for specific tests
- **Modularity**: Easy to add new controller-specific seeders
- **Consistency**: Standardized patterns across all tests

### Creating New Seeders

1. Copy `test/seeders/exampleSeeder.js` as a template
2. Implement controller-specific `setup()` method
3. Add to `seederFactory.js` switch statement
4. Export from `index.js`

See `test/seeders/README.md` for detailed documentation.

## Coverage Reports

After running tests, coverage reports are available:
- **HTML**: `coverage/index.html` (open in browser)
- **LCOV**: `coverage/lcov.info` (for CI/CD integration)
- **Text**: Displayed in terminal during test run

## CI/CD Integration

For continuous integration, you can:

1. **Use the setup script** in your CI pipeline:
   ```yaml
   - name: Setup test database
     run: npm run test:db:setup
   
   - name: Run tests with coverage
     run: npm test
   ```

2. **Use Docker** for consistent environments:
   ```dockerfile
   # In your CI Dockerfile
   RUN apt-get install -y postgresql
   RUN service postgresql start
   ```

3. **Use managed database** services:
   - Set `POSTGRES_USER`, `POSTGRES_HOST`, etc. in CI environment
   - The system will automatically use provided credentials

## Best Practices

1. **Don't commit** database credentials to version control
2. **Use environment-specific** `.env` files
3. **Clean test data** after each test run (handled automatically)
4. **Run tests in isolation** - each test suite should be independent
5. **Use transactions** for test data when possible to ensure cleanup