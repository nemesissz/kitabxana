import express from 'express';
import { getUsers, createUser, getUserById, updateUser, updatePermissions, changePassword, deleteUser } from './user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

// GET bütün istifadəçilər (Minimum Admin (2) tələb olunur)
router.get('/', authMiddleware, roleCheck(2), getUsers);

// POST yeni istifadəçi (Minimum Admin (2) tələb olunur)
router.post('/', authMiddleware, roleCheck(2), createUser);

// GET istifadəçi ID-yə görə (Yalnız autentifikasiya)
router.get('/:id', authMiddleware, getUserById);

// PATCH icazələr (yalnız superadmin)
router.patch('/:id/permissions', authMiddleware, roleCheck(4), updatePermissions);

// PATCH şifrə dəyişikliyi (yalnız özü)
router.patch('/:id/password', authMiddleware, changePassword);

// PATCH istifadəçi ID-yə görə (Controller daxilində self-update istisnası yoxlanılacaq)
router.patch('/:id', authMiddleware, updateUser);

// DELETE istifadəçi ID-yə görə (Minimum Admin (2) tələb olunur)
router.delete('/:id', authMiddleware, roleCheck(2), deleteUser);

export default router;
