import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Migration {
  name: string;
  filename: string;
  sql: string;
  checksum: string;
}

interface AppliedMigration {
  migration_name: string;
  applied_at: Date;
  checksum: string;
  execution_time_ms: number;
}

class MigrationRunner {
  private pool: Pool;
  private migrationsPath: string;

  constructor() {
    const dbConfig = {
      user: process.env.POSTGRES_USER || 'avnadmin',
      password: process.env.POSTGRES_PD,
      host: process.env.POSTGRES_HOST || 'vivek-tree-vivek-tree.e.aivencloud.com',
      port: parseInt(process.env.POSTGRES_PORT || '15050'),
      database: process.env.POSTGRES_DB || 'defaultdb',
      ssl: {
        rejectUnauthorized: false
      }
    };

    // Database connection using same config as main app
    this.pool = new Pool(dbConfig);

    // Set schema
    this.pool.on('connect', async (client: PoolClient) => {
      const schema = process.env.POSTGRES_SCHEMA || '14trees_2';
      await client.query(`SET search_path TO "${schema}", public`);
    });

    this.migrationsPath = path.join(__dirname, '../../migrations');
  }

  private calculateChecksum(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private async ensureMigrationTable(): Promise<void> {
    const schema = process.env.POSTGRES_SCHEMA || '14trees_2';
    
    // Check if migrations table exists in the correct schema
    const result = await this.pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'migrations'
      );
    `, [schema]);

    if (!result.rows[0].exists) {
      console.log('🔧 Creating migrations table using bootstrap migration (000_create_migration_table.sql)...');
      const migrationTableSql = fs.readFileSync(
        path.join(this.migrationsPath, '000_create_migration_table.sql'),
        'utf8'
      );
      await this.pool.query(migrationTableSql);
      console.log('✅ Migration table created successfully');
    }
  }

  private printConnectionInfo(): void {
    const host = process.env.POSTGRES_HOST || 'vivek-tree-vivek-tree.e.aivencloud.com';
    const port = process.env.POSTGRES_PORT || '15050';
    const database = process.env.POSTGRES_DB || 'defaultdb';
    const schema = process.env.POSTGRES_SCHEMA || '14trees_2';
    const user = process.env.POSTGRES_USER || 'avnadmin';

    console.log('🔗 Database Connection Info:');
    console.log(`   Host: ${host}:${port}`);
    console.log(`   Database: ${database}`);
    console.log(`   Schema: ${schema}`);
    console.log(`   User: ${user}`);
    console.log('');
  }

  private async getAppliedMigrations(): Promise<AppliedMigration[]> {
    const result = await this.pool.query(
      'SELECT migration_name, applied_at, checksum, execution_time_ms FROM migrations ORDER BY migration_name'
    );
    return result.rows;
  }

  private async getAllMigrationFiles(): Promise<Migration[]> {
    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => 
        file.endsWith('.sql') && 
        !file.startsWith('000_') && 
        file !== 'MIGRATION_TEMPLATE.sql' &&
        file !== 'README.md'
      )
      .sort();

    const migrations: Migration[] = [];

    for (const filename of files) {
      const filePath = path.join(this.migrationsPath, filename);
      const sql = fs.readFileSync(filePath, 'utf8');
      const name = path.basename(filename, '.sql');
      const checksum = this.calculateChecksum(sql);

      migrations.push({
        name,
        filename,
        sql,
        checksum
      });
    }

    return migrations;
  }

  private async recordMigration(migration: Migration, executionTime: number): Promise<void> {
    await this.pool.query(`
      INSERT INTO migrations (migration_name, applied_at, checksum, execution_time_ms)
      VALUES ($1, NOW(), $2, $3)
    `, [migration.name, migration.checksum, executionTime]);
  }

  public async migrate(): Promise<void> {
    console.log('🚀 Starting database migration...');
    this.printConnectionInfo();
    
    try {
      await this.ensureMigrationTable();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const allMigrations = await this.getAllMigrationFiles();
      const appliedNames = new Set(appliedMigrations.map(m => m.migration_name));

      // Check for migrations that need to be applied
      const pendingMigrations = allMigrations.filter(m => !appliedNames.has(m.name));

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations found. Database is up to date.');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migration(s):`);
      pendingMigrations.forEach(m => console.log(`   - ${m.filename}`));

