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

    // id,Offering help with,Interest,"ORG, Group",dashboard link #2,Volunteer's Poll,Help offered,On Whatsapp,URL 1,Contact Type,Plot,dashboard link #1,_next step,All visits Details ,Phone,Active engagement,_bucket,URL,e-mail,Visit status ,Took action,Profile pic link,Volunteer contact,Interest Volunteers Poll,Name,Email,Tree,Plantation,Interested activities,Visit date #1,Zone,Card pic,Profile picture,Planted by,Date,Remarks,1st meet date,Referred by,1st meet context,Status,Date Created,Address,Date of birth,Card
    // Step 2: Define a dynamic Sequelize model based on the headers
    const tableDefinition: { [key: string]: any } = {
        id: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: true, // Assuming `id` is the primary key
        },
        'Offering help with': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Interest': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'ORG, Group': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'dashboard link #2': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Help offered': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'On Whatsapp': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Contact Type': {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        'Phone': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'e-mail': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Name': {
            type: DataTypes.STRING,
            allowNull: true,
        },
        'Email': {
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

export const syncNotionVisitUsers = async () => {
    const dbId = dataBaseId.find(db => db.key === 'visit_users');
    if (dbId) {
        // const filePath = await syncDataFromNotionToDb(dbId);
        // console.log('filePath', filePath);
        const filePath = '/home/onrush-dev/Projects/14Trees-Foundation/14trees-web-monorepo/apps/api/test_data/visit_users.csv'
        await insertCsvIntoPostgres(filePath);
    }
}