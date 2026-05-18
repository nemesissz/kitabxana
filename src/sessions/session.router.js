import { Router } from 'express';
import { heartbeat, getTimeStats } from './session.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';

const router = Router();

// Anonim istifadəçilər üçün auth tələb etmir
router.post('/heartbeat', heartbeat);

// Yalnız adminlər üçün
router.get('/stats', authMiddleware, roleCheck(2), getTimeStats);

export default router;
