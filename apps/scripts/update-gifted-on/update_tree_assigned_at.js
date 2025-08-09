const { QueryTypes } = require("sequelize");
const { Sequelize } = require("sequelize-typescript");
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Database connection setup
let sequelize = new Sequelize({
    database: process.env.POSTGRES_DB || 'defaultdb',
    host: process.env.POSTGRES_HOST || 'vivek-tree-vivek-tree.e.aivencloud.com',
    password: process.env.POSTGRES_PD,
    username: process.env.POSTGRES_USER || 'avnadmin',
    port: parseInt(process.env.POSTGRES_PORT || '15050'),
    schema: process.env.POSTGRES_SCHEMA || '14trees_2',
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true, 
        rejectUnauthorized: false 
      }
    },
    define: {
      timestamps: false,
    },
    logging: false,
});

// Function to calculate assigned_at date from birthdate
function calculateAssignedAt(birthdate) {
  // Parse the birthdate string directly to avoid timezone issues
  const [year, month, day] = birthdate.split('-').map(Number);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // Start with the birth month/day in current year
  let assignedYear = currentYear;
  let assignedAt = new Date(assignedYear, month - 1, day); // month - 1 because JS months are 0-based
  
  // If the calculated date is not in the future, move to next year
  if (assignedAt <= currentDate) {
    assignedYear++;
    assignedAt = new Date(assignedYear, month - 1, day);
  }
  
  // Format as YYYY-MM-DD with time to ensure correct display in IST
  // Adding 12:00:00 UTC so it displays correctly in IST (UTC+5:30)
  // This ensures the date shows correctly in Indian timezone
  const formattedMonth = String(month).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');
  return `${assignedYear}-${formattedMonth}-${formattedDay} 12:00:00+00`;
}

// Function to read and parse CSV
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Function to generate SQL queries
function generateUpdateQueries(csvData) {
  const queries = [];
  
  csvData.forEach(row => {
    const saplingId = row['Sapling ID'].trim();
    const assignedTo = row['Assigned to'].trim();
    const birthdate = row['Birthdate'].trim();
    const assignedAt = calculateAssignedAt(birthdate);
    
    const query = `UPDATE "${process.env.POSTGRES_SCHEMA || '14trees_2'}".trees 
SET assigned_at = '${assignedAt}' 
WHERE sapling_id = '${saplingId}';`;
    
    queries.push({
      saplingId,
      assignedTo,
      birthdate,
      assignedAt,
      query
    });
  });
  
  return queries;
}

// Function to write SQL queries to file
async function writeSQLFile(queries, outputPath) {
  const sqlContent = [
    '-- Tree Assigned At Update Queries',
    `-- Generated on: ${new Date().toISOString()}`,
    `-- Total queries: ${queries.length}`,
    '',
    '-- Begin Transaction',
    'BEGIN;',
    '',
    ...queries.map((q, index) => [
      `-- ${index + 1}. Sapling ID: ${q.saplingId}, Assigned to: ${q.assignedTo}, Birthdate: ${q.birthdate} -> Assigned At: ${q.assignedAt}`,
      q.query,
      ''
    ].join('\n')),
    '-- Commit Transaction',
    'COMMIT;',
    '',
    '-- Rollback in case of error (uncomment if needed)',
    '-- ROLLBACK;'
  ].join('\n');
  
  await fs.promises.writeFile(outputPath, sqlContent, 'utf8');
}

