import { QueryTypes } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import * as fs from 'fs'
import * as path from 'path'

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

const generateKMLFragment = async () => {
    const plotId = 1373;

    const kmlFragment = `
    <Placemark id="025E0AE6E630918FC613">
        <name>sapling_id</name>
        <styleUrl>#__managed_style_07118C446F30918FF490</styleUrl>
        <Point>
            <coordinates>lat,lng,0</coordinates>
        </Point>
    </Placemark>
    `
    
    try {
       
        const selectPlotQuery = `
        SELECT * FROM "14trees_2".plots
        WHERE id = ${plotId};
        `
        const plots: any[] = await sequelize.query(selectPlotQuery, {type: QueryTypes.SELECT});
        if (plots.length > 0) {
            const plot = plots[0]
            console.log("Generating kml for ", plot.name);

            const selectTreesQuery = `
                SELECT sapling_id, location
                FROM "14trees_2".trees
                WHERE plot_id = ${plot.id};
            `

            const trees: any[] = await sequelize.query(selectTreesQuery, {type: QueryTypes.SELECT});
            for (const tree of trees) {
                console.log(tree.sapling_id, tree.location);
                const str = kmlFragment
                    .replace('sapling_id', tree.sapling_id)
                    .replace('lat', tree.location.coordinates[1])
                    .replace('lng', tree.location.coordinates[0])
                
                const filePath = path.join(__dirname, 'kml', `data.kml`);
                fs.appendFileSync(filePath, str);
            }


        }
        
    } catch (error: any) {
        console.error("❌ Failed:", error);
    } finally {
      console.log("✅ Success!")
    }
}

generateKMLFragment();