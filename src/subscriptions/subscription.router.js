import express from 'express';
import { 
  createSubscription, 
  getMySubscriptions, 
  getActiveSubscription,
  cancelSubscription,
  getPlanPrices,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  createSubscriptionAdmin,
  createSubscriptionAdminSimple
} from './subscription.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { optionalAuthMiddleware } from '../middlewares/optionalAuth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';

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
 *                 enum: [1m, 3m, 6m, 12m]
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
router.get('/prices', optionalAuthMiddleware, getPlanPrices);

/**
 * @swagger
 * /subscriptions/admin/all:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: Bütün abunəlikləri idarə etmək (Admin)
 *     security:
 *       - BearerAuth: []
 */
router.get('/admin/all', authMiddleware, roleCheck(2), getAllSubscriptions);

/**
 * @swagger
 * /subscriptions/admin/:id:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: Tək abunəliyi idarə etmək (Admin)
 *     security:
 *       - BearerAuth: []
 */
router.get('/admin/:id', authMiddleware, roleCheck(2), getSubscriptionById);

/**
 * @swagger
 * /subscriptions/admin/:id:
 *   put:
 *     tags:
 *       - Subscriptions
 *     summary: Abunəliyi yeniləmək (Admin)
 *     security:
 *       - BearerAuth: []
 */
router.put('/admin/:id', authMiddleware, roleCheck(2), updateSubscription);

/**
 * @swagger
 * /subscriptions/admin/:id:
 *   delete:
 *     tags:
 *       - Subscriptions
 *     summary: Abunəliyi silmək (Admin)
 *     security:
 *       - BearerAuth: []
 */
router.delete('/admin/:id', authMiddleware, roleCheck(2), deleteSubscription);

/**
 * @swagger
 * /subscriptions/admin/create:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Yeni abunəlik yaratmaq (Admin)
 *     security:
 *       - BearerAuth: []
 */
router.post('/admin/create', authMiddleware, roleCheck(2), createSubscriptionAdmin);

/**
 * @swagger
 * /subscriptions/admin/create-simple:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Sadələşdirilmiş abunəlik yaratmaq (Admin) - sadəcə user_id və plan
 *     security:
 *       - BearerAuth: []
 */
router.post('/admin/create-simple', authMiddleware, roleCheck(2), createSubscriptionAdminSimple);

export default router;