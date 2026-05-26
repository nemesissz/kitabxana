import { verifyToken } from '../utils/jwt.js';
import userService from '../users/user.service.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Token təqdim edilməyib'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await userService.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'İstifadəçi tapılmadı'
      });
    }

    req.user = {
      id: user.id,
      userId: user.id, // geriye uyumluluk için
      login: user.login,
      role: user.role,
      institutionId: user.institutionId || null,
      isVerified: user.isVerified,
      eduEmail: user.eduEmail,
      profile: user.profile,
      categoryPermission: user.categoryPermission || 'request',
      languagePermission: user.languagePermission || 'request',
      pdfReviewPermission: user.pdfReviewPermission || 'none',
      uploadPermission: user.uploadPermission || 'pending',
      workerType: user.workerType || null,
    };

    next();
  } catch (error) {
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return res.status(401).json({ status: 'error', message: 'Token etibarsızdır' });
    }
    console.error('AuthMiddleware error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Server xətası' });
  }
};