import express from 'express';
import { register, login, adminLogin, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword } from './auth.controller.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: İstifadəçi qeydiyyatı
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: İstifadəçi girişi (yalnız role=1)
 *     description: Yalnız adi istifadəçilər (role=1) üçün giriş. Admin və Superadmin istifadəçilər /auth/login/admin istifadə etməlidirlər.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Giriş uğurlu
 *       '403':
 *         description: Admin girişi üçün /auth/login/admin istifadə edin
 *       '401':
 *         description: Yanlış email və ya şifrə
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/login/admin:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Admin girişi
 *     description: Admin və Superadmin səlahiyyətli istifadəçilər üçün giriş
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Admin girişi uğurlu
 *       '403':
 *         description: Admin səlahiyyəti tələb olunur
 *       '401':
 *         description: Yanlış email və ya şifrə
 */
router.post('/login/admin', adminLogin);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Email təsdiqləmə
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 */
router.post('/verify-email', verifyEmail);

// GET route for email verification page (when users click email links)
router.get('/verify-email', async (req, res) => {
  const token = req.query.token;
  
  if (!token) {
    // No token provided, show error page
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Email Təsdiqləmə Xətası</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>❌ Xəta</h1>
        <p>Təsdiqləmə tokeni tapılmadı.</p>
        <p>Zəhmət olmasa email-dəki düzgün linkdən istifadə edin.</p>
      </body>
      </html>
    `);
  }

  try {
    // Import auth service dynamically
    const authService = await import('./auth.service.js');
    
    // Directly verify email using the token from URL
    await authService.default.verifyEmail(token);
    
    // Success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Email Təsdiqləndi</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>✅ Təbriklər!</h1>
        <p>Email ünvanınız uğurla təsdiqləndi.</p>
        <p>İndi sistemə giriş edə bilərsiniz.</p>
        <a href="/" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ana səhifəyə get</a>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Email verification error:', error.message);
    
    // Error page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Email Təsdiqləmə Xətası</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>❌ Xəta</h1>
        <p>Email təsdiqləmə uğursuz oldu.</p>
        <p>${error.message === 'Invalid token' ? 'Token vaxtı keçmiş və ya yanlışdır.' : error.message}</p>
        <p>Yeni təsdiqləmə linki tələb etməyi cəhd edə bilərsiniz.</p>
      </body>
      </html>
    `);
  }
});

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Email təsdiqləmə linkini yenidən göndər
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       '200':
 *         description: Təsdiqləmə emaili göndərildi
 *       '400':
 *         description: Email artıq təsdiqlənib
 *       '404':
 *         description: İstifadəçi tapılmadı
 */
router.post('/resend-verification', resendVerificationEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Şifrə yeniləmə tələbi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Şifrə yeniləmə
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 */
router.post('/reset-password', resetPassword);

// Test endpoint to generate verification token (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/test-verification/:userId', async (req, res) => {
    try {
      const { generateToken } = await import('../utils/jwt.js');
      const userService = await import('../users/user.service.js');
      
      const userId = parseInt(req.params.userId);
      const user = await userService.default.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const token = generateToken(user, '24h');
      const baseUrl = process.env.BASE_URL || (process.env.NODE_ENV === 'production' 
        ? 'https://api.muhasibatjurnal.az' 
        : `http://localhost:${process.env.PORT || 3000}`);
      const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
      
      res.json({
        token,
        verificationUrl,
        user: { id: user.id, email: user.email, isVerified: user.isVerified },
        message: 'Test verification token generated'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Fix user email endpoint
  router.post('/fix-user-email', async (req, res) => {
    try {
      const { userId, newEmail } = req.body;
      const userService = await import('../users/user.service.js');
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      
      const updatedUser = await userService.default.updateUserById(userId, { email: newEmail });
      
      res.json({
        message: 'User email updated successfully',
        user: { id: updatedUser.id, email: updatedUser.email }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

export default router;