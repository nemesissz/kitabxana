import logger from '../utils/logger.js';

/**
 * Error logging middleware
 * Bütün xətaları log edir
 */
export const errorLogger = (err, req, res, next) => {
  // Console'a da yazdır ki görebilek
  console.error('\n🔴 ERROR LOGGER MIDDLEWARE');
  console.error('🔴 Error:', err.message);
  console.error('🔴 Path:', req.path);
  console.error('🔴 Method:', req.method);
  
  // Log error
  logger.error('Request error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
    user: req.user ? { id: req.user.id, email: req.user.email } : null,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Pass to next error handler
  next(err);
};

export default errorLogger;

