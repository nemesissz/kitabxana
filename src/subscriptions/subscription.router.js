import express from 'express';
import { 
  createSubscription, 
  getMySubscriptions, 
  getActiveSubscription,
  cancelSubscription,
  getPlanPrices
} from './subscription.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /subscriptions/create:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Yeni abunəlik yaratmaq
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [1m, 3m, 6m]
 */
router.post('/create', authMiddleware, createSubscription);

/**
 * @swagger
 * /subscriptions/my:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: İstifadəçinin bütün abunəlikləri
 *     security:
 *       - BearerAuth: []
 */
router.get('/my', authMiddleware, getMySubscriptions);

/**
 * @swagger
 * /subscriptions/active:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: İstifadəçinin aktiv abunəliyi
 *     security:
 *       - BearerAuth: []
 */
router.get('/active', authMiddleware, getActiveSubscription);

/**
 * @swagger
 * /subscriptions/{subscriptionId}/cancel:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Abunəliyi ləğv etmək
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: integer
 */
router.post('/:subscriptionId/cancel', authMiddleware, cancelSubscription);

/**
 * @swagger
 * /subscriptions/prices:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: Abunəlik planlarının qiymətləri
 */
router.get('/prices', getPlanPrices);

export default router;