import { Sequelize } from "sequelize-typescript";

// import { TreeType } from "../models/treetype";
import { Pond } from "../models/pond";
import { Plot } from "../models/plot";
import { Org } from "../models/org";
import { TreeType } from "../models/treetype";
import { Tree } from "../models/tree";
import { User } from "../models/user";
import { OnsiteStaff } from "../models/onsitestaff";


class Database {
  public sequelize: Sequelize;


  private POSTGRES_DB =  'defaultdb';
  private POSTGRES_HOST = 'vivek-tree-vivek-tree.e.aivencloud.com';
  private POSTGRES_PORT = 15050;
  private POSTGRES_USER = 'avnadmin';
  private POSTGRES_PD = process.env.POSTGRES_PD;

  constructor() {
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
      define: {
        timestamps: false,
      },
      models:[
        Pond,
        Plot,
        Org,
        TreeType,
        User,
        OnsiteStaff,
        Tree
      ]
    });

    this.sequelize
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
      define: {
        timestamps: false,
      },
      repositoryMode: true,
      // models:[Pond]
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

const db = new Database();
export const sequelize =  db.sequelize;

export default Database;