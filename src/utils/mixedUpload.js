import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseUploadsDir = join(dirname(dirname(__dirname)), 'uploads');
const imageUploadsDir = join(baseUploadsDir, 'images');

if (!fs.existsSync(imageUploadsDir)) {
  fs.mkdirSync(imageUploadsDir, { recursive: true });
}

// il/ay qovluğunu dinamik yarat — 30,000+ fayl üçün
const getPdfUploadDir = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dir = join(baseUploadsDir, 'pdfs', String(year), month);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, getPdfUploadDir());
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
    fileSize: 200 * 1024 * 1024 // 200MB — actual per-user limit checked in service
  }
});

export default mixedUpload;


