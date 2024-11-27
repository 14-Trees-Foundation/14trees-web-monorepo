import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/postgreDB';
import { dataBaseId, syncDataFromNotionToDb } from './notion';

async function insertCsvIntoPostgres(filePath: string) {
    const fileName = path.basename(filePath, path.extname(filePath)); // Use the file name as the table name
    const headers: string[] = [];
    const records: any[] = [];

    // Step 1: Read the CSV file and gather headers and records
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
                    else {
                        processedRow[header] = row[header];
                    }
                });
                records.push(processedRow);
            })
            .on('end', () => resolve())
            .on('error', (error) => reject(error));
    });

    // Step 2: Define a dynamic Sequelize model based on the headers
    const tableDefinition: { [key: string]: any } = {
        id: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: true, // Assuming `id` is the primary key
        },
        'Common name Marathi': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Tree shape icon': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Sr No.': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Scientific Name': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Name': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Link to artwork ': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Common name English': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Grove type / Category': {
            type: DataTypes.STRING,
            allowNull: true,
        },
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
    await DynamicModel.sync({ force: true }); // `force: true` drops the table if it already exists

    // Step 4: Insert the records into the database
    await DynamicModel.bulkCreate(records);
}

export const syncNotionPlantTypeIllustrations = async () => {
    const dbId = dataBaseId.find(db => db.key === 'plant_type_illustrations');
    if (dbId) {
        const filePath = await syncDataFromNotionToDb(dbId);
        await insertCsvIntoPostgres(filePath);
    }
}