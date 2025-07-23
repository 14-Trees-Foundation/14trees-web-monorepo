
import { dataBaseId, syncDataFromNotionToDb } from './notion';

export const syncNotionIssues = async () => {
    const dbId = dataBaseId.find(db => db.key === 'notion_issue_features');
    if (dbId) {
        const filePath = await syncDataFromNotionToDb(dbId);
        console.log('filePath', filePath);
    }
}

export const getNotionPictures = async () => {
    const dbId = dataBaseId.find(db => db.key === 'db_pictures');
    if (dbId) {
        const filePath = await syncDataFromNotionToDb(dbId);
        console.log('filePath', filePath);
    }
}

getNotionPictures().then(() => {
    console.log('done');
}).catch((err) => {
    console.error(err);
});


