const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.xlsx', '.xls', '.json', '.pdf'].includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV, Excel, JSON, and PDF files are allowed!'), false);
    }
};

module.exports = multer({ storage, fileFilter });
