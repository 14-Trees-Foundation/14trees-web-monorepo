# Database Migration System

This directory contains SQL migrations for the 14trees API backend database.

## Migration Naming Convention

Migrations should be named using the following pattern:
```
NNN_description_of_change.sql
```

Where:
- `NNN` is a zero-padded 3-digit number (e.g., 001, 002, 015, 123)
- `description_of_change` uses underscores and describes what the migration does

Examples:
- `001_add_gift_source_tracking.sql`
- `002_create_user_preferences_table.sql`
- `003_add_indexes_for_performance.sql`

## Available Commands

### Run Pending Migrations
```bash
npm run migrate
# or
npm run migrate:up
```

### Check Migration Status
```bash
npm run migrate:status
```

This will show:
- Total migration files found
- Which migrations have been applied
- Which migrations are pending
- When migrations were applied and how long they took

### Verify Migrations
```bash
npm run migrate:verify
```

This will run verification tests to ensure:
- Schema changes were applied correctly
- Data integrity is maintained
- Indexes and constraints exist
- Migration results are as expected

## How It Works

1. **Migration Tracking**: The system creates a `migrations` table to track which migrations have been applied
2. **Checksums**: Each migration file is checksummed to detect if it has been modified after being applied
3. **Order**: Migrations are applied in alphabetical order based on filename
4. **Transactions**: Each migration runs in its own transaction and will rollback on failure
5. **Logging**: Detailed logging shows progress and timing information

## Writing Migrations

1. **Copy the template**: Use `MIGRATION_TEMPLATE.sql` as a starting point
2. **Follow naming convention**: Use the next available number in sequence
3. **Keep it focused**: Each migration should handle one logical change
4. **Add documentation**: Include clear comments about what and why
5. **Test first**: Always test on development/staging before production

### Migration Best Practices

✅ **DO:**
- Keep migrations atomic and reversible
- Add proper indexes for performance
- Include descriptive comments
- Test on sample data first
- Consider data migration impact
- Use transactions for complex changes

❌ **DON'T:**
- Modify existing migration files after they've been applied
- Include application logic in migrations
- Create circular dependencies
- Skip testing migrations
- Make breaking changes without coordination

## Example Migration Structure

```sql
-- Migration: Add user email verification
-- Date: 2024-12-19
-- Description: Add email_verified column to support email verification workflow

-- Add the new column
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Update existing users to be verified (assuming current users are valid)
UPDATE users 
SET email_verified = TRUE 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Add index for faster queries
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- Add comment for documentation
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
```

## Deployment Process

### Development/Staging
```bash
# Check what migrations are pending
npm run migrate:status

# Apply migrations
npm run migrate
```

### Production
```bash
# 1. Always backup the database first
pg_dump -h [HOST] -U [USER] -d [DB] > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Check migration status
npm run migrate:status

# 3. Apply migrations (consider maintenance window for large changes)
npm run migrate

# 4. Verify the migration worked
npm run migrate:status
```

## Troubleshooting

### Migration Failed
If a migration fails:
1. The transaction will be rolled back automatically
2. Check the error message for details
3. Fix the issue in the migration file
4. Re-run the migration

### Modified Migration Warning
If you see a checksum mismatch warning:
1. A migration file was changed after being applied
2. This could indicate someone modified a migration that was already run
3. Review the changes and determine if they're safe
4. Consider creating a new migration for additional changes

### Reset Migration Status (⚠️ Danger)
Only in development environments, you can reset migration tracking:
```sql
-- WARNING: This will lose migration history
DROP TABLE IF EXISTS migrations;
```

Then re-run migrations to rebuild the tracking table.

## File Structure

```
migrations/
├── README.md                    # This file
├── MIGRATION_TEMPLATE.sql       # Template for new migrations
├── 000_create_migration_table.sql  # Bootstrap migration (auto-applied)
├── 001_add_gift_source_tracking.sql
├── 002_migrate_autus_wealth_transactions.sql
└── 003_verify_migration.sql
```

## Integration with Application

The migration system is separate from the main application and uses the same database connection configuration. This means:

- ✅ Same database credentials and connection settings
- ✅ Same schema configuration  
- ✅ Runs independently of the application
- ✅ Can be run during deployments before starting the application

## Future Enhancements

Possible improvements to consider:
- Rollback capability for individual migrations
- Dry-run mode to preview changes
- Migration validation before applying
- Integration with CI/CD pipelines
- Slack/email notifications for production migrations