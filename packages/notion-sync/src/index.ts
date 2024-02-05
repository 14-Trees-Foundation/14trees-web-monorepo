#!/usr/bin/env node

import fs from "fs";
import path from "path";
import fetchContent, { NotionDatabase } from "./fetch-content";
import { log } from "./utils/logging";
import fetch from "node-fetch";

const fetchContentMain = async (apiKey: string, dbs: NotionDatabase[], outDir: string, filesOutDir?: string) => {
  log(`Fetching content from Notion with 
    dbs: ${JSON.stringify(dbs, null, 2)}
    outDir: ${outDir}
    filesOutDir: ${filesOutDir}
  `)
  const data = await fetchContent(apiKey, dbs);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }
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
      const filesDir = filesOutDir ? filesOutDir : path.join(outDir, "files");
      if (!fs.existsSync(filesDir)) {
        fs.mkdirSync(filesDir);
      }
      await downloadAllFiles(db.files, filesDir);
    }
  }
};

async function downloadAllFiles(
  allFiles: { id: string; url: string }[][],
  filesDir: string
) {
  if (allFiles) {
    log(`Downloading ${allFiles.length} files to ${filesDir}`);
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

export default fetchContentMain;