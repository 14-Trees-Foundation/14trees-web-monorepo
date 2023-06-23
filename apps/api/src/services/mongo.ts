import { MongoClient } from 'mongodb';

const mongo_connection_string = 
  process.env.NODE_ENV === 'development' ?
  `mongodb://${process.env.LOCAL_MONGO_URL}` :
  `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PWD}@${process.env.MONGO_URL}`
const client = new MongoClient(mongo_connection_string);

async function connect() {
  await client.connect();
  return client.db(); // Returns the database object
}

export default connect;
