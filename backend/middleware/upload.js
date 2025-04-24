const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Middleware for file uploads
 */

// Create upload directory if it doesn't exist
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
  logger.info(`Created upload directory: ${config.uploadDir}`);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter function to validate file types
const fileFilter = (req, file, cb) => {
  if (config.allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(`Rejected file upload: ${file.originalname} (${file.mimetype})`);
    cb(new Error(`Tipo de archivo no permitido. Solo se permiten: ${config.allowedFileTypes.join(', ')}`), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxFileSize
  },
  fileFilter: fileFilter
});

/**
 * Handle multer errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `El archivo es demasiado grande. El tamaño máximo permitido es ${config.maxFileSize / (1024 * 1024)}MB.`
      });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de archivo inesperado.'
      });
    } else {
      logger.error(`Multer error: ${err.code} - ${err.message}`);
      return res.status(400).json({
        success: false,
        message: `Error al subir el archivo: ${err.message}`
      });
    }
  } else if (err) {
    // Handle other errors
    logger.error(`File upload error: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // No error, continue
  next();
};

/**
 * Remove uploaded file if request processing fails
 * @param {Object} req - Express request object
 */
const removeUploadedFile = (req) => {
  if (req.file && fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
    logger.info(`Removed uploaded file: ${req.file.path}`);
  }
};

module.exports = {
  upload,
  handleMulterError,
  removeUploadedFile
};
