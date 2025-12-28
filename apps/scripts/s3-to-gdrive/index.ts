import fs from "fs";
import path from "path";
import axios from "axios";
import { Client } from "pg";
import { google } from "googleapis";
import { CONFIG } from "./config";

// Ensure download dir exists
fs.mkdirSync(CONFIG.localDownloadDir, { recursive: true });

// ------------------ DATABASE ------------------ //
async function getDbUrls(): Promise<string[]> {
  const client = new Client(CONFIG.db);
  await client.connect();
  const res = await client.query(CONFIG.sqlQuery);
  await client.end();
//   return res.rows.map((r) => r.image_url);
  return res.rows.map(r => r.image).filter(u => u && u.startsWith("http"));
}

// ------------------ HELPERS ------------------ //
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      try {
        results[i] = await tasks[i]();
      } catch (e) {
        console.error(`❌ Task ${i} failed:`, e);
      }
    }
  }

  const workers = Array.from({ length: limit }, () => worker());
  await Promise.all(workers);
  return results;
}

// ------------------ DOWNLOAD ------------------ //
async function downloadImages(urls: string[]): Promise<string[]> {
  const tasks = urls.map((url, i) => async () => {
    const filePath = path.join(CONFIG.localDownloadDir, `image_${i + 1}.jpg`);
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, response.data);
      console.log(`✅ Downloaded ${url}`);
      return filePath;
    } catch (err) {
      console.error(`❌ Failed to download ${url}`, err);
      return "";
    }
  });

  const results = await runWithConcurrency(tasks, CONFIG.parallel.download);
  return results.filter(Boolean);
}

// ------------------ GOOGLE DRIVE ------------------ //
async function authenticateGoogleDrive() {
  const { credentialsFile, tokenFile } = CONFIG.google;

  const credentials = JSON.parse(fs.readFileSync(credentialsFile, "utf-8"));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Load saved token
  if (fs.existsSync(tokenFile)) {
    oAuth2Client.setCredentials(
      JSON.parse(fs.readFileSync(tokenFile, "utf-8"))
    );
  } else {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/drive.file"],
    });
    console.log("Authorize this app by visiting:", authUrl);
    throw new Error("No token found. Run once with OAuth flow to save token.json.");
  }

  return google.drive({ version: "v3", auth: oAuth2Client });
}

async function getOrCreateFolder(
  drive: any,
  folderName: string
): Promise<string> {
  const res = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
    fields: "files(id, name)",
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id",
  });
  return folder.data.id!;
}

async function uploadFilesToDrive(
  drive: any,
  folderId: string,
  files: string[]
) {
  const tasks = files.map((filePath) => async () => {
    const fileName = path.basename(filePath);
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: "image/jpeg",
      body: fs.createReadStream(filePath),
    };

    await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id",
    });
    console.log(`☁️ Uploaded ${fileName} to Google Drive`);
    return fileName;
  });

  await runWithConcurrency(tasks, CONFIG.parallel.upload);
}

// ------------------ MAIN ------------------ //
async function main() {
  console.log("🔗 Fetching URLs from Postgres...");
  const urls = await getDbUrls();
  console.log(`Found ${urls.length} URLs`);
  console.log("URLs from DB:", urls);

  console.log("⬇️ Downloading images in parallel...");
  const files = await downloadImages(urls);

//   console.log("🔑 Authenticating Google Drive...");
//   const drive = await authenticateGoogleDrive();

//   console.log(`📂 Getting/creating folder '${CONFIG.eventName}'...`);
//   const folderId = await getOrCreateFolder(drive, CONFIG.eventName);

//   console.log("☁️ Uploading images to Google Drive in parallel...");
//   await uploadFilesToDrive(drive, folderId, files);

  console.log("🎉 Done!");
}

main().catch(console.error);
