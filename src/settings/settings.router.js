import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';
import {
  getMyLimit,
  getAllLimits,
  setDefaultLimit,
  setInstitutionLimit,
  removeInstitutionLimit,
  setUserLimit,
  removeUserLimit,
  getDailyUploadLimit,
  setDailyUploadLimit,
  getHomepageCollage,
  setHomepageCollage,
} from './settings.controller.js';

const router = Router();
const superAdmin = [authMiddleware, roleCheck(4)];

router.get('/upload-limits/me', authMiddleware, getMyLimit);
router.get('/upload-limits', ...superAdmin, getAllLimits);
router.put('/upload-limits/default', ...superAdmin, setDefaultLimit);
router.put('/upload-limits/institution/:id', ...superAdmin, setInstitutionLimit);
router.delete('/upload-limits/institution/:id', ...superAdmin, removeInstitutionLimit);
router.put('/upload-limits/user/:id', ...superAdmin, setUserLimit);
router.delete('/upload-limits/user/:id', ...superAdmin, removeUserLimit);

router.get('/daily-upload-limit', ...superAdmin, getDailyUploadLimit);
router.put('/daily-upload-limit', ...superAdmin, setDailyUploadLimit);

router.get('/homepage-collage', getHomepageCollage);
router.put('/homepage-collage', ...superAdmin, setHomepageCollage);

export default router;
