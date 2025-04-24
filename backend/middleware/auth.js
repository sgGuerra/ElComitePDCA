const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate and authorize users
 */

/**
 * Verify JWT token and add user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
  console.log('Checking for authorization...');
  
  // Look for token in various places
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const bearerToken = authHeader && authHeader.split(' ')[1];
  const queryToken = req.query.token;
  const cookieToken = req.cookies && req.cookies.token;
  
  // Use the first available token
  const token = bearerToken || queryToken || cookieToken;
  
  console.log('Auth Header:', authHeader);
  console.log('Token found:', token ? 'Yes' : 'No');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Acceso no autorizado. Token no proporcionado.' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log('Token decoded successfully:', decoded);
    
    // Add user info to request
    req.user = decoded;
    
    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    logger.error(`Authentication error: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'El token ha expirado. Por favor, inicie sesión nuevamente.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido o manipulado.' 
    });
  }
};

/**
 * Check if user has required role
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    // Check if user exists in request (should be set by authenticateToken)
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado.' 
      });
    }
    
    // Check if user has one of the required roles
    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id} (role: ${req.user.role}) - Required roles: ${roles.join(', ')}`);
      
      return res.status(403).json({ 
        success: false, 
        message: 'No tiene permiso para acceder a este recurso.' 
      });
    }
    
    // Continue to next middleware
    next();
  };
};

/**
 * Check if user is accessing their own resource
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkOwnership = (req, res, next) => {
  // Check if user exists in request (should be set by authenticateToken)
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Usuario no autenticado.' 
    });
  }
  
  // Get ID from request parameters
  const resourceId = parseInt(req.params.id);
  
  // Allow admin to access any resource
  if (req.user.role === config.roles.ADMIN) {
    return next();
  }
  
  // Allow user to access only their own resource
  if (req.user.id !== resourceId) {
    logger.warn(`Ownership check failed: User ${req.user.id} attempted to access resource ${resourceId}`);
    
    return res.status(403).json({ 
      success: false, 
      message: 'No tiene permiso para acceder a este recurso.' 
    });
  }
  
  // Continue to next middleware
  next();
};

/**
 * Check if user is the creator of a process or admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {Function} getEntity - Function to get the entity and check ownership
 */
const checkProcessOwnership = (getEntity) => {
  return async (req, res, next) => {
    try {
      // Check if user exists in request (should be set by authenticateToken)
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuario no autenticado.' 
        });
      }
      
      // Allow admin to access any resource
      if (req.user.role === config.roles.ADMIN) {
        return next();
      }
      
      // Get entity from database
      const entity = await getEntity(req);
      
      if (!entity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Recurso no encontrado.' 
        });
      }
      
      // Check if user is the creator of the entity
      if (entity.created_by !== req.user.id) {
        logger.warn(`Process ownership check failed: User ${req.user.id} attempted to access process created by ${entity.created_by}`);
        
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene permiso para acceder a este recurso.' 
        });
      }
      
      // Add entity to request for later use
      req.entity = entity;
      
      // Continue to next middleware
      next();
    } catch (error) {
      logger.error(`Process ownership check error: ${error.message}`);
      
      return res.status(500).json({ 
        success: false, 
        message: 'Error al verificar la propiedad del recurso.' 
      });
    }
  };
};

module.exports = {
  authenticateToken,
  checkRole,
  checkOwnership,
  checkProcessOwnership
};
