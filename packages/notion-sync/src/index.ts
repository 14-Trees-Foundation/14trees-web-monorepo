import fs from "fs";
import path from "path";
import fetchContent from "./fetch-content";
import { parseArgs } from "node:util";
import cliProgress from "cli-progress";
import { error, log, warn } from "./utils/logging";
import fetch from "node-fetch";

const args = parseArgs({
  options: {
    apiKey: {
      type: "string",
      alias: "k",
      description: "Notion API Key",
    },
    out: {
      type: "string",
      alias: "o",
      description: "Output directory",
    },
  },
});

const dbs = [
  {
    id: "b0961650e64842c7b9c72d88843d9554",
    name: "Team",
  },
  // {
  //   id: "5e57e7be0da44fc7a3c409925daf10a5",
  //   name: "Testimonials"
  // }
];

const apiKey = args.values.apiKey || process.env.NOTION_API_KEY;

function getOutputDirectory() {
  let outDir = args.values.out;
  if (!outDir) {
    outDir = path.join(__dirname || "notion-content");
    if (!fs.existsSync(outDir)) {
      // create the directory if it doesn't exist
      warn(`No output directory provided, using ${outDir}`);
      fs.mkdirSync(outDir);
    }
  } else if (!fs.statSync(outDir).isDirectory()) {
    throw new Error(`${outDir} is not a directory`);
  }
  return outDir;
}

const fetchContentMain = async (apiKey: string, outDir: string) => {
  const data = await fetchContent(apiKey, dbs);
  for (const db of data) {
    const dbOutDir = path.join(outDir, db.name);
    if (!fs.existsSync(dbOutDir)) {
      fs.mkdirSync(dbOutDir);
    }
    fs.writeFileSync(
      path.join(dbOutDir, `${db.name}.json`),
      JSON.stringify(db.data, null, 2)
    );
    fs.writeFileSync(
      path.join(dbOutDir, `${db.name}.describe.json`),
      db.describe
    );
    fs.writeFileSync(path.join(outDir, `${db.name}.d.ts`), db.types);
    log(`Wrote ${db.name} to ${dbOutDir}/${db.name}.json ✅`);

    if (db.files && db.files.length > 0) {
      await downloadAllFiles(db.files, dbOutDir);
    }
  }
};

try {
  if (!apiKey) {
    throw new Error("No API key provided");
  }

  let outDir = getOutputDirectory();
  fetchContentMain(apiKey, outDir);
} catch (e) {
  error(e);
}

async function downloadAllFiles(
  allFiles: { id: string; url: string }[][],
  outDir: string
) {
  if (allFiles) {
    log(`Downloading ${allFiles.length} files...`);
    const filesDir = path.join(outDir, "files");
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir);
    }
    const downloadFile = async (file: { id: string; url: string }) => {
      const filePath = path.join(filesDir, file.id);
      const fileStream = fs.createWriteStream(filePath);
      const response = await fetch(file.url);
      if (!response.ok || !response.body) {
        log(`Failed to fetch file ${file.id}: ${response.statusText}`);
      } else {
        response.body.pipe(fileStream);
      }
    };
    const files = allFiles.flat();
    await Promise.all(files.map(downloadFile));
  }
}
