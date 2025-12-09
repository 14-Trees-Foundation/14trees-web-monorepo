# Test Setup Guide

## Running Tests

The test suite is designed to work without requiring a local PostgreSQL installation. Database connections are mocked during testing.

### Quick Start
```bash
npm test
```

## Test Architecture

### Directory Structure
```
test/
├── bootstrap.test.js        # Test environment setup
├── testServer.js           # Isolated test server
├── helpers/
│   └── mockDatabase.js     # Database mocking utilities
├── unit/                   # Unit tests
│   └── basic.test.js       # Basic environment tests
└── integration/            # Integration tests
    └── serverHealth.test.js # Server health checks
```

### Environment Variables
Tests use `.env.test` file with mocked configurations. No real database connection needed.

### Coverage Reports
Coverage reports are generated in `coverage/` directory with:
- HTML report: `coverage/index.html`
- LCOV format for CI/CD integration

## Optional: Real Database Setup

If you need to test with a real database:

### macOS (Homebrew)
```bash
brew install postgresql
brew services start postgresql
createdb 14trees_test
```

### Ubuntu/Debian
```bash
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
sudo -u postgres createdb 14trees_test
```

### Docker (Recommended for CI/CD)
```bash
docker run --name postgres-test -e POSTGRES_DB=14trees_test -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14
```

### Update .env.test
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=14trees_test
POSTGRES_USER=postgres
POSTGRES_PD=password
POSTGRES_SCHEMA=14trees_test
DISABLE_DATABASE=false
```