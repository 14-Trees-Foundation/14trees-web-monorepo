# Archived Files

This directory contains old/unused code that has been archived during the testing infrastructure refactor.

## Contents

### tests/
- `csr-transaction-enhancement.test.js` - Old Jest-based test for CSR transaction functionality
  - **Status**: Archived during Phase 1 cleanup (March 6, 2026)
  - **Reason**: Switching from Jest to Mocha+Chai+Sinon framework
  - **Action**: If still needed, migrate to new test structure in `test/` directory
  - **Framework**: Jest (deprecated)
  - **Type**: Integration test

## How to Restore

If any of these files are still needed:

```bash
# Restore to test directory
cp archive/tests/csr-transaction-enhancement.test.js test/integration/csr-transactions.test.ts

# Then convert from Jest to Mocha+Chai:
# 1. Change require() to import statements
# 2. Use chai expect() instead of jest expect()
# 3. Adjust test syntax to Mocha format
```

## Cleanup Notes

- Jest removed from package.json (see Phase 1 cleanup commit)
- Using Mocha + Chai + Sinon for new test infrastructure
- All new tests should go in `test/` directory with TypeScript (.ts) extension
