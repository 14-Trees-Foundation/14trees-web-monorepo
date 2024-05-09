import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

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
                    if (result.properties) {
                        for (const key in result.properties) {
                            if (result.properties.hasOwnProperty(key)) {
                                const value = result.properties[key] as any
                                const type = result.properties[key].type

                                if (type == "rich_text" || type == "title") {
                                    if (value[type].length != 0) data[key] = value[type][0].plain_text;
                                } else if (type == "select") {
                                    if (value[type]) data[key] = value[type].name;
                                } else if (type == "number" || type == "files") {
                                    data[key] = value[type];
                                } else if (type == "multi_select") {
                                    data[key] = []
                                    if (value[type].length != 0) {
                                        value[type].forEach((item: any) => {
                                            data[key].push(item.name);
                                        });
                                    }
                                }
                            }
                        }
                        console.log(JSON.stringify(data, null, 2));
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


const data = getDatabaseData("72349ec04ef4414db51406715a7f9e6e");
