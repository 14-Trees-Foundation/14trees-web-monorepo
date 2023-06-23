require('dotenv').config();

var destImg = process.env.DEST_IMG_FOLDER;

const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, destImg);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

var uploadImages = multer({ storage: storage})
module.exports = uploadImages;