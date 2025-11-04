import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Simple logger that writes to console and file
 */
class Logger {
  constructor() {
    this.errorLogPath = path.join(logsDir, 'error.log');
    this.accessLogPath = path.join(logsDir, 'access.log');
  }

  /**
   * Format log message with timestamp
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
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
   * Log error
   */
  error(message, error = null) {
    const meta = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : {};
    
    const logMessage = this.formatMessage('ERROR', message, meta);
    console.error(logMessage);
    this.writeToFile(this.errorLogPath, logMessage);
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    const logMessage = this.formatMessage('WARN', message, meta);
    console.warn(logMessage);
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    const logMessage = this.formatMessage('INFO', message, meta);
    console.log(logMessage);
  }

  /**
   * Log HTTP access
   */
  access(req, res, duration) {
    const logMessage = this.formatMessage('ACCESS', `${req.method} ${req.url}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
    this.writeToFile(this.accessLogPath, logMessage);
  }

  /**
   * Log debug (only in development)
   */
  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = this.formatMessage('DEBUG', message, meta);
      console.log(logMessage);
    }
  }
}

// Create singleton instance
const logger = new Logger();

/**
 * Express middleware to log requests
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.access(req, res, duration);
  });
  
  next();
};

/**
 * Express error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', err);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default logger;
