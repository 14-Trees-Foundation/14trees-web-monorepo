import { exec } from 'child_process';
import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { createObjectCsvWriter } from 'csv-writer';
interface dbIdModel {
    key: string,
    value: string
}

export const dataBaseId: dbIdModel[] = [
    { key: "notion_db", value: 'b95af058814241c3bd4cb060a93185d4' },
];

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
                    dbData.push(data);
                }
            }
        }
        hasMoreData = response.has_more;
        startCursor = response.next_cursor ? response.next_cursor : "";
    }
    return dbData;
};


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

export const syncDataFromNotionToDb = async () => {

    for (let dbId of dataBaseId) {
        const data = await getDatabaseData(dbId.value);
        const filePath = `./test_data/${dbId.key}.csv`;
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

        const output = await runCsvSqlCommand(filePath);
        console.log('Success:', dbId, output);
    }
}