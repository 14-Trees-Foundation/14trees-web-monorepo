import notionFetch from "notion-sync"

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async () => {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await notionFetch(config.token as string, config.databases, config.contentDir, config.filesDir);
      return;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i < MAX_RETRIES - 1) {
        console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
        await delay(RETRY_DELAY);
      } else {
        throw error;
      }
    }
  }
};

fetchWithRetry().catch((error) => {
  console.error("All retry attempts failed:", error);
  process.exit(1);
});
