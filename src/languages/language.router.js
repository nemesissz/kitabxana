import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';
import {
  getLanguages, addLanguage, removeLanguage,
  submitRequest, getRequests, getMyRequests, approveRequest, rejectRequest,
} from './language.controller.js';

const router = Router();

// Public
router.get('/', getLanguages);

// Specific paths before /:id
router.post('/requests', authMiddleware, roleCheck(2), submitRequest);
router.get('/requests/mine', authMiddleware, roleCheck(2), getMyRequests);
router.get('/requests', authMiddleware, roleCheck(2), getRequests);
router.patch('/requests/:id/approve', authMiddleware, roleCheck(2), approveRequest);
router.patch('/requests/:id/reject', authMiddleware, roleCheck(2), rejectRequest);

// By ID
router.post('/', authMiddleware, roleCheck(2), addLanguage);
router.delete('/:id', authMiddleware, roleCheck(2), removeLanguage);

export default router;
