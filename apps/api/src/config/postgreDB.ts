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
import { VisitorImage } from "../models/visitor_images"
import { SyncHistory } from "../models/sync_history";
import { GiftCardRequest } from "../models/gift_card_request";
import { GiftCard } from "../models/gift_card";
import { GiftCardPlot } from "../models/gift_card_plot";
import { GiftCardUserTemplate } from "../models/gift_card_user_template";
import { PlantTypeCardTemplate } from "../models/plant_type_card_template";
import { TreeCountAggregation } from "../models/tree_count_aggregation";
import { Tag } from "../models/tag";
import { UserRelation } from "../models/user_relation";
import { EmailTemplate } from "../models/email_template";
import { Payment } from "../models/payment";
import { PaymentHistory } from "../models/payment_history";
import { GiftRequestUser } from "../models/gift_request_user";
import { View, ViewPermission } from "../models/permissions";
import { GiftRedeemTransaction, GRTCard } from "../models/gift_redeem_transaction";
import DuplicateTreeSync from "../models/duplicate_tree_sync";
import { ChatMessage } from "../models/chat_message";
import { MailSub } from "../models/mail_sub";
import { PlotPlantType } from "../models/plot_plant_type";
import { EventMessage } from "../models/event_message";
import { EventImage } from "../models/event_image";
import { AutoPrsReqPlot } from "../models/auto_prs_req_plot";
import { Referral } from "../models/referral";
import { Campaign } from "../models/campaign";
import { AuthToken } from "../models/auth_token";


class Database {
  public sequelize: Sequelize;


  private POSTGRES_DB = process.env.POSTGRES_DB || 'defaultdb';
  private POSTGRES_HOST = process.env.POSTGRES_HOST || 'vivek-tree-vivek-tree.e.aivencloud.com';
  private POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '15050');
  private POSTGRES_USER = process.env.POSTGRES_USER || (process.env.NODE_ENV === 'test' ? require('os').userInfo().username : 'avnadmin');
  private POSTGRES_PD = process.env.POSTGRES_PD;
  private POSTGRES_SCHEMA = process.env.POSTGRES_SCHEMA || '14trees_2';

  constructor() {
    // Determine if we should use SSL based on environment
    const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';
    const isLocalhost = this.POSTGRES_HOST === 'localhost' || this.POSTGRES_HOST === '127.0.0.1';
    
    const dialectOptions = isTestEnvironment || isLocalhost ? 
      {} : // No SSL for test/local environments
      {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
      };

    this.sequelize = new Sequelize({
      database: this.POSTGRES_DB,
      username: this.POSTGRES_USER,
      password: this.POSTGRES_PD,
      host: this.POSTGRES_HOST,
      schema: this.POSTGRES_SCHEMA,
      port: this.POSTGRES_PORT,
      attributeBehavior: 'escape',
      dialect: "postgres",
      dialectOptions,
      pool: {
        max: 5,      // Maximum number of connections in pool
        min: 2,       // Minimum number of connections in pool
        acquire: 30000, // Maximum time, in milliseconds, that pool will try to get connection before throwing error
        idle: 10000,    // Maximum time, in milliseconds, that a connection can be idle before being released
        evict: 1000     // The time interval, in milliseconds, after which sequelize-pool will remove idle connections
      },
      define: {
        timestamps: false,
      },
      logging: false,
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
        EventMessage,
        EventImage,
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
        VisitorImage,
        VisitUsers,
        SyncHistory,
        GiftCard,
        GiftCardRequest,
        GiftCardPlot,
        GiftCardUserTemplate,
        GiftRequestUser,
        PlantTypeCardTemplate,
        TreeCountAggregation,
        PlotPlantType,
        Tag,
        UserRelation,
        EmailTemplate,
        Payment,
        PaymentHistory,
        View,
        ViewPermission,
        GiftRedeemTransaction,
        GRTCard,
        DuplicateTreeSync,
        ChatMessage,
        MailSub,
        AutoPrsReqPlot,
        Referral,
        Campaign,
        AuthToken,
      ]
    });

    this.sequelize
      .authenticate()
      .then(() => {
        console.log(
          "✅ PostgreSQL Connection has been established successfully."
        );
        console.log(`🗄️  Using database schema: ${this.POSTGRES_SCHEMA}`);
        console.log(`📊 Connected to database: ${this.POSTGRES_DB} on ${this.POSTGRES_HOST}:${this.POSTGRES_PORT}`);
        console.log(`🏊 Connection pool configured: max=${this.sequelize.options.pool?.max}, min=${this.sequelize.options.pool?.min}`);
      })
      .catch((err) => {
        console.error("❌ Unable to connect to the PostgreSQL database:", err);
      });

    // Log connection pool status periodically in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(async () => {
        const pool = (this.sequelize.connectionManager as any).pool;
        if (pool) {
          // Try to access the correct properties based on sequelize-pool structure
          const used = pool._inUseObjects?.length || 0;
          const available = pool._availableObjects?.length || 0;
          const pending = pool._pendingAcquires?.length || 0;
          const total = pool._count || 0;
          
          // console.log(`🔍 Pool Status - Used: ${used}, Available: ${available}, Pending: ${pending}, Total: ${total}`);
          
          // Additional pool health information
          if (used + available !== total && total > 0) {
            console.log(`⚠️  Pool inconsistency detected: Used(${used}) + Available(${available}) ≠ Total(${total})`);
          }
          
          // Log pool utilization percentage
          const maxConnections = this.sequelize.options.pool?.max || 5;
          const utilization = total > 0 ? Math.round((used / maxConnections) * 100) : 0;
          // console.log(`📊 Pool Utilization: ${utilization}% (${used}/${maxConnections} max connections)`);
          
          // If the above doesn't work, try alternative approach
          if (used === 0 && available === 0 && pending === 0 && total === 0) {
            try {
              // Test if pool is working by attempting a simple query
              const startTime = Date.now();
              await this.sequelize.query('SELECT 1 as test');
              const queryTime = Date.now() - startTime;
              console.log(`✅ Pool is working - Test query executed in ${queryTime}ms`);
              console.log(`📋 Pool Config - Max: ${maxConnections}, Min: ${this.sequelize.options.pool?.min || 2}`);
            } catch (error) {
              console.log(`❌ Pool test query failed:`, error instanceof Error ? error.message : String(error));
            }
          }
        } else {
          console.log(`❌ Pool not accessible via connectionManager.pool`);
          // Log pool configuration even if we can't access the pool object
          const poolConfig = this.sequelize.options.pool;
          if (poolConfig) {
            console.log(`📋 Pool Config - Max: ${poolConfig.max}, Min: ${poolConfig.min}, Acquire: ${poolConfig.acquire}ms, Idle: ${poolConfig.idle}ms`);
          }
        }
      }, 30000); // Log every 30 seconds
    }
  }
}

const db = new Database();
export const sequelize =  db.sequelize;

export default Database;