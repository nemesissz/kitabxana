import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Şəkillər üçün qovluq yaradırıq
const uploadsDir = join(dirname(dirname(__dirname)), 'uploads', 'images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Fayl adını unique etmək üçün timestamp əlavə edirik
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Yalnız şəkil fayllarını qəbul edirik
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const error = new Error('Yalnız şəkil faylları qəbul edilir (JPEG, PNG, GIF)');
    error.status = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export default upload;