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
      const { email, password } = req.body;
      
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
      // Get user from middleware
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
      
      // Get user to validate current password
      const user = await User.findByEmail(req.user.email);
      
      // Validate current password
      const isValidPassword = await User.validateCredentials(user.email, currentPassword);
      
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
  }
};

module.exports = authController;
