import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { optionalAuthMiddleware } from '../middlewares/optionalAuth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';
import { getActive, getAll, getOne, create, update, remove, upload } from './announcement.controller.js';

const router = Router();

// Public feed — optionalAuth so institution filtering works for logged-in users
router.get('/', optionalAuthMiddleware, getActive);

router.get('/admin', authMiddleware, roleCheck(2), getAll);
router.get('/:id', getOne);
router.post('/', authMiddleware, roleCheck(2), upload.single('image'), create);
router.put('/:id', authMiddleware, roleCheck(2), upload.single('image'), update);
router.delete('/:id', authMiddleware, roleCheck(2), remove);

export default router;
