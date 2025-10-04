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
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      eduEmail: user.eduEmail,
      profile: user.profile
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token etibarsızdır'
    });
  }
};