import express from 'express';
import {
  getStats,
  getAllUsers,
  updateUserRole,
  getDashboardData,
  getSubscriptionPlans,
  updateSubscriptionPlan,
  getAllSubscriptions,
  updatePdfPrice,
  bulkUpdatePdfPrices,
  createSubscriptionPlan
} from './admin.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

// Admin seviyesi middleware'ini rola göre değiştiriyoruz
const adminMiddleware = roleCheck(2); // Minimum Admin (2) tələb olunur 

/**
 * @swagger
 * /admin/stats:
 * get:
 * tags:
 * - Admin
 * summary: Sistem statistikasını əldə etmək
 * security:
 * - BearerAuth: []
 */
router.get('/stats', authMiddleware, adminMiddleware, getStats);

/**
 * @swagger
 * /admin/users:
 * get:
 * tags:
 * - Admin
 * summary: Bütün istifadəçiləri əldə etmək
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: query
 * name: role
 * schema:
 * type: string
 * enum: [user, admin, superadmin]
 * - in: query
 * name: isVerified
 * schema:
 * type: boolean
 * - in: query
 * name: eduEmail
 * schema:
 * type: boolean
 * - in: query
 * name: search
 * schema:
 * type: string
 */
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);

/**
 * @swagger
 * /admin/users/{id}/role:
 * put:
 * tags:
 * - Admin
 * summary: İstifadəçi rolunu yeniləmək
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - role
 * properties:
 * role:
 * type: string
 * enum: [user, admin]
 */
router.put('/users/:id/role', authMiddleware, adminMiddleware, updateUserRole);

/**
 * @swagger
 * /admin/dashboard:
 * get:
 * tags:
 * - Admin
 * summary: Dashboard məlumatlarını əldə etmək
 * security:
 * - BearerAuth: []
 */
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardData);

/**
 * @swagger
 * /admin/subscription-plans:
 * get:
 * tags:
 * - Admin
 * summary: Subscription planlarını əldə etmək
 * security:
 * - BearerAuth: []
 */
router.get('/subscription-plans', authMiddleware, adminMiddleware, getSubscriptionPlans);

/**
 * @swagger
 * /admin/subscription-plans/{planId}:
 * put:
 * tags:
 * - Admin
 * summary: Subscription planını yeniləmək
 * security:
 * - BearerAuth: []
 * parameters:
 * - name: planId
 * in: path
 * required: true
 * schema:
 * type: string
 * enum: [1m, 3m, 6m, 12m]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - price
 * - durationMonths
 * - description
 * properties:
 * price:
 * type: number
 * example: 29.99
 * durationMonths:
 * type: integer
 * example: 3
 * description:
 * type: string
 * example: "3 aylıq abunəlik"
 */
router.put('/subscription-plans/:planId', authMiddleware, adminMiddleware, updateSubscriptionPlan);

router.post('/subscription-plans', authMiddleware, adminMiddleware, createSubscriptionPlan);

/**
 * @swagger
 * /admin/subscriptions:
 * get:
 * tags:
 * - Admin
 * summary: Bütün subscription-ları əldə etmək
 * security:
 * - BearerAuth: []
 */
router.get('/subscriptions', authMiddleware, adminMiddleware, getAllSubscriptions);

/**
 * @swagger
 * /admin/pdfs/{id}/price:
 * put:
 * tags:
 * - Admin
 * summary: PDF qiymətini yeniləmək
 * security:
 * - BearerAuth: []
 * parameters:
 * - name: id
 * in: path
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - price
 * properties:
 * price:
 * type: number
 * example: 5.99
 * description: PDF qiyməti (AZN)
 */
router.put('/pdfs/:id/price', authMiddleware, adminMiddleware, updatePdfPrice);

/**
 * @swagger
 * /admin/pdfs/bulk-update-prices:
 * post:
 * tags:
 * - Admin
 * summary: Bir neçə PDF-in qiymətini eyni anda yeniləmək
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - updates
 * properties:
 * updates:
 * type: array
 * items:
 * type: object
 * properties:
 * id:
 * type: integer
 * price:
 * type: number
 * example: [{id: 1, price: 5.99}, {id: 2, price: 7.50}]
 */
router.post('/pdfs/bulk-update-prices', authMiddleware, adminMiddleware, bulkUpdatePdfPrices);

export default router;