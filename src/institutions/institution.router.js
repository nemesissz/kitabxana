import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';
import {
  getAll, getById, create, update, remove,
  getMembers, assignUser, removeUser,
  getPublic, createJoinRequest, getJoinRequests,
  approveJoinRequest, rejectJoinRequest
} from './institution.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logosDir = join(dirname(dirname(__dirname)), 'uploads', 'institutions');
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logosDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`)
});

const logoUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Yalnız şəkil faylları qəbul edilir'), false);
  }
});

const router = express.Router();
const superAdmin = roleCheck(4);
const adminAccess = roleCheck(2);

// Public — auth tələb etmir (qeydiyyat formu üçün)
router.get('/public', getPublic);

// Join request — istifadəçi sorğu göndərir
router.post('/:id/join-request', authMiddleware, createJoinRequest);

// Admin — öz müəssisəsinin sorğularını görür / cavablandırır
router.get('/join-requests', authMiddleware, adminAccess, getJoinRequests);
router.patch('/join-requests/:id/approve', authMiddleware, adminAccess, approveJoinRequest);
router.patch('/join-requests/:id/reject', authMiddleware, adminAccess, rejectJoinRequest);

// Hamı üçün (admin panelindən)
router.get('/', authMiddleware, adminAccess, getAll);
router.get('/:id', authMiddleware, adminAccess, getById);
router.get('/:id/members', authMiddleware, adminAccess, getMembers);

// Yalnız superadmin
router.post('/', authMiddleware, superAdmin, logoUpload.single('logo'), create);
router.put('/:id', authMiddleware, superAdmin, logoUpload.single('logo'), update);
router.delete('/:id', authMiddleware, superAdmin, remove);
router.post('/:id/members', authMiddleware, superAdmin, assignUser);
router.delete('/:id/members/:userId', authMiddleware, superAdmin, removeUser);

export default router;
