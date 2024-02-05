import fs from "fs";
import path from "path";
import fetchContent, { NotionDatabase } from "./fetch-content";
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
    databases: {
      type: "string",
      alias: "d",
      description: "Path to Notion databases config file (JSON)",
    },
    out: {
      type: "string",
      alias: "o",
      description: "Output directory",
    },
  },
});

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
  } else if (!fs.existsSync(outDir)) {
    warn(`Directory doesn't exist: Creating output directory ${outDir}`);
    fs.mkdirSync(outDir);
  } else if (!fs.statSync(outDir).isDirectory()) {
    throw new Error(`${outDir} is not a directory`);
  }
  return outDir;
}

function getDBConfigs() {
  // const dbs = args.values.databases || path.join(__dirname, "databases.json");
  let dbs;
  if (args.values.databases) {
    dbs = args.values.databases;
  } else {
    warn("No databases file provided, using databases.json");
    dbs = path.join(__dirname, "databases.json");
  }

  const dbsPath = path.resolve(dbs);
  if (!fs.existsSync(dbsPath)) {
    throw new Error(`Databases file not found at ${dbsPath}`);
  }
  const dbsContent = fs.readFileSync(dbsPath, "utf-8");
  return dbsContent ? JSON.parse(dbsContent) : [];
}

const fetchContentMain = async (apiKey: string, outDir: string, dbs: NotionDatabase[]) => {
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
  let dbs = getDBConfigs();
  fetchContentMain(apiKey, outDir, dbs);
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
