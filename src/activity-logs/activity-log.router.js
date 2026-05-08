import express from 'express';
import { getActivityLogs } from './activity-log.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, roleCheck(2), getActivityLogs);

export default router;
