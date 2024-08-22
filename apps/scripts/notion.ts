import { exec } from 'child_process';
import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import * as fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import { dataBaseId } from './Notion_DB_credentials';
import { DataTypes, Model, Sequelize } from 'sequelize';
import path from 'path';
import csv from 'csv-parser';

const notion = new Client({ auth: process.env.NOTION_API_KEY });


const getDatabaseData = async (databaseId: string) => {

    let startCursor: string | undefined
    let hasMoreData = true
    let dbData: Array<any> = []
    while (hasMoreData) {
        const query = {
            database_id: databaseId,
        } as any
        if (startCursor) {
            query["start_cursor"] = startCursor;
        }

        const response = await notion.databases.query(query);
        if (response.results) {
            for (let i = 0; i < response.results.length; i++) {
                let data = {} as any
                let result = response.results[i] as PageObjectResponse;
                // console.log(JSON.stringify(result));
                // break;
                data['id'] = result.id;
                if (result.properties) {
                    for (const key in result.properties) {
                        if (result.properties.hasOwnProperty(key)) {
                            const value = result.properties[key] as any
                            const type = result.properties[key].type

                            if (type == "rich_text" || type == "title") {
                                if (value[type].length != 0) data[key] = value[type][0].plain_text;
                            } else if (type == "select" || type == "status") {
                                if (value[type]) data[key] = value[type].name;
                            } else if (type == "date") {
                                if (value[type]) data[key] = value[type].start;
                            } else if (type == "files") {
                                data[key] = []
                                if (value[type].length != 0) {
                                    value[type].forEach((item: any) => {
                                        data[key].push(item.file.url);
                                    });
                                }
                            } else if (type == "multi_select") {
                                data[key] = []
                                if (value[type].length != 0) {
                                    value[type].forEach((item: any) => {
                                        data[key].push(item.name);
                                    });
                                }
                            } else {
                                data[key] = value[type];
                            }
                        }
                    }
                    // console.log(JSON.stringify(data, null, 2));
                    dbData.push(data);
                }
            }
        }
        hasMoreData = response.has_more;
        startCursor = response.next_cursor ? response.next_cursor : "";
    }
    return dbData;
};

async function insertCsvIntoPostgres(filePath: string, sequelize: Sequelize) {
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
              processedRow[header] = row[header] === '' ? null : row[header];
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
          allowNull: false,
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
        'dashboard done, email sent?': {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        Link: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        'Sub-item': {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        'Parent item': {
          type: DataTypes.BOOLEAN,
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
        'Site data check': {
          type: DataTypes.BOOLEAN,
          allowNull: false,
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
        }
      }
  
    class DynamicModel extends Model {}
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


const runCsvSqlCommand = async (filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Construct the command
        const command = `csvsql --overwrite --db ${process.env.pg_str} --insert ${filePath}`;

        // Execute the command
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`Stderr: ${stderr}`);
                return;
            }
            resolve(stdout);
        });
    });
}

const syncDataFromNotionToDb = async () => {
    const sequelize = new Sequelize({
        database: 'defaultdb',
        username: 'avnadmin',
        password: process.env.POSTGRES_PD,
        host: 'vivek-tree-vivek-tree.e.aivencloud.com',
        schema: '14trees_2',
        port: 15050,
        attributeBehavior: 'escape',
        dialect: "postgres",
        dialectOptions: {
          ssl: {
            require: true, // This will help you. But you will see nwe error
            rejectUnauthorized: false // This line will fix new error
          },
        },
        define: {
          timestamps: false,
        },
      });
      sequelize.authenticate();
    for (let dbId of dataBaseId) {
        try {
            const data = await getDatabaseData(dbId.value);
            const filePath = `./notion_data/${dbId.key}.csv`;
            const hdr: Array<string> = [];
            const header: string[][] = data.map((d: any) => Object.keys(d))

            for (var i = 0; i < header.length; i = i + 1) {
                for (var j = 0; j < header[i].length; j++) {
                    const element = header[i][j]
                    if (!hdr.includes(element)) hdr.push(element);
                }
            }

            const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: hdr.map(key => ({ id: key, title: key }))
            });
            await csvWriter.writeRecords(data);

            const output = await insertCsvIntoPostgres(filePath, sequelize);
            console.log('Success:', output);
        } catch (error: any) {
            console.log('[ERROR]', dbId, error);
        }
    }
}

syncDataFromNotionToDb()
.then(() => {
    console.log('-----------------FINISHED-----------------')
})
