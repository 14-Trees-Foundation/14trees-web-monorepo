import fs from 'fs';
import path from 'path';
import fetchData from './fetch-content';
import { parseArgs } from "node:util";
import { error, log, warn } from './utils/logging';

const args = parseArgs({
    options: {
        apiKey: {
            type: 'string',
            alias: 'k',
            description: 'Notion API Key',
        },
        out: {
            type: "string",
            alias: 'o',
            description: 'Output directory',
        },
    },
})

const dbs = [{
    id: "b0961650e64842c7b9c72d88843d9554",
    name: "Team",
}]

const apiKey = args.values.apiKey || process.env.NOTION_API_KEY

function getOutputDirectory() {
    let outDir = args.values.out;
    if (!outDir) {
        outDir = path.join(__dirname || 'notion-content')
        if (!fs.existsSync(outDir)) {
            // create the directory if it doesn't exist
            warn(`No output directory provided, using ${outDir}`);
            fs.mkdirSync(outDir);
        } 
    } else if (!fs.statSync(outDir).isDirectory()) {
        throw new Error(`${outDir} is not a directory`);
    }
    return outDir
}

const fetch = async (apiKey: string, outDir: string) => {
    const data = await fetchData(apiKey, dbs);
    for (const db of data) {
        fs.writeFileSync(path.join(outDir, `${db.name}.json`), JSON.stringify(db.data, null, 2));
        fs.writeFileSync(path.join(outDir, `${db.name}.describe.json`), db.describe);
        fs.writeFileSync(path.join(outDir, `${db.name}.d.ts`), db.types);
        log(`Wrote ${db.name} to ${outDir}/${db.name}.json`);
    }
}

try {
    if (!apiKey) {
        throw new Error("No API key provided");
    } 

    let outDir = getOutputDirectory();
    fetch(apiKey, outDir);
} catch (e) {
    error(e);
}