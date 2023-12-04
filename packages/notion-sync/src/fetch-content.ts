import { Client } from "@notionhq/client";
import { log } from "./utils/logging";
import getJsonSchemaFromNotionDB, { simplifyProps } from "./utils/notionJsonSchema";
import jsonSchemaToTSInterfaces from "./utils/schemaToTS";

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
    const jsonSchema = getJsonSchemaFromNotionDB(DB_description.properties);
    log(`JSON Schema: ${JSON.stringify(jsonSchema)}`);
    const types = jsonSchemaToTSInterfaces(jsonSchema, name + "Row")

    const DB = await notion.databases.query({ database_id, filter });
    const collectedPages = await Promise.all(DB.results.map(async (dbPage) => {
      const page = await notion.pages.retrieve({ page_id: dbPage.id });
      if (page){
        // @ts-ignore
        return simplifyProps(page.properties, jsonSchema)
      }
    }))

    return {
      // data : collectedFields.filter((field) => field !== null);
      data: collectedPages,
      describe: JSON.stringify(DB_description),
      types
    }
}


const fetchData = async (NOTION_API_KEY: string, databases: NotionDatabase[]) => {
    notion = new Client({
        auth: NOTION_API_KEY,
    }); 

    const output: {name: string, data: any, types: any, describe: any}[] =  
      await Promise.all(databases.map(async (db) => {
        const { data, types, describe } = await fetchDB(db.name, db.id)
        return {
          name: db.name,
          data,
          types,
          describe
        }
      }));
    return  output;
}

export default fetchData;