import { QueryTypes } from "sequelize";
import { Sequelize } from "sequelize-typescript";


let sequelize: Sequelize = new Sequelize({
    database: 'defaultdb',
    host: 'vivek-tree-vivek-tree.e.aivencloud.com',
    password: process.env.POSTGRES_PD,
    username: 'avnadmin',
    port: 15050,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true, 
        rejectUnauthorized: false 
      }
    },
    define: {
      timestamps: false,
    },
  });

sequelize
    .authenticate()
    .then(() => {
      console.log(
        "✅ PostgreSQL Connection has been established successfully."
      );
    })
    .catch((err) => {
      console.error("❌ Unable to connect to the PostgreSQL database:", err);
    });


const migratePondWaterLevelData = async () => {
    console.log("Migrating pond water level data...");

    try {
        // fetch data from public schema
        const fetchQuery: string = `SELECT p."_id", p.updates FROM public.ponds p`;
        const result = await sequelize.query(fetchQuery, {type: QueryTypes.SELECT});
        result.forEach( async (row: any) => {
            const pondId = row["_id"];
            const updates = row["updates"] as string;
            if (updates) {
              const cleanedString = updates
                .replace(/None/g, 'null')
                .replace(/ObjectId\('(.*?)'\)/g, '"$1"')
                .replace(/'/g, '"')
                .replace(/datetime.datetime\(([^)]+)\)/g, (_, dateStr: string) => {
                  const [year, month, day, hour, minute] = dateStr.split(',').map(Number);
                  const date = new Date(year, month - 1, day, hour, minute)
                  return '"' + date.toISOString() + '"';
                });
  
              const dataArray: any[] = JSON.parse(cleanedString);
              const selectPond = `SELECT id FROM "14trees".ponds WHERE mongo_id = '${pondId}'`;
              const pond: any[] = await sequelize.query(selectPond, {type: QueryTypes.SELECT});
              
              for (let i = 0; i < dataArray.length; i++) {
                const selectUser = `SELECT id FROM "14trees".users WHERE mongo_id = '${dataArray[i]["user"]}'`;
                const user: any[] = await sequelize.query(selectUser, {type: QueryTypes.SELECT});

                const insertWaterLevel = `INSERT INTO "14trees".tree_update_photos (level_ft, user_id, pond_id, images, mongo_id, mongo_user_id, updated_at)
                VALUES (${dataArray[i]['levelFt']}, ${user[0]['id']}, ${pond[0]['id']}, ARRAY${dataArray[i]['images']}, '${pondId}', '${dataArray[i]["user"]}', ${dataArray[i]["date"]})`

                console.log(insertWaterLevel);
              }
            }
        })
    } catch (error: any) {
        console.error("❌ Failed to migrate pond water level data:", error);
    } finally {
      console.log("✅ pond water level data!")
    }

}

migratePondWaterLevelData();