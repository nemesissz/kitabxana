import { verifyToken } from '../utils/jwt.js';

/**
 * Optional auth middleware
 * Token varsa user məlumatlarını req.user-ə əlavə edir
 * Token yoxdursa və ya yanlışdırsa, sadəcə next() edir (xəta atmır)
 */
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // Token yoxdur, amma davam et
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }

    // Token-u verify et
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      hasActiveSubscription: decoded.hasActiveSubscription || false
    };

    next();
  } catch (error) {
    // Token yanlışdır və ya expire olub, amma davam et
    console.log('⚠️ Optional auth: Invalid token, continuing without user');
    req.user = null;
    next();
  }
};

export default optionalAuthMiddleware;

