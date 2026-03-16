import fs from 'fs';
import path from 'path';
import { sequelize } from '../config/postgreDB';

const schema = process.env.POSTGRES_SCHEMA || '14trees_2';
const sqlFilePath = path.join(__dirname, 'analyticsViews.sql');

const getStatements = (): string[] => {
    const sqlTemplate = fs.readFileSync(sqlFilePath, 'utf8');
    const sql = sqlTemplate.replace(/__SCHEMA__/g, schema);

    return sql
        .split(';')
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);
};

const run = async () => {
    const statements = getStatements();

    for (let index = 0; index < statements.length; index += 1) {
        const statement = statements[index];
        const statementLabel = `statement ${index + 1}/${statements.length}`;

        try {
            await sequelize.query(statement);
            console.log(`[analytics-migration] ${statementLabel} succeeded`);
        } catch (error) {
            console.error(`[analytics-migration] ${statementLabel} failed`);
            console.error(error);
            process.exitCode = 1;
        }
    }
};

run()
    .then(async () => {
        await sequelize.close();
    })
    .catch(async (error) => {
        console.error('[analytics-migration] unexpected failure');
        console.error(error);
        process.exitCode = 1;
        await sequelize.close();
    });
