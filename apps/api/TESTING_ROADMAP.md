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

#### 2. Environment Isolation (NEW)
Create a `.env.test` file with test-specific credentials:
```bash
NODE_ENV=test
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=14trees_test
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SCHEMA=public
SECRET_KEY=test-secret-key
```

Create `docker-compose.test.yml` so local dev matches CI exactly:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: 14trees_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

#### 3. Convert Test Files to TypeScript
- Move `test/**/*.js` → `test/**/*.ts`
- Add proper TypeScript imports and type annotations
- Update import statements in bootstrap

#### 4. Migrate mocha.opts to .mocharc.json
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

#### 5. Fix c8 Configuration
Create/update `.c8rc.json` with expanded exclusions:
```json
{
  "all": true,
  "include": ["src/**/*.ts"],
  "exclude": [
    "src/**/*.d.ts",
    "src/swagger.ts",
    "src/testServer.ts",
    "src/migrations/**",
    "src/seeders/**",
    "src/config/**",
    "test/**/*",
    "coverage/**/*"
  ],
  "reporter": ["text", "text-summary", "html", "lcov"],
  "report-dir": "coverage",
  "check-coverage": true,
  "lines": 70,
  "statements": 70,
  "functions": 70,
  "branches": 70,
  "skip-full": false
}
```
**Note**: Migrations, seeders, and config files have no testable business logic and are excluded. Branch coverage aligned with other thresholds at 70%.

#### 6. Update package.json Scripts
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

## Phase 2: Test Data Factories (Weeks 2-3)
*Create seeders BEFORE unit tests — they're dependencies*

### Why Reorder First?
Building seeders before unit tests means:
- Unit tests have consistent test data ready
- No retrofit of existing tests
- Clear dependency chain: Seeders → Unit Tests → Integration Tests

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

### Seeder Pattern Template
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

## Phase 3: Unit Tests Foundation (Weeks 3-4)
*Highest ROI - repositories are most testable*

**Prerequisite**: Phase 2 (Test Data Factories/Seeders) must be complete first.

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
- **Minimum**: 60% to proceed to Phase 4

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
- ✅ **Concurrent request handling** (especially critical for pageVisitsRepo hit counting — vulnerable to race conditions)
- ✅ **Large/edge case inputs** (very long strings, Unicode, SQL injection attempts)
- ✅ **Rate limiting** (if any endpoints have throttling)

⚠️ **Important**: Integration tests must use a **real test database**, NOT mocks. The entire value is catching real constraint violations, query errors, and data integrity issues that unit tests with mocks will never surface.

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
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./apps/api
      
      - name: Setup test database
        run: npm run test:db:setup || true
        working-directory: ./apps/api
      
      - name: Run tests with coverage
        run: npm run test:ci
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
(Already done in Phase 1 — no additional changes needed)

Thresholds are now consistent at 70%:
- Lines: 70%
- Statements: 70%
- Functions: 70%
- Branches: 70%

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

### Setup Codecov (Recommended — Automatic Trend Tracking)
1. Visit https://codecov.io
2. Connect GitHub account
3. Enable repository
4. Coverage badge and trend graphs appear automatically

**Benefits**:
- ✅ Historical coverage trends (automatic tracking, no manual spreadsheet)
- ✅ Per-file coverage changes in PRs
- ✅ Coverage badges for README
- ✅ Commit-level tracking

### Coverage Badge in README
```markdown
# 14Trees API

[![Tests](https://github.com/14-Trees-Foundation/14trees-web-monorepo/actions/workflows/test.yml/badge.svg)](https://github.com/14-Trees-Foundation/14trees-web-monorepo/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/14-Trees-Foundation/14trees-web-monorepo/branch/main/graph/badge.svg)](https://codecov.io/gh/14-Trees-Foundation/14trees-web-monorepo)

Test coverage and CI/CD passing on every commit. Coverage trends available on [Codecov](https://codecov.io/gh/14-Trees-Foundation/14trees-web-monorepo).
```

---

## Timeline & Effort Estimate

| Phase | Tasks | Duration | Effort | Dependencies |
|-------|-------|----------|--------|--------------|
| **1** | Cleanup + environment isolation | 2-3 days | Low | - |
| **2** | Test data factories (seeders) | 3-5 days | Medium | Phase 1 |
| **3** | Unit tests (3 repos) | 1-2 weeks | Medium | Phase 2 |
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
| After Phase 3 (unit tests) | ~100 | 35-40% | 1-2 weeks |
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
- ✅ **Phase 2**: Seeders created and working
- ✅ **Phase 3**: 35%+ code coverage achieved
- ✅ **Phase 4**: 70%+ code coverage achieved
- ✅ **Phase 5**: GitHub Actions passing on main branch
- ✅ **Phase 6**: Coverage enforcement prevents regressions
- ✅ **Phase 7**: Coverage badge on README, trending over time

---

## Key Metrics to Track

**Use Codecov's built-in dashboard instead of manual spreadsheet:**
- Historical coverage trend graphs
- Per-branch coverage comparison
- File-level coverage changes
- Automated email reports on regressions

No manual spreadsheet needed — Codecov tracks automatically.

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

1. **This Week**: Complete Phase 1 (cleanup & environment isolation)
2. **Week 2-3**: Complete Phase 2 (test data factories/seeders)
3. **Week 3-4**: Begin Phase 3 (unit tests with seeders ready)
4. **Week 5**: Complete Phase 4 (integration tests with real database)
5. **Week 6**: Deploy Phase 5 (GitHub Actions with npm run test:ci)
6. **Week 6+**: Monitor Codecov trends automatically

---

**Last Updated**: March 6, 2026  
**Status**: Planning Phase  
**Owner**: @abhi  
**For Questions**: Refer to TEST_SETUP.md and TEST_SETUP_GUIDE.md