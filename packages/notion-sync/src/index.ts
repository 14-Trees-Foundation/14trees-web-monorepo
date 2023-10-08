import fs from 'fs';
import path from 'path';
import fetchData from './fetch-content';

const args = process.argv.slice(2);
let apiKey = process.env.NOTION_API_KEY || '';
let outDir = path.join(__dirname, '..', '..', 'data') || '';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--key') {
        apiKey = args[i + 1];
        i++;
    } else if (args[i] === '--out') {
        outDir = args[i + 1];
        i++;
    }
}

const dbs = [{
    id: "b0961650e64842c7b9c72d88843d9554",
    name: "Team",
}]

const data = fetchData(apiKey, dbs);

fs.writeFileSync(path.join(outDir, 'output.json'), JSON.stringify(data, null, 2));
