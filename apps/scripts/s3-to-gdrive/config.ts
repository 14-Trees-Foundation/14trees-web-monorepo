export const CONFIG = {
  eventName: "Subrata_Birthday_Event_2025", // Google Drive folder name

  sqlQuery: "select image from \"14trees\".trees where sponsored_by_user  = 10019 limit 2000;",

  db: {
    host: "vivek-tree-vivek-tree.e.aivencloud.com",
    port: 15050,
    database: "defaultdb",
    user: "reader14t",
    password: "",
    ssl: {
        rejectUnauthorized: false, // for dev, disables cert check
    },
  },

  localDownloadDir: "s3datadump",

  google: {
    credentialsFile: "credentials.json", // OAuth client secrets
    tokenFile: "token.json",             // Saved user token
  },
  parallel: {
    download: 5, // number of parallel downloads
    upload: 3,   // number of parallel uploads
  },
};