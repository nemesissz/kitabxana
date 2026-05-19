import { Router } from 'express';
import { heartbeat, getTimeStats, getStatsByPeriod } from './session.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';

const router = Router();

router.post('/heartbeat', heartbeat);
router.get('/stats', authMiddleware, roleCheck(2), getTimeStats);
router.get('/stats/period', authMiddleware, roleCheck(2), getStatsByPeriod);

export default router;
