import { Client } from "@notionhq/client";
import { log } from "./utils/logging";
import getJsonSchemaFromNotionDB, {
  extractNotionProperties,
} from "./utils/notionJsonSchema";
import jsonSchemaToTSInterfaces from "./utils/schemaToTS";
import compact from "lodash/compact";

let notion: Client;

export interface NotionDatabase {
  id: string;
  name: string;
}

export interface SiteContent {
  [key: string]: any;
}

async function getSchemaAndTypes(
  name: string,
  database_id: string,
  filter?: any
) {
  try {
    const DB_description = await notion.databases.retrieve({ database_id });
    log("Fetched description ✅");
    const jsonSchema = getJsonSchemaFromNotionDB(DB_description.properties);
    log("Created JSON Schema from Description ✅");
    const types = jsonSchemaToTSInterfaces(jsonSchema, name + "Row");
    return {
      jsonSchema,
      types,
      describe: DB_description,
    };
  } catch (error) {
    log(`Error getting schema: ${error}`);
    return {
      jsonSchema: {},
      types: "",
    };
  }
}

async function fetchDB(
  name: string,
  database_id: string,
  filter: any = undefined
) {
  const { jsonSchema, describe, types } = await getSchemaAndTypes(name, database_id, filter);

  const DB = await notion.databases.query({ database_id, filter });
  const collectedPages = await Promise.all(
    DB.results.map(async (dbPage) => {
      const page = await notion.pages.retrieve({ page_id: dbPage.id });
      if (page) {
        // @ts-ignore
        return extractNotionProperties(page.properties, jsonSchema);
      }
    })
  );

  return {
    // data : collectedFields.filter((field) => field !== null);
    data: collectedPages,
    describe: JSON.stringify(describe, null, 2),
    types,
  };
}

const fetchContent = async (
  NOTION_API_KEY: string,
  databases: NotionDatabase[]
) => {
  notion = new Client({
    auth: NOTION_API_KEY,
  });

  const output = await Promise.all(
    databases.map(async (db) => {
      const { data, types, describe } = await fetchDB(db.name, db.id);
      const filteredData = compact(data);
      return {
        name: db.name,
        data: filteredData.map((row) => row.props),
        files: filteredData.map((row) => row.files),
        types,
        describe,
      };
    })
  );
  return output;
};

export default fetchContent;