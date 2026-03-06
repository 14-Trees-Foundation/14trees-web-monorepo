# Testing & Coverage Implementation Roadmap

## Overview
This document outlines the complete plan to implement testing infrastructure with coverage reporting on GitHub CI/CD. The goal is to achieve 70%+ code coverage with comprehensive unit and integration tests.

**Timeline**: 4-6 weeks  
**Target Coverage**: 70% overall, 75%+ for repositories  
**Framework**: Mocha + Chai + Sinon + c8

---

## Phase 1: Fix & Cleanup (Week 1)
*Get test_setup branch production-ready*

### Tasks

#### 1. Remove Redundant Coverage Config
- Delete `.nycrc.json` (keep c8 only)
- Update test documentation to reference c8

#### 2. Convert Test Files to TypeScript
- Move `test/**/*.js` → `test/**/*.ts`
- Add proper TypeScript imports and type annotations
- Update import statements in bootstrap

#### 3. Migrate mocha.opts to .mocharc.json
```json
{
  "require": ["ts-node/register"],
  "spec": "test/**/*.test.ts",
  "timeout": 30000,
  "ui": "bdd",
  "exit": true,
  "recursive": true
}
```

#### 4. Fix c8 Configuration
Create/update `.c8rc.json`:
```json
{
  "all": true,
  "include": ["src/**/*.ts"],
  "exclude": [
    "src/**/*.d.ts",
    "src/swagger.ts",
    "src/testServer.ts",
    "test/**/*",
    "coverage/**/*"
  ],
  "reporter": ["text", "text-summary", "html", "lcov"],
  "report-dir": "coverage",
  "check-coverage": true,
  "lines": 70,
  "statements": 70,
  "functions": 70,
  "branches": 65,
  "skip-full": false
}
```

#### 5. Update package.json Scripts
```json
{
  "test": "NODE_ENV=test c8 mocha --require ts-node/register test/bootstrap.test.ts test/**/*.test.ts --exit",
  "test:watch": "NODE_ENV=test mocha --require ts-node/register --watch test/**/*.test.ts",
  "test:coverage": "NODE_ENV=test c8 --reporter=html mocha --require ts-node/register test/bootstrap.test.ts test/**/*.test.ts --exit",
  "test:unit": "NODE_ENV=test mocha --require ts-node/register test/unit/**/*.test.ts",
  "test:integration": "NODE_ENV=test mocha --require ts-node/register test/integration/**/*.test.ts"
}
```

### Deliverables
- ✅ Clean, consistent test configuration
- ✅ TypeScript test files for better IDE support
- ✅ Ready for code implementation

---

## Phase 2: Unit Tests Foundation (Weeks 2-3)
*Highest ROI - repositories are most complex*

### Priority Repositories

| Repository | File Size | Complexity | Target Tests | Priority |
|------------|-----------|-----------|--------------|----------|
| userRepo | 311 lines | High | 35-40 | 🔴 |
| pageVisitsRepo | 189 lines | Medium | 25-30 | 🔴 |
| treeRepo | 1169 lines | Very High | 50-60 | 🟡 |

### File Structure to Create
```
test/unit/
├── repo/
│   ├── userRepo.test.ts        (35-40 tests)
│   ├── pageVisitsRepo.test.ts  (25-30 tests)
│   └── treeRepo.test.ts        (50-60 tests)
├── services/
│   └── (as needed)
├── controllers/
│   └── (as needed)
└── helpers/
    ├── testDataBuilder.ts
    └── dbTestUtils.ts
```

### Test Categories per Repository

#### UserRepo Tests
```
- addUser()
  ✓ should create user with valid data
  ✓ should throw error on duplicate email
  ✓ should sanitize and lowercase email
  ✓ should handle null optional fields
  ✓ should set created_at and updated_at timestamps
  ✓ should generate valid userId from name+email

- getUser()
  ✓ should fetch by name and email
  ✓ should return null if not found
  ✓ should handle case-insensitive email matching
  ✓ should handle special characters in name

- updateUser()
  ✓ should update valid fields
  ✓ should throw on duplicate email
  ✓ should set updated_at timestamp
  ✓ should handle status updates
  ✓ should validate required fields

- getUsers()
  ✓ should return paginated results
  ✓ should apply filters correctly
  ✓ should handle sorting
  ✓ should return correct total count
```

#### PageVisitsRepo Tests
```
- trackPageVisit()
  ✓ should insert tracking entry
  ✓ should increment existing hit count
  ✓ should handle null visitorId
  ✓ should update dashboard_page_visit_urls
  ✓ should update dashboard_page_visit_totals
  ✓ should validate pathname
  ✓ should validate section (profile|dashboard)

- getSummary()
  ✓ should return totals by domain
  ✓ should count profile vs dashboard hits
  ✓ should return tracked_urls count
  ✓ should return top URLs sorted by hits
  ✓ should handle empty database
```