      // Validate checksums for applied migrations
      for (const appliedMigration of appliedMigrations) {
        const currentMigration = allMigrations.find(m => m.name === appliedMigration.migration_name);
        if (currentMigration && currentMigration.checksum !== appliedMigration.checksum) {
          console.warn(`⚠️  Migration ${appliedMigration.migration_name} has been modified since it was applied!`);
          console.warn(`   Applied checksum: ${appliedMigration.checksum}`);
          console.warn(`   Current checksum: ${currentMigration.checksum}`);
        }
      }

      // Apply pending migrations
      for (const migration of pendingMigrations) {
        console.log(`🔄 Applying migration: ${migration.filename}`);
        
        const startTime = Date.now();
        const client = await this.pool.connect();
        
        try {
          await client.query('BEGIN');
          await client.query(migration.sql);
          
          const executionTime = Date.now() - startTime;
          await this.recordMigration(migration, executionTime);
          
          await client.query('COMMIT');
          console.log(`✅ Applied ${migration.filename} in ${executionTime}ms`);
          
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Failed to apply ${migration.filename}:`, error);
          throw error;
        } finally {
          client.release();
        }
      }

      console.log('🎉 All migrations completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  public async status(): Promise<void> {
    console.log('📊 Migration Status Report');
    console.log('========================');
    this.printConnectionInfo();

    try {
      await this.ensureMigrationTable();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const allMigrations = await this.getAllMigrationFiles();
      const appliedNames = new Set(appliedMigrations.map(m => m.migration_name));

      console.log(`📁 Total migration files: ${allMigrations.length} (excluding 000_create_migration_table.sql bootstrap)`);
      console.log(`✅ Applied migrations: ${appliedMigrations.length}`);
      console.log(`⏳ Pending migrations: ${allMigrations.length - appliedMigrations.length}`);

      if (appliedMigrations.length > 0) {
        console.log('\n✅ Applied Migrations:');
        appliedMigrations.forEach(m => {
          console.log(`   ${m.migration_name} (${m.applied_at.toISOString()}) - ${m.execution_time_ms}ms`);
        });
      }

      const pendingMigrations = allMigrations.filter(m => !appliedNames.has(m.name));
      if (pendingMigrations.length > 0) {
        console.log('\n⏳ Pending Migrations:');
        pendingMigrations.forEach(m => {
          console.log(`   ${m.filename}`);
        });
      }

    } catch (error) {
      console.error('❌ Failed to get migration status:', error);
      throw error;
    }
  }

  public async verify(): Promise<void> {
    console.log('🔍 Running Migration Verification');
    console.log('==================================');
    this.printConnectionInfo();

    try {
      await this.ensureMigrationTable();
      
      // Execute specific verification queries one by one
      await this.runQuery1_VerifyColumns();
      await this.runQuery2_VerifyForeignKey();
      await this.runQuery3_VerifyIndexes();
      await this.runQuery4_MigrationSummary();
      await this.runQuery5_SampleTransactions();
      await this.runQuery6_DataIntegrity();

      console.log('\n🎉 Verification completed successfully!');

    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    }
  }

  private async runQuery1_VerifyColumns(): Promise<void> {
    console.log('\n🔍 1. Verifying new columns exist...');
    try {
      const result = await this.pool.query(`
        SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'gift_redeem_transactions' 
          AND column_name IN ('gift_source_type', 'source_request_id')
        ORDER BY column_name
      `);
      
      if (result.rows.length > 0) {
        console.table(result.rows);
      } else {
        console.log('❌ No new columns found!');
      }
    } catch (error) {
      console.error('❌ Error verifying columns:', error);
    }
  }

  private async runQuery2_VerifyForeignKey(): Promise<void> {
    console.log('\n🔍 2. Verifying foreign key constraint...');
    try {
      const result = await this.pool.query(`
        SELECT 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'gift_redeem_transactions'
          AND kcu.column_name = 'source_request_id'
      `);
      
      if (result.rows.length > 0) {
        console.table(result.rows);
      } else {
        console.log('⚠️  No foreign key constraint found for source_request_id');
      }
    } catch (error) {
      console.error('❌ Error verifying foreign key:', error);
    }
  }

  private async runQuery3_VerifyIndexes(): Promise<void> {
    console.log('\n🔍 3. Verifying indexes exist...');
    try {
      const result = await this.pool.query(`
        SELECT 
            indexname, 
            indexdef
        FROM pg_indexes 
        WHERE tablename = 'gift_redeem_transactions' 
          AND indexname IN ('idx_grt_source_type', 'idx_grt_source_request')
      `);
      
      if (result.rows.length > 0) {
        console.table(result.rows);
      } else {
        console.log('⚠️  No new indexes found');
      }
    } catch (error) {
      console.error('❌ Error verifying indexes:', error);
    }
  }

  private async runQuery4_MigrationSummary(): Promise<void> {
    console.log('\n🔍 4. Migration results for Group 131...');
    try {
      const result = await this.pool.query(`
        SELECT 
            'Group 131 Migration Summary' AS summary_type,
            COUNT(*) as total_transactions,
            COUNT(CASE WHEN gift_source_type = 'fresh_request' THEN 1 END) as fresh_request_count,
            COUNT(CASE WHEN gift_source_type = 'pre_purchased' THEN 1 END) as pre_purchased_count,
            COUNT(CASE WHEN gift_source_type IS NULL THEN 1 END) as legacy_count,
            ROUND(COUNT(CASE WHEN gift_source_type = 'fresh_request' THEN 1 END) * 100.0 / COUNT(*), 2) as fresh_request_percentage,
            ROUND(COUNT(CASE WHEN gift_source_type = 'pre_purchased' THEN 1 END) * 100.0 / COUNT(*), 2) as pre_purchased_percentage
        FROM gift_redeem_transactions 
        WHERE group_id = 131
      `);
      
      if (result.rows.length > 0) {
        console.table(result.rows);
      } else {
        console.log('⚠️  No transactions found for Group 131');
      }
    } catch (error) {
      console.error('❌ Error getting migration summary:', error);
    }
  }

  private async runQuery5_SampleTransactions(): Promise<void> {
    console.log('\n🔍 5. Sample of classified transactions...');
    try {
      const result = await this.pool.query(`
        SELECT 
            id,
            gift_source_type,
            source_request_id,
            created_at,
            gifted_on,
            CASE gift_source_type
                WHEN 'fresh_request' THEN 'Direct Request Method'
                WHEN 'pre_purchased' THEN 'Via Prepurchase Method'
                ELSE 'Legacy Transaction'
            END as display_type
        FROM gift_redeem_transactions 
        WHERE group_id = 131
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      if (result.rows.length > 0) {
        console.table(result.rows);
      } else {
        console.log('⚠️  No sample transactions found');
      }
    } catch (error) {
      console.error('❌ Error getting sample transactions:', error);
    }
  }

  private async runQuery6_DataIntegrity(): Promise<void> {
    console.log('\n🔍 6. Data integrity check...');
    try {
      const result = await this.pool.query(`
        SELECT 
            'Data Integrity Check' AS check_type,
            COUNT(*) as total_with_source_ref,
            COUNT(gcr.id) as valid_references,
            COUNT(*) - COUNT(gcr.id) as broken_references
        FROM gift_redeem_transactions grt
        LEFT JOIN gift_card_requests gcr ON gcr.id = grt.source_request_id
        WHERE grt.source_request_id IS NOT NULL
          AND grt.group_id = 131
      `);
      
      if (result.rows.length > 0) {
        console.table(result.rows);
      } else {
        console.log('⚠️  No data to check integrity');
      }
    } catch (error) {
      console.error('❌ Error checking data integrity:', error);
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'migrate':
      case 'up':
        await runner.migrate();
        break;
      case 'status':
        await runner.status();
        break;
      case 'verify':
        await runner.verify();
        break;
      default:
        console.log('Usage: npm run migrate [migrate|status|verify]');
        console.log('  migrate  - Apply pending migrations');
        console.log('  status   - Show migration status');
        console.log('  verify   - Run migration verification');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration command failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

export default MigrationRunner;