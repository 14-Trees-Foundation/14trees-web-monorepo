import { Sequelize } from "sequelize-typescript";

import { Pond } from "../models/pond";
import { PondWaterLevel } from "../models/pond_water_level";
import { Plot } from "../models/plot";
import { Org } from "../models/org";
import { PlantType } from "../models/plant_type";
import { Tree } from "../models/tree";
import { User } from "../models/user";
import { OnsiteStaff } from "../models/onsitestaff";
import { UserTree } from "../models/userprofile";
import { DeletedProfileUserTree } from "../models/deleteduserprofile";
import { Event } from "../models/events";
import { CorpEvent } from "../models/corp_events";
import { Site } from "../models/sites";
import { Group } from "../models/group";
import { UserGroup } from "../models/user_group";
import { Donation } from "../models/donation";
import { DonationUser } from "../models/donation_user";
import { Album } from "../models/albums";
import { Shift } from "../models/shift";
import { LogsInfo } from "../models/logs_info";
import { TreesSnapshot } from "../models/trees_snapshots";
import { Visit } from "../models/visits";
import { VisitUsers } from "../models/visit_users"
import { VisitImage } from "../models/visit_images"
import { SyncHistory } from "../models/sync_history";


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
      schema: "14trees_2",
      port: this.POSTGRES_PORT,
      attributeBehavior: 'escape',
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true, // This will help you. But you will see nwe error
          rejectUnauthorized: false // This line will fix new error
        },
      },
      define: {
        timestamps: false,
      },
      models:[
        Pond,
        Plot,
        Org,
        PlantType,
        User,
        OnsiteStaff,
        Tree,
        UserTree,
        DeletedProfileUserTree,
        Event,
        CorpEvent,
        Site,
        Group,
        UserGroup,
        PondWaterLevel,
        Donation,
        DonationUser,
        Album,
        Shift,
        LogsInfo,
        TreesSnapshot,
        Visit,
        VisitImage,
        VisitUsers,
        SyncHistory,
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