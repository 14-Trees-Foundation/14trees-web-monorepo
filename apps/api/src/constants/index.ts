require("dotenv").config();

const destImg = process.env.DEST_IMG_FOLDER;

export const constants =  {
    DEFAULT_PAGINATION_OFFSET: 0,
    DEFAULT_PAGINATION_LIMIT: 20,

    MAX_BULK_ADD_LIMIT: 1000,
    ADD_DB_BATCH_SIZE: 20,
    DEST_FOLDER: destImg,
}