# Tree Assigned At Update Script

This script updates the `assigned_at` column in the trees table based on CSV data containing tree assignments and birthdates.

## Overview

The script reads a CSV file with the following columns:
- `Sapling ID`: The tree's sapling identifier
- `Assigned to`: Name of the person assigned to the tree
- `Birthdate`: The assignee's birthdate (YYYY-MM-DD format)

It calculates the `assigned_at` date by taking the birthdate's month and day, but setting the year to be in the future (2025 or later) to ensure the date is after the current date.

## Files Created

1. `update_tree_assigned_at.js` - Main script
2. `tree_assigned_at_updates.sql` - Generated SQL file with all update queries
3. `TREE_ASSIGNED_AT_UPDATE.md` - This documentation

## Usage

### 1. Run Dry Run (Recommended)

Run the script in dry-run mode to see what would be updated without making changes:

```bash
cd /Users/admin/Projects/14trees-web-monorepo
node apps/scripts/update_tree_assigned_at.js
```

This will:
- Read the CSV file
- Generate SQL queries
- Create `tree_assigned_at_updates.sql` file
- Check which trees exist in the database
- Show a preview of what would be updated
- **NOT modify any data**

### 2. Execute Actual Updates

After reviewing the dry run results and the generated SQL file, execute the actual updates:

```bash
cd /Users/admin/Projects/14trees-web-monorepo
EXECUTE_UPDATES=true node apps/scripts/update_tree_assigned_at.js
```

## Environment Variables

The script uses the following environment variables for database connection:

- `POSTGRES_DB` (default: 'defaultdb')
- `POSTGRES_HOST` (default: 'vivek-tree-vivek-tree.e.aivencloud.com')
- `POSTGRES_PORT` (default: '15050')
- `POSTGRES_USER` (default: 'avnadmin')
- `POSTGRES_PD` (required: database password)
- `POSTGRES_SCHEMA` (default: '14trees_2')

## Date Calculation Logic

The script calculates `assigned_at` dates as follows:

1. Takes the month and day from the birthdate
2. Sets the year to current year + 1 (2025 if run in 2024)
3. If the resulting date is not in the future, increments the year until it is
4. Returns the date with timestamp `12:00:00+00` (UTC) to ensure correct display in IST

### Timezone Handling:
- **Issue**: UI displays dates in IST (UTC+5:30), causing dates to appear one day earlier
- **Solution**: Store dates with `12:00:00+00` UTC timestamp
- **Result**: Dates display correctly in Indian timezone

### Example:
- Birthdate: `1953-10-05` → Assigned At: `2025-10-05 12:00:00+00`
- Birthdate: `1985-08-06` → Assigned At: `2025-08-06 12:00:00+00`
- **UI Display**: Shows as `2025-10-05` and `2025-08-06` in IST (correct!)

## Safety Features

1. **Dry Run by Default**: Script runs in dry-run mode unless explicitly told to execute
2. **Transaction Support**: All updates are wrapped in a database transaction
3. **Error Handling**: If any update fails, all changes are rolled back
4. **SQL File Generation**: All queries are saved to a file for review
5. **Existence Check**: Verifies which sapling IDs exist before updating
6. **Detailed Logging**: Shows progress and results of each operation

## Output Files

### tree_assigned_at_updates.sql
Contains all the generated SQL UPDATE statements with:
- Header comments with generation timestamp and query count
- Individual comments for each update showing the transformation
- Transaction BEGIN/COMMIT statements
- Rollback option (commented out)

Example content:
```sql
-- Tree Assigned At Update Queries
-- Generated on: 2024-12-19T10:30:00.000Z
-- Total queries: 69

-- Begin Transaction
BEGIN;

-- 1. Sapling ID: 71542, Assigned to: Ojas Kirti Parikh, Birthdate: 1973-12-07 -> Assigned At: 2025-12-07
UPDATE "14trees_2".trees 
SET assigned_at = '2025-12-07' 
WHERE sapling_id = '71542';

-- Commit Transaction
COMMIT;
```

## Error Handling

The script handles various error scenarios:
- CSV file not found or unreadable
- Database connection failures
- Invalid date formats
- Non-existent sapling IDs
- SQL execution errors

## Verification

After running the script, you can verify the updates with:

```sql
SELECT sapling_id, assigned_at 
FROM "14trees_2".trees 
WHERE sapling_id IN ('71542', '71583', '71562') 
ORDER BY sapling_id;
```

## Rollback

If you need to rollback the changes, you can:

1. Use the generated SQL file and replace `COMMIT;` with `ROLLBACK;`
2. Or create a rollback script to set `assigned_at` back to `NULL`
3. Or restore from a database backup taken before running the script

## Development Environment

This script is designed to be tested in the development environment first. Make sure you're connected to the correct database schema before running with `EXECUTE_UPDATES=true`.