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
import { EventMessage } from "../models/event_message";
import { AutoPrsReqPlot } from "../models/auto_prs_req_plot";
import { Referral } from "../models/referral";
import { Campaign } from "../models/campaign";
import { AuthToken } from "../models/auth_token";


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
        GiftCard,
        GiftCardRequest,
        GiftCardPlot,
        GiftCardUserTemplate,
        GiftRequestUser,
        PlantTypeCardTemplate,
        TreeCountAggregation,
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
      })
      .catch((err) => {
        console.error("❌ Unable to connect to the PostgreSQL database:", err);
      });
  }
}

const db = new Database();
export const sequelize =  db.sequelize;

export default Database;