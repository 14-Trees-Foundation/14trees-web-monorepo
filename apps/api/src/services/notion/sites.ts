import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/postgreDB';
import { dataBaseId, syncDataFromNotionToDb } from './notion';

async function insertCsvIntoPostgres(filePath: string) {
    console.log('[INFO]', 'insertCsvIntoPostgres', `Reading CSV from ${filePath}...`);
    const fileName = path.basename(filePath, path.extname(filePath)); // Use the file name as the table name
    const headers: string[] = [];
    const records: any[] = [];

    // Step 1: Read the CSV file and gather headers and records
    const csvStartTime = Date.now();
    await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('headers', (headerNames: string[]) => {
                headers.push(...headerNames);
            })
            .on('data', (row: any) => {
                const processedRow: any = {};
                headers.forEach((header) => {
                    if (row[header] === '') processedRow[header] = null;
                    else if (header === 'Service offered') {
                        if (row[header].toLowerCase().includes('planting')) {
                            processedRow[header] = 'PLANTATION_ONLY';
                        } else if (row[header].toLowerCase().includes('distribution')) {
                            processedRow[header] = 'DISTRIBUTION_ONLY';
                        } else if (row[header].toLowerCase().includes('full service')) {
                            processedRow[header] = 'FULL_MAINTENANCE';
                        } else if (row[header].toLowerCase().includes('tbd')) {
                            processedRow[header] = 'TBD';
                        } else if (row[header].toLowerCase().includes('cancelled')) {
                            processedRow[header] = 'CANCELLED';
                        } else if (row[header].toLowerCase().includes('waiting')) {
                            processedRow[header] = 'WAITING';
                        } else {
                            processedRow[header] = null;
                        }
                    } else {
                        processedRow[header] = row[header];
                    }
                });
                records.push(processedRow);
            })
            .on('end', () => resolve())
            .on('error', (error) => reject(error));
    });
    console.log('[INFO]', 'insertCsvIntoPostgres', `CSV parsed: ${records.length} records (${Date.now() - csvStartTime}ms)`);

    // Step 2: Define a dynamic Sequelize model based on the headers
    const tableDefinition: { [key: string]: any } = {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true, // Assuming `id` is the primary key
        },
        'Files & media': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Album contains': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        Status: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'To do': {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Khadde: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        Zone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Google Earth link': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Location pin': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Google Earth placemark': {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        Presentable: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        '7-12 Area (Acres)': {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        'Length (Kms)': {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        Link: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Album (1)': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        Tag: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Grove type': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        Date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        Trees: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        'Area Measured (Acres)': {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        'Planned Allocation': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Album Pic': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Volunteer Name': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        Name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        Survival: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'album owner': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        Taluka: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        Account: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        District: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        Season: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        Remark: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        PMRDA: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Service offered': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'नाव (मराठी)': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Land Type': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Land Owner': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        Village: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Unique Site Id': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Data errors': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Issue Resolution': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Site Type': {
            type: DataTypes.STRING,
            allowNull: true,
        }
    }

    class DynamicModel extends Model { }
    DynamicModel.init(tableDefinition, {
        sequelize,
        modelName: fileName,
        tableName: fileName,
        timestamps: false, // Adjust if needed
        schema: 'public',
    });

    // Step 3: Sync the model to create the table in the database
    const syncStartTime = Date.now();
    console.log('[INFO]', 'insertCsvIntoPostgres', `Dropping and recreating ${fileName} table...`);
    await DynamicModel.sync({ force: true }); // `force: true` drops the table if it already exists
    console.log('[INFO]', 'insertCsvIntoPostgres', `Table recreated (${Date.now() - syncStartTime}ms)`);

    // Step 4: Insert the records into the database
    const bulkStartTime = Date.now();
    console.log('[INFO]', 'insertCsvIntoPostgres', `Bulk inserting ${records.length} records into ${fileName}...`);
    await DynamicModel.bulkCreate(records);
    console.log('[INFO]', 'insertCsvIntoPostgres', `Bulk insert completed (${Date.now() - bulkStartTime}ms)`);
}

export const syncNotionSites = async () => {
    console.log('[INFO]', 'syncNotionSites', 'Starting Notion sites sync...');
    const dbId = dataBaseId.find(db => db.key === 'notion_db');
    if (dbId) {
        const filePath = await syncDataFromNotionToDb(dbId);
        await insertCsvIntoPostgres(filePath);
    }
    console.log('[INFO]', 'syncNotionSites', 'Notion sites sync completed');
}