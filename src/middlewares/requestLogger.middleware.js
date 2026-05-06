import logger from '../utils/logger.js';

/**
 * Request logging middleware
 * Bütün request-ləri log edir
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      user: req.user ? { id: req.user.id, email: req.user.email } : null
    };

    // Different log levels based on status code
    if (res.statusCode >= 500) {
      logger.error('Server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error', logData);
    } else {
      logger.debug('Request completed', logData);
    }
  });

  next();
};

export default requestLogger;

