import { Client } from "@notionhq/client";

console.log("Fetching data from Notion...");
let notion: Client;

export interface NotionDatabase {
    id: string;
    name: string;
}

export interface SiteContent {
    [key: string]: any;
}

async function fetchDB(database_id: string, filter: any = undefined) {
    const DB = await notion.databases.query({
        database_id, 
        filter
    });

    const pages = [];
    const collectedFields = await Promise.all(DB.results.map(async (vol) => {
      const page = await notion.pages.retrieve({ page_id: vol.id });
      pages.push(page)
      return {
        // @ts-ignore
        name: page.properties.Name,
        // @ts-ignore
        picture: page.properties.Picture.files[0]?.file?.url || "",
        // @ts-ignore
        content: page.content || null,
      }
    }))

    return collectedFields.filter((field) => field !== null);
}


const fetchData = async (NOTION_API_KEY: string, databases: NotionDatabase[]) => {
    notion = new Client({
        auth: NOTION_API_KEY,
    }); 

    const output: {name: string, data: any}[] =  
      await Promise.all(databases.map(async (db) => {
        return {
          name: db.name,
          data: await fetchDB(db.id)
        }
      }));
    return  output;
}

export default fetchData;


