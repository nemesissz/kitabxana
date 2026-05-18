import { verifyToken } from '../utils/jwt.js';
import userService from '../users/user.service.js';

/**
 * Optional auth middleware — token varsa DB-dən tam user çəkir (institutionId daxil),
 * token yoxdursa/yanlışdırsa req.user = null saxlayır.
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    const user = await userService.findUserById(decoded.userId || decoded.id);

    if (!user) {
      req.user = null;
      return next();
    }

    req.user = {
      id: user.id,
      userId: user.id,
      login: user.login,
      role: user.role,
      institutionId: user.institutionId || null,
      isVerified: user.isVerified,
      eduEmail: user.eduEmail,
      hasActiveSubscription: false
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export default optionalAuthMiddleware;

