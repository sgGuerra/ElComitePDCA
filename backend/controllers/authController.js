const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Controller for authentication related operations
 */
const authController = {
  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login: async (req, res) => {
    try {
      // Log all request info for debugging
      console.log('Login request headers:', req.headers);
      console.log('Login request body:', req.body);
      
      let email, password;
      
      // Check if this is an application/x-www-form-urlencoded request (OAuth2 flow)
      if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
        // OAuth2 form request from Swagger
        email = req.body.username; // OAuth2 sends username instead of email
        password = req.body.password;
        console.log('OAuth flow detected, using username as email');
      } else {
        // Regular JSON request
        email = req.body.email;
        password = req.body.password;
      }
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Correo y contraseña son requeridos' 
        });
      }
      
      // Validate credentials
      const user = await User.validateCredentials(email, password);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciales inválidas' 
        });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          name: user.name 
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpire }
      );
      
      logger.info(`User logged in successfully: ${user.email}`);
      
      // Check if this is an OAuth2 request
      if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
        // OAuth2 response format
        return res.json({
          access_token: token,
          token_type: 'Bearer',
          expires_in: 86400, // 24 hours in seconds
          user_id: user.id,
          user_role: user.role
        });
      }
      
      // Regular JSON response format
      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error en el servidor al iniciar sesión' 
      });
    }
  },
  
  /**
   * Get current user from JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCurrentUser: async (req, res) => {
    try {
      // Get user ID from token (set by middleware)
      const userId = req.user.id;
      
      // Get user details from database
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }
      
      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        }
      });
    } catch (error) {
      logger.error(`Get current user error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error en el servidor al obtener el usuario actual' 
      });
    }
  },
  
  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual y la nueva son requeridas'
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }
      
      // Get user to validate current password
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Validate current password - get full user data with password
      const userWithPassword = await User.findByEmail(req.user.email);
      const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }
      
      // Update password
      await User.updatePassword(userId, newPassword);
      
      logger.info(`Password changed successfully for user: ${user.email}`);
      
      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      logger.error(`Change password error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor al cambiar la contraseña'
      });
    }
},

logout: async (req, res) => {
  try {
    // Since JWT is stateless, client-side logout is sufficient
    // But we can blacklist tokens in a real production app
    
    // For now, just return a successful response
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
    
    // In a production app with token blacklisting:
    // await BlacklistedToken.add(req.token, req.user.id);
    
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor al cerrar sesión' 
    });
  }
}

};

module.exports = authController;
