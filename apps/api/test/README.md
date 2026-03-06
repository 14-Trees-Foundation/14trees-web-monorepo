# Test Directory

This directory contains the complete testing infrastructure for the 14Trees API backend.

## Structure

```
test/
├── bootstrap.test.ts       - Global test setup/teardown
├── unit/                   - Unit tests
│   ├── repo/              - Repository layer tests
│   │   ├── userRepo.test.ts
│   │   ├── treeRepo.test.ts
│   │   └── pageVisitsRepo.test.ts
│   ├── services/          - Service layer tests (as needed)
│   └── controllers/       - Controller tests (as needed)
├── integration/           - Integration tests
│   ├── users.test.ts
│   ├── trees.test.ts
│   ├── pageVisits.test.ts
│   └── errorHandling.test.ts
├── seeders/              - Test data factories
│   ├── baseSeeder.ts     - Abstract base class
│   ├── seederFactory.ts  - Factory pattern implementation
│   ├── userSeeder.ts     - User test data (Phase 2)
│   ├── treeSeeder.ts     - Tree test data (Phase 2)
│   └── pageVisitsSeeder.ts - Page visit tracking data (Phase 2)
└── helpers/              - Test utilities
    ├── dbTestUtils.ts    - Database utilities (Phase 2)
    └── testDataBuilder.ts - Test data builder (Phase 2)
```

## Framework Stack

- **Test Runner**: Mocha
- **Assertions**: Chai (BDD style)
- **Mocking**: Sinon
- **Coverage**: c8 (modern Istanbul replacement)
- **HTTP Testing**: Supertest (for integration tests)

## Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Generate HTML coverage report
npm run test:coverage

# CI mode (minimal output, stricter timeout)
npm run test:ci
```

## Test Environment

- **Database**: PostgreSQL 14 (test instance)
- **Config**: `.env.test` (git-ignored in .gitignore)
- **Docker**: `docker-compose.test.yml` for local setup

### Local Setup

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run tests
npm test

# Stop database
docker-compose -f docker-compose.test.yml down
```

## Writing Tests

### Unit Test Template

```typescript
import { expect } from 'chai';
import sinon from 'sinon';

describe('FeatureName', () => {
  describe('Method', () => {
    it('should do something', () => {
      expect(result).to.equal(expected);
    });

    it('should handle error case', () => {
      expect(() => method()).to.throw();
    });
  });
});
```

### Integration Test Template

```typescript
import { expect } from 'chai';
import request from 'supertest';

describe('GET /api/users', () => {
  it('should return list of users', async () => {
    const res = await request(app)
      .get('/api/users')
      .expect(200);

    expect(res.body).to.be.an('array');
  });
});
```

### Using Sinon for Mocks

```typescript
// Stub a function
const stub = sinon.stub(UserService, 'getUser').resolves(userData);

// Spy on a function
const spy = sinon.spy(logger, 'info');

// Verify calls
expect(spy.callCount).to.equal(1);

// Restore
stub.restore();
spy.restore();
```

## Coverage Goals

| Metric | Target | Progress |
|--------|--------|----------|
| Statements | 70% | Phase 1: 0% |
| Branches | 70% | Phase 1: 0% |
| Functions | 70% | Phase 1: 0% |
| Lines | 70% | Phase 1: 0% |

## Implementation Phases

- **Phase 1** ✅ Setup infrastructure (this document)
- **Phase 2** 🔲 Create test data factories (seeders)
- **Phase 3** 🔲 Write unit tests for repositories
- **Phase 4** 🔲 Write integration tests
- **Phase 5** 🔲 GitHub Actions CI/CD
- **Phase 6** 🔲 Coverage enforcement
- **Phase 7** 🔲 Coverage dashboard

## References

- [Test Roadmap](../TESTING_ROADMAP.md)
- [Mocha Docs](https://mochajs.org/)
- [Chai Docs](https://www.chaijs.com/)
- [Sinon Docs](https://sinonjs.org/)
- [c8 Docs](https://github.com/bcoe/c8)
