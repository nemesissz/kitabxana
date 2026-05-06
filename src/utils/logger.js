import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log directory
const logDir = path.join(__dirname, '../../logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Logger utility for application
 */
class Logger {
  constructor() {
    this.logFile = path.join(logDir, 'app.log');
    this.errorFile = path.join(logDir, 'error.log');
    this.paymentFile = path.join(logDir, 'payments.log');
  }

  /**
   * Format log message
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}\n`;
  }

  /**
   * Write to log file
   */
  writeToFile(filePath, message) {
    try {
      fs.appendFileSync(filePath, message);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Info level log
   */
  info(message, data = null) {
    const logMessage = this.formatMessage('INFO', message, data);
    console.log(`ℹ️  ${message}`, data || '');
    this.writeToFile(this.logFile, logMessage);
  }

  /**
   * Success level log
   */
  success(message, data = null) {
    const logMessage = this.formatMessage('SUCCESS', message, data);
    console.log(`✅ ${message}`, data || '');
    this.writeToFile(this.logFile, logMessage);
  }

  /**
   * Warning level log
   */
  warn(message, data = null) {
    const logMessage = this.formatMessage('WARN', message, data);
    console.warn(`⚠️  ${message}`, data || '');
    this.writeToFile(this.logFile, logMessage);
  }

  /**
   * Error level log
   */
  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      code: error.code,
      ...error
    } : null;
    
    const logMessage = this.formatMessage('ERROR', message, errorData);
    console.error(`❌ ${message}`, error || '');
    this.writeToFile(this.errorFile, logMessage);
    this.writeToFile(this.logFile, logMessage);
  }

  /**
   * Payment specific log (for audit trail)
   */
  payment(action, data) {
    const message = `Payment ${action}`;
    const logMessage = this.formatMessage('PAYMENT', message, {
      action,
      ...data,
      timestamp: new Date().toISOString()
    });
    
    console.log(`💳 ${message}`, data);
    this.writeToFile(this.paymentFile, logMessage);
    this.writeToFile(this.logFile, logMessage);
  }

  /**
   * Debug level log (only in development)
   */
  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = this.formatMessage('DEBUG', message, data);
      console.log(`🔍 ${message}`, data || '');
      this.writeToFile(this.logFile, logMessage);
    }
  }

  /**
   * Clear old logs (older than 30 days)
   */
  clearOldLogs() {
    try {
      const files = fs.readdirSync(logDir);
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

      files.forEach(file => {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Failed to clear old logs:', error);
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Clear old logs on startup (in production)
if (process.env.NODE_ENV === 'production') {
  logger.clearOldLogs();
}

export default logger;

