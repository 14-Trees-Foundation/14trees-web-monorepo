import { Client } from "@notionhq/client";
import { log } from "./logging";
// import {
//     quicktype,
//     InputData,
//     JSONSchemaInput,
//     FetchingJSONSchemaStore
// } from "quicktype-core";
import { get } from "http";
import getJsonSchemaFromNotionDB, { jsonSchemaToTSInterfaces } from "./utils/notionJsonSchema";

// async function quicktypeJSONSchema(targetLanguage: string, typeName: string, jsonSchemaString: string) {
//     const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());

//     // We could add multiple schemas for multiple types,
//     // but here we're just making one type from JSON schema.
//     await schemaInput.addSource({ name: typeName, schema: jsonSchemaString });

//     const inputData = new InputData();
//     inputData.addInput(schemaInput);

//     return await quicktype({
//         inputData,
//         lang: targetLanguage
//     });
// }

// async function main() {
//     const { lines: pythonPerson } = ;
//     console.log(pythonPerson.join("\n"));
// }

// main();

let notion: Client;

export interface NotionDatabase {
    id: string;
    name: string;
}

export interface SiteContent {
    [key: string]: any;
}

async function fetchDB(name: string, database_id: string, filter: any = undefined) {
    const DB_description = await notion.databases.retrieve({ database_id });
    log(`Description: ${JSON.stringify(DB_description)}`);
    const jsonSchemaString = getJsonSchemaFromNotionDB(DB_description.properties);
    log(`JSON Schema: ${JSON.stringify(jsonSchemaString)}`);
    const types = jsonSchemaToTSInterfaces(jsonSchemaString, "team")
    // const types = await quicktypeJSONSchema("typescript", name, jsonSchemaString)
    // const DB = await notion.databases.query({
    //     database_id, 
    //     filter
    // });

    // const pages = [];
    // const collectedFields = await Promise.all(DB.results.map(async (vol) => {
    //   const page = await notion.pages.retrieve({ page_id: vol.id });
    //   // @ts-ignore
    //   return page.properties
    // }))

    return {
      // data : collectedFields.filter((field) => field !== null);
      data: [],
      types
    }
}


const fetchData = async (NOTION_API_KEY: string, databases: NotionDatabase[]) => {
    notion = new Client({
        auth: NOTION_API_KEY,
    }); 

    const output: {name: string, data: any, types: any}[] =  
      await Promise.all(databases.map(async (db) => {
        const { data, types } = await fetchDB(db.name, db.id)
        return {
          name: db.name,
          data,
          types
        }
      }));
    return  output;
}

export default fetchData;