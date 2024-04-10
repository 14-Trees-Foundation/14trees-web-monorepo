import notionFetch from "notion-sync"

const config = {
  token: process.env.NOTION_API_KEY,
  databases: [
    {
      name: "Team",
      id: "b0961650e64842c7b9c72d88843d9554",
    },
  ],
  contentDir: "src/data/content",
  filesDir: "public/content",
};

if (!config.token) {
  throw new Error("No NOTION_API_KEY provided");
}
notionFetch(config.token, config.databases, config.contentDir, config.filesDir);
