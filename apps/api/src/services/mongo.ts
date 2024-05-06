import { MongoClient } from "mongodb";

export const MONGO_CREATE_INDEX_MAX_TIMEOUT =
  process.env.NODE_ENV === "development" ? 50000 : 20000;

console.log("Using NODE_ENV: ", process.env.NODE_ENV);

export const getMongoDBConnectionString = () => {
  const env = process.env.NODE_ENV;
  if (env === "development") {
    if (!process.env.MONGODB_CONNECTION_STRING) {
      throw new Error("MONGO_URL is not provided");
    }
    return `mongodb://${process.env.MONGODB_CONNECTION_STRING}`;
  } else {
    if (
      !process.env.MONGO_USERNAME ||
      !process.env.MONGO_PWD ||
      !process.env.MONGO_URL
    ) {
      throw new Error("MONGO_USERNAME, MONGO_PWD or MONGO_URL is not provided");
    }

    return `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PWD}@${process.env.MONGO_URL}`;
  }
};

let client: MongoClient;

async function connect() {
  client = new MongoClient(getMongoDBConnectionString());
  await client.connect();
  return client.db(); // Returns the database object
}

export async function getClient() {
  if (!client) {
    await connect();
  }
  return client;
}

export default connect;