#### TreeRepo Tests
```
- getTrees()
  ✓ should paginate results
  ✓ should filter by status
  ✓ should filter by user associations
  ✓ should filter by plot/site
  ✓ should handle complex filter combinations
  ✓ should sort by multiple columns

- (Continue for other major methods)
```

### Coverage Goal
- **Target**: 75%+ for repositories
- **Minimum**: 60% to proceed to Phase 3

---

## Phase 3: Test Data Factories (Week 3-4)
*Reusable seeders for all repositories*

### Seeders to Create
```
test/seeders/
├── baseSeeder.ts           (abstract base)
├── analyticsSeeder.ts      (exists, update to .ts)
├── userSeeder.ts           (NEW)
├── treeSeeder.ts           (NEW)
├── groupSeeder.ts          (NEW)
├── pageVisitsSeeder.ts     (NEW)
├── seederFactory.ts        (update)
└── index.ts
```

### Each Seeder Pattern
```typescript
export class UserSeeder extends BaseSeeder {
  private sequelize: any;

  constructor() {
    super();
    this.sequelize = getSequelizeInstance();
  }

  async setup(): Promise<TestData> {
    // Create test users
    // Create test groups
    // Create relationships
    // Return test data for assertions
    return {
      users: [...],
      groups: [...]
    };
  }

  async teardown(): Promise<void> {
    // Delete all created data
    // Maintain referential integrity
  }

  async close(): Promise<void> {
    // Close database connection
  }
}
```

### Benefits
- ✅ Consistent, reusable test data
- ✅ Isolated test data per test
- ✅ Easy to create complex scenarios
- ✅ Maintainable, DRY approach

---

## Phase 4: Integration Tests (Week 4-5)
*API endpoint testing with real database*

### Test Files to Create/Expand
```
test/integration/
├── analytics.test.ts       (expand existing)
├── users.test.ts           (NEW)
├── trees.test.ts           (NEW)
├── pageVisits.test.ts      (NEW - page tracking)
└── errorHandling.test.ts   (NEW)
```

### Test Coverage per Endpoint

#### API Tests Should Cover
- ✅ Happy path (valid request → 200)
- ✅ Missing required fields (400)
- ✅ Invalid data types (400)
- ✅ Not found scenarios (404)
- ✅ Duplicate data (409 or specific error)
- ✅ Pagination and filtering
- ✅ Authorization/authentication
- ✅ Response schema validation

### Example Integration Test
```typescript
describe('POST /api/users', () => {
  it('should create user with valid data', (done) => {
    request(app)
      .post('/api/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210'
      })
      .expect(201)
      .end((err, res) => {
        expect(res.body).to.have.property('id');
        expect(res.body.email).to.equal('john@example.com');
        done(err);
      });
  });
});
```

### Coverage Goal
- **Target**: 60%+ for controllers
- **Overall**: 65-70% combined

---

## Phase 5: GitHub Actions CI/CD (Week 5)

### Create `.github/workflows/test.yml`

```yaml
name: Tests & Coverage

on:
  push:
    branches: [ main, develop, test_setup ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: 14trees_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./apps/api
      
      - name: Setup test database
        run: npm run test:db:setup || true
        working-directory: ./apps/api
      
      - name: Run tests
        run: npm test
        working-directory: ./apps/api
      
      - name: Generate coverage report
        if: always()
        run: npm run test:coverage
        working-directory: ./apps/api
      
      - name: Upload coverage to Codecov
        if: always()
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/lcov.info
          flags: backend
          name: backend-coverage
          fail_ci_if_error: false
      
      - name: Comment PR with coverage (if PR)
        if: github.event_name == 'pull_request' && always()
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./apps/api/coverage/lcov.info
          delete-old-comments: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
        continue-on-error: true
```

### What This Does
- ✅ Runs on every push/PR to main, develop, test_setup
- ✅ Sets up PostgreSQL test database
- ✅ Runs all tests with coverage
- ✅ Uploads coverage to Codecov
- ✅ Posts coverage report on PRs
- ✅ Fails if tests fail (enforces quality gate)

### GitHub Setup
1. Enable GitHub Actions in repository settings
2. (Optional) Create Codecov account for badge: https://codecov.io
3. Add coverage badge to README.md

---

## Phase 6: Coverage Enforcement (Week 6)

### Update `.c8rc.json`
```json
{
  "all": true,
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.d.ts", "src/swagger.ts", "test/**/*"],
  "reporter": ["text", "text-summary", "html", "lcov"],
  "lines": 70,
  "statements": 70,
  "functions": 70,
  "branches": 65,
  "check-coverage": true,
  "skip-full": false
}
```

### What This Does
- ✅ Fails tests if coverage < thresholds
- ✅ Shows coverage in terminal
- ✅ Generates HTML reports in `coverage/`
- ✅ Prevents coverage regressions

