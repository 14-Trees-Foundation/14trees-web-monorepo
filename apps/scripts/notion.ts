import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import * as fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import { dataBaseId }from './Notion_DB_credentials';

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

        try {
            const response = await notion.databases.query(query);
            if (response.results) {
                for ( let i = 0; i < response.results.length; i++) {
                    let data = {} as any
                    let result = response.results[i] as PageObjectResponse;
                    // console.log(JSON.stringify(result));
                    // break;
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
            startCursor = response.next_cursor? response.next_cursor : "";
        } catch(err) {
            console.log(err);
            hasMoreData = false;
        }
    }
    return dbData;
};

const csv_data = function(data: any) {
    // Setup header from object keys
    // const header = Object.keys(data).join(",");

    const hdr: Array<string> = [];
    const header: string[]  = data.map((d: any)=> Object.keys(d))
    // console.log(header[0][0])

    for( var i = 0 ; i<header.length ; i= i+ 1){
        for(var j = 0 ; j<header[i].length ; j++){
            const element  = header[i][j]
            if( !hdr.includes(element)){
               hdr.push(element)
            }
        }

    }
   console.log(hdr)

    // Setup values from object values
    const val: Array<any> = [];
    const values = data.map((item: any) => Object.values(item));
   
    for( var x = 0 ; x<values.length ; x= x+ 1){
        for(var y = 0 ; y<values[x].length ; y++){
            const element  = values[x][y]
           if(element == null || element == ',,,' || element == ',,' )  //stores value as NULL if satisfied
           { val.push('NULL');}
        else if( Array.isArray(element) && element.length == 0){     //stores value as NULL if satisfied
           val.push('NULL')
        }
        else{
            val.push(element)
        }
        
        } 
    }
    // console.log(val)
    // Concat header and values with a linebreak
    const csv = [hdr, val].join("\n");
   
    return csv;
};

for(let dbId of dataBaseId){
   
    // const data =  getDatabaseData(dbId.value);
    // console.log(data)

    getDatabaseData(dbId.value).then((data)=>{
        
        
        // const csv = csv_data(data)
        const filePath =  `./notion_data/${dbId.key}.csv`   //Name of the csv file 
        
        // fs.writeFile(filePath, csv, 'utf8', (err) => {
        // if (err) {
        //     console.error('An error occurred while writing the CSV file.', err);
        // } else {
        //     console.log(`CSV file saved to ${filePath}`);
        // }
        // });

        const hdr: Array<string> = [];
        const header: string[][]  = data.map((d: any)=> Object.keys(d))

        for( var i = 0 ; i<header.length ; i= i+ 1){
            for(var j = 0 ; j<header[i].length ; j++){
                const element  = header[i][j]
                if( !hdr.includes(element)){
                    hdr.push(element)
                }
            }

        }

        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: hdr.map(key => ({ id: key, title: key }))
        });
        csvWriter.writeRecords(data);
    })
    
}



