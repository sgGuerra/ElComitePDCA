require('dotenv').config();
const path = require('path');

/**
 * Application configuration
 */
module.exports = {
  // Server configuration
  port: process.env.PORT || 5000,
  environment: process.env.NODE_ENV || 'development',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'elcomite_pdca_secret_key',
  jwtExpire: process.env.JWT_EXPIRE || '24h',
  
  // Database configuration
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite'),
  
  // File upload configuration
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  
  // Allowed file types for uploads
  allowedFileTypes: [
    'image/jpeg', 
    'image/png', 
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ],
  
  // User roles
  roles: {
    ADMIN: 'admin',
    PROCESS_LEADER: 'process_leader',
    AUDITOR: 'auditor'
  },
  
  // Application-specific constants
  actionTypes: {
    CORRECTIVE: 'corrective',
    PREVENTIVE: 'preventive',
    IMPROVEMENT: 'improvement'
  },
  
  actionStatus: {
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    DELAYED: 'delayed',
    CANCELLED: 'cancelled'
  },
  
  // Pagination defaults
  paginationDefaults: {
    limit: 10,
    page: 1
  }
};