// Function to execute queries
async function executeQueries(queries, dryRun = true) {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL Connection established successfully.");
    console.log(`🗄️  Using database schema: ${process.env.POSTGRES_SCHEMA || '14trees_2'}`);
    
    if (dryRun) {
      console.log("🔍 DRY RUN MODE - No actual updates will be performed");
      
      // Check which sapling IDs exist in the database
      const saplingIds = queries.map(q => `'${q.saplingId}'`).join(',');
      const existingTrees = await sequelize.query(
        `SELECT sapling_id, assigned_at FROM "${process.env.POSTGRES_SCHEMA || '14trees_2'}".trees WHERE sapling_id IN (${saplingIds})`,
        { type: QueryTypes.SELECT }
      );
      
      console.log(`\n📊 Found ${existingTrees.length} existing trees out of ${queries.length} in CSV`);
      
      // Show sample of what would be updated
      console.log("\n📝 Sample updates that would be performed:");
      queries.slice(0, 5).forEach((query, index) => {
        const existing = existingTrees.find(t => t.sapling_id === query.saplingId);
        if (existing) {
          console.log(`${index + 1}. Sapling ${query.saplingId}: ${existing.assigned_at || 'NULL'} -> ${query.assignedAt}`);
        } else {
          console.log(`${index + 1}. Sapling ${query.saplingId}: NOT FOUND in database`);
        }
      });
      
      // Show trees that don't exist
      const missingSaplingIds = queries
        .filter(q => !existingTrees.find(t => t.sapling_id === q.saplingId))
        .map(q => q.saplingId);
      
      if (missingSaplingIds.length > 0) {
        console.log(`\n⚠️  Warning: ${missingSaplingIds.length} sapling IDs from CSV not found in database:`);
        missingSaplingIds.slice(0, 10).forEach(id => console.log(`   - ${id}`));
        if (missingSaplingIds.length > 10) {
          console.log(`   ... and ${missingSaplingIds.length - 10} more`);
        }
      }
      
    } else {
      console.log("🚀 EXECUTING UPDATES - This will modify the database");
      
      await sequelize.query('BEGIN', { type: QueryTypes.RAW });
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const query of queries) {
        try {
          const result = await sequelize.query(query.query, { type: QueryTypes.UPDATE });
          if (result[1] > 0) {
            successCount++;
            console.log(`✅ Updated sapling ${query.saplingId}`);
          } else {
            console.log(`⚠️  No rows affected for sapling ${query.saplingId} (may not exist)`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error updating sapling ${query.saplingId}:`, error);
        }
      }
      
      if (errorCount === 0) {
        await sequelize.query('COMMIT', { type: QueryTypes.RAW });
        console.log(`\n✅ Successfully updated ${successCount} trees`);
      } else {
        await sequelize.query('ROLLBACK', { type: QueryTypes.RAW });
        console.log(`\n❌ Rolled back due to ${errorCount} errors. ${successCount} updates were attempted.`);
      }
    }
    
  } catch (error) {
    console.error("❌ Database operation failed:", error);
    throw error;
  }
}

// Main function
async function main() {
  // const csvFilePath = '/Users/admin/Downloads/LGT - Sheet1.csv';
  const csvFilePath = '/Users/admin/Downloads/LGT - BD updates - 28th July 25.csv'
  const sqlOutputPath = path.join(__dirname, 'tree_assigned_at_updates.sql');
  
  try {
    console.log("📖 Reading CSV file...");
    const csvData = await readCSV(csvFilePath);
    console.log(`📊 Found ${csvData.length} records in CSV`);
    
    console.log("🔧 Generating update queries...");
    const queries = generateUpdateQueries(csvData);
    
    console.log("📝 Writing SQL file...");
    await writeSQLFile(queries, sqlOutputPath);
    console.log(`✅ SQL queries written to: ${sqlOutputPath}`);
    
    // Show sample of generated dates
    console.log("\n📅 Sample assigned_at dates generated:");
    queries.slice(0, 5).forEach((q, index) => {
      console.log(`${index + 1}. ${q.assignedTo} (${q.birthdate}) -> ${q.assignedAt}`);
    });
    
    // Ask user if they want to proceed with dry run
    console.log("\n🔍 Running dry run to check database...");
    await executeQueries(queries, true);
    
    console.log("\n" + "=".repeat(60));
    console.log("📋 SUMMARY:");
    console.log(`   • CSV records processed: ${csvData.length}`);
    console.log(`   • SQL queries generated: ${queries.length}`);
    console.log(`   • SQL file created: ${sqlOutputPath}`);
    console.log("   • Dry run completed - no data was modified");
    console.log("=".repeat(60));
    
    console.log("\n🚀 To execute the actual updates, run:");
    console.log("   EXECUTE_UPDATES=true node apps/scripts/update_tree_assigned_at.js");
    
    // Check if user wants to execute updates
    if (process.env.EXECUTE_UPDATES === 'true') {
      console.log("\n⚠️  EXECUTE_UPDATES=true detected. Proceeding with actual database updates...");
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
      await executeQueries(queries, false);
    }
    
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, calculateAssignedAt, generateUpdateQueries };