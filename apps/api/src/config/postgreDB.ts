import { Sequelize } from "sequelize-typescript";
import { Pond} from '../models/pond';



class Database {
  public sequelize: Sequelize | undefined;


  private POSTGRES_DB =  'defaultdb';
  private POSTGRES_HOST = 'vivek-tree-vivek-tree.e.aivencloud.com';
  private POSTGRES_PORT = 15050;
  private POSTGRES_USER = 'avnadmin';
  private POSTGRES_PD = ;

  constructor() {
    this.connectToPostgreSQL();
  }


  private async connectToPostgreSQL() {
    this.sequelize = new Sequelize({
      database: this.POSTGRES_DB,
      username: this.POSTGRES_USER,
      password: this.POSTGRES_PD,
      host: this.POSTGRES_HOST,
      port: this.POSTGRES_PORT,
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true, // This will help you. But you will see nwe error
          rejectUnauthorized: false // This line will fix new error
        }
      },
     models:[ Pond  ]
    });

    await this.sequelize
      .authenticate()
      .then(() => {
        console.log(
          "✅ PostgreSQL Connection has been established successfully."
        );
      })
      .catch((err) => {
        console.error("❌ Unable to connect to the PostgreSQL database:", err);
      });
  }
}

export default Database;