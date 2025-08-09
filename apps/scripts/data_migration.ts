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

const migrateUsersData = async (): Promise<boolean> => {
    console.log("Migrating users data...");

    try {
      const query = `
        INSERT INTO "14trees".users (mongo_id, name, email, user_id, phone, birth_date, created_at, updated_at)
        SELECT u."_id", u."name", u.email, u.userid, u.phone, u.dob, u.date_added, u.date_added  \
        FROM public.users AS u WHERE email IS NOT NULL;
      `

      const resp = await sequelize.query(query, {type: QueryTypes.INSERT});
      console.log('Success! Users: %d', resp[0]);
      return true;
    } catch(error: any) {
      console.log(error);
      return false;
    }
}

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
                const userId = dataArray[i]["user"];
                let user: any = null;
                if (userId !== null) {
                  const selectUser = `SELECT id FROM "14trees".users WHERE mongo_id = '${dataArray[i]["user"]}'`;
                  const users: any[] = await sequelize.query(selectUser, {type: QueryTypes.SELECT});
                  if (users.length > 0) user = users[0];
                } 

                const insertWaterLevel = `INSERT INTO "14trees".pond_water_level (id, level_ft, user_id, pond_id, image, mongo_id, mongo_user_id, updated_at)
                VALUES (DEFAULT, ${dataArray[i]['levelFt']}, ${user ? user.id : null}, ${pond[0]['id']}, ${dataArray[i]['images']?.length > 0 ? "'" + dataArray[i]['images'][0] + "'" : null}, '${pondId}', ${dataArray[i]["user"] ? "'" + dataArray[i]["user"] + "'" : null}, '${dataArray[i]["date"]}')`

                await sequelize.query(insertWaterLevel, {type: QueryTypes.INSERT});
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