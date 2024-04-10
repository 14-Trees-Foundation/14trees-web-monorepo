
import { parseArgs } from "node:util";
import cliProgress from "cli-progress";
import path from "path";
import fs from "fs";
import { error, log, warn } from "./utils/logging";

import fetchContentMain from ".";
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

try {
  const apiKey = args.values.apiKey || process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error("No API key provided");
  }

  let outDir = getOutputDirectory(args.values.out);
  let dbs = getDBConfigs(args.values.databases);
  fetchContentMain(apiKey, dbs, outDir);
} catch (e) {
  error(e);
}

function getOutputDirectory(outDirArg?: string) {
  let outDir = outDirArg;
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

function getDBConfigs(databases? : string) {
  // const dbs = args.values.databases || path.join(__dirname, "databases.json");
  let dbs;
  if (databases) {
    dbs = databases;
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