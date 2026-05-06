import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pdfUploadsDir = join(dirname(dirname(__dirname)), 'uploads', 'pdfs');
const imageUploadsDir = join(dirname(dirname(__dirname)), 'uploads', 'images');

if (!fs.existsSync(pdfUploadsDir)) {
  fs.mkdirSync(pdfUploadsDir, { recursive: true });
}
if (!fs.existsSync(imageUploadsDir)) {
  fs.mkdirSync(imageUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, pdfUploadsDir);
    } else if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, imageUploadsDir);
    } else {
      cb(new Error('Yalnız PDF və şəkil faylları qəbul edilir'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || (file.mimetype && file.mimetype.startsWith('image/'))) {
    cb(null, true);
  } else {
    const error = new Error('Yalnız PDF və şəkil faylları qəbul edilir');
    error.status = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const mixedUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

export default mixedUpload;


