import { Sequelize } from "sequelize-typescript";

import { TreeType } from "../models/treetype_model";


class Database {
  public sequelize: Sequelize | undefined;


  private POSTGRES_DB =  'postgres';
  private POSTGRES_HOST = 'localhost';
  private POSTGRES_PORT = 5432;
  private POSTGRES_USER = 'postgres';
  private POSTGRES_PASSWORD = 'Jain3002'

  constructor() {
    this.connectToPostgreSQL();
  }


  private async connectToPostgreSQL() {
    this.sequelize = new Sequelize({
      database: this.POSTGRES_DB,
      username: this.POSTGRES_USER,
      password: this.POSTGRES_PASSWORD,
      host: this.POSTGRES_HOST,
      port: this.POSTGRES_PORT,
      dialect: "postgres",
      models:[TreeType]
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