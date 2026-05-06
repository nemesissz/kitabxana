import express from 'express';
import {
  getAllAdSpaces,
  getAdSpaceById,
  createAdSpace,
  updateAdSpace,
  deleteAdSpace,
  getAllAds,
  getAdById,
  getAdsByPosition,
  createAd,
  updateAd,
  deleteAd,
  trackClick,
  trackView,
  getAdStats,
  getAllStats
} from './ad.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';
import imageUpload from '../utils/imageUpload.js';

const router = express.Router();

// Public endpoints - Reklam alanları için aktif reklamları getir
router.get('/spaces/:position', getAdsByPosition);

// Public endpoints - Tıklama ve görüntülenme takibi
router.post('/:id/click', trackClick);
router.post('/:id/view', trackView);

// Admin endpoints - Reklam alanları yönetimi
router.get('/spaces', authMiddleware, roleCheck(2), getAllAdSpaces);
router.get('/spaces/:id', authMiddleware, roleCheck(2), getAdSpaceById);
router.post('/spaces', authMiddleware, roleCheck(2), createAdSpace);
router.put('/spaces/:id', authMiddleware, roleCheck(2), updateAdSpace);
router.delete('/spaces/:id', authMiddleware, roleCheck(2), deleteAdSpace);

// Admin endpoints - Reklam yönetimi
router.get('/', authMiddleware, roleCheck(2), getAllAds);
router.get('/:id', authMiddleware, roleCheck(2), getAdById);
router.post('/', authMiddleware, roleCheck(2), imageUpload.single('image'), createAd);
router.put('/:id', authMiddleware, roleCheck(2), imageUpload.single('image'), updateAd);
router.delete('/:id', authMiddleware, roleCheck(2), deleteAd);

// Admin endpoints - İstatistikler
router.get('/stats/all', authMiddleware, roleCheck(2), getAllStats);
router.get('/stats/:id', authMiddleware, roleCheck(2), getAdStats);

export default router;

