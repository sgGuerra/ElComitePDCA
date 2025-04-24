/**
 * Simple logger utility
 */

// Get environment from environment variables
const environment = process.env.NODE_ENV || 'development';

// Define log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Set current log level based on environment
let currentLogLevel = LOG_LEVELS.INFO;
if (environment === 'development') {
  currentLogLevel = LOG_LEVELS.DEBUG;
} else if (environment === 'test') {
  currentLogLevel = LOG_LEVELS.ERROR;
}

/**
 * Format the current date and time for logs
 * @returns {string} Formatted date and time
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Logger object with methods for different log levels
 */
const logger = {
  /**
   * Log error messages
   * @param {string} message - Error message to log
   */
  error: (message) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${getTimestamp()}: ${message}`);
    }
  },
  
  /**
   * Log warning messages
   * @param {string} message - Warning message to log
   */
  warn: (message) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${getTimestamp()}: ${message}`);
    }
  },
  
  /**
   * Log informational messages
   * @param {string} message - Info message to log
   */
  info: (message) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(`[INFO] ${getTimestamp()}: ${message}`);
    }
  },
  
  /**
   * Log debug messages
   * @param {string} message - Debug message to log
   */
  debug: (message) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${getTimestamp()}: ${message}`);
    }
  },
  
  /**
   * Set the current log level
   * @param {string} level - Log level to set ('error', 'warn', 'info', 'debug')
   */
  setLogLevel: (level) => {
    const normalizedLevel = level.toUpperCase();
    if (LOG_LEVELS[normalizedLevel] !== undefined) {
      currentLogLevel = LOG_LEVELS[normalizedLevel];
    } else {
      console.warn(`Invalid log level: ${level}. Using default.`);
    }
  }
};

module.exports = logger;