### Optional: Pre-commit Hooks
```bash
# Install husky
npm install husky --save-dev
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm test --prefix apps/api"
```

**Note**: Only run lint checks in pre-commit (not full test suite), to keep commits fast.

---

## Phase 7: Coverage Dashboard (Week 6-7)

### Option 1: Codecov (Recommended for GitHub)
1. Visit https://codecov.io
2. Connect GitHub account
3. Enable repository
4. Coverage badge appears in workflow results

### Option 2: Coveralls.io
Add to GitHub Actions workflow:
```yaml
- name: Upload to Coveralls
  uses: coverallsapp/github-action@master
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    path-to-lcov: ./apps/api/coverage/lcov.info
```

### Coverage Badge in README
```markdown
# 14Trees API

[![Tests](https://github.com/14-Trees-Foundation/14trees-web-monorepo/actions/workflows/test.yml/badge.svg)](https://github.com/14-Trees-Foundation/14trees-web-monorepo/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/14-Trees-Foundation/14trees-web-monorepo/branch/main/graph/badge.svg)](https://codecov.io/gh/14-Trees-Foundation/14trees-web-monorepo)

Test coverage and CI/CD passing on every commit.
```

---

## Timeline & Effort Estimate

| Phase | Tasks | Duration | Effort | Dependencies |
|-------|-------|----------|--------|--------------|
| **1** | Cleanup & configuration | 2-3 days | Low | - |
| **2** | Unit tests (3 repos) | 1-2 weeks | Medium | Phase 1 |
| **3** | Test data factories | 3-5 days | Medium | Phase 2 |
| **4** | Integration tests | 1 week | Medium | Phase 3 |
| **5** | GitHub Actions setup | 2-3 days | Low | Phase 4 |
| **6** | Coverage enforcement | 1 day | Low | Phase 5 |
| **7** | Dashboard & badges | 1-2 days | Low | Phase 6 |
| **TOTAL** | | **4-6 weeks** | | |

---

## Expected Coverage Growth

| Milestone | Tests | Coverage | Effort |
|-----------|-------|----------|--------|
| Before implementation | ~15 | ~5% | - |
| After Phase 2 (unit tests) | ~100 | 35-40% | 1-2 weeks |
| After Phase 4 (all tests) | ~200+ | 65-70% | 2 more weeks |
| Mature state | 300+ | 75%+ | 1-2 more weeks |

---

## Quick Start Usage

Once implemented, team will use:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Generate coverage report (HTML)
npm run test:coverage

# View coverage report
open coverage/index.html  # macOS
# or xdg-open coverage/index.html (Linux)
```

---

## Success Criteria

- ✅ **Phase 1**: All tests run without errors
- ✅ **Phase 2**: 35%+ code coverage achieved
- ✅ **Phase 4**: 70%+ code coverage achieved
- ✅ **Phase 5**: GitHub Actions passing on main branch
- ✅ **Phase 6**: Coverage enforcement prevents regressions
- ✅ **Phase 7**: Coverage badge on README, trending over time

---

## Key Metrics to Track

Create a spreadsheet to track progress:

| Week | Total Tests | Coverage % | Pass Rate | Avg Test Time |
|------|------------|-----------|-----------|----------------|
| 1 | 15 | 5% | 100% | 50ms |
| 2 | 65 | 35% | 98% | 200ms |
| 3 | 120 | 50% | 99% | 250ms |
| 4 | 200+ | 70%+ | 99%+ | 300ms |

---

## Common Pitfalls to Avoid

1. **⚠️ Writing tests after code instead of alongside**
   - Keep test-writing momentum with feature development
   - Tests catch bugs early

2. **⚠️ Aiming for 100% coverage**
   - Not all code needs tests (getters, setters, pure utils)
   - Focus on logic, integrations, edge cases

3. **⚠️ Slow tests**
   - Unit tests should be <50ms
   - Use mocks liberally
   - Keep integration tests focused

4. **⚠️ Flaky tests**
   - Avoid hardcoding timestamps
   - Clean up data properly in teardown
   - Use proper async/await handling

5. **⚠️ Testing implementation instead of behavior**
   - Test what the function does, not how it does it
   - Refactoring should not break tests

---

## References

- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
- [Sinon Mocking Library](https://sinonjs.org/)
- [c8 Coverage Tool](https://github.com/bcoe/c8)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Integration](https://docs.codecov.io/docs)

---

## Next Steps

1. **This Week**: Complete Phase 1 (cleanup & configuration)
2. **Week 2-3**: Begin Phase 2 (unit tests for userRepo)
3. **Week 4**: Complete Phase 4 (integration tests)
4. **Week 5**: Deploy Phase 5 (GitHub Actions)
5. **Week 6+**: Monitor and maintain coverage

---

**Last Updated**: March 6, 2026  
**Status**: Planning Phase  
**Owner**: @abhi  
**For Questions**: Refer to TEST_SETUP.md and TEST_SETUP_GUIDE.md
