const User = require('../models/User');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Controller for user related operations
 */
const userController = {
  /**
   * Get all users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll();
      
      res.json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      logger.error(`Get all users error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los usuarios' 
      });
    }
  },
  
  /**
   * Get user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error(`Get user by ID error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener el usuario' 
      });
    }
  },
  
  /**
   * Create a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createUser: async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      
      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nombre, correo y contraseña son obligatorios' 
        });
      }
      
      // Validate role if provided
      if (role && !Object.values(config.roles).includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Rol no válido' 
        });
      }
      
      // Check if email already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'El correo electrónico ya está registrado' 
        });
      }
      
      // Create the user
      const newUser = await User.create({
        name,
        email,
        password,
        role: role || config.roles.PROCESS_LEADER
      });
      
      logger.info(`New user created: ${email}`);
      
      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: newUser
      });
    } catch (error) {
      logger.error(`Create user error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al crear el usuario' 
      });
    }
  },
  
  /**
   * Update a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role } = req.body;
      
      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }
      
      // Validate role if provided
      if (role && !Object.values(config.roles).includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Rol no válido' 
        });
      }
      
      // Regular users can only update their own profile
      if (req.user.role !== config.roles.ADMIN && req.user.id !== parseInt(id)) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para actualizar este usuario' 
        });
      }
      
      // Regular users cannot change their role
      if (req.user.role !== config.roles.ADMIN && role) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para cambiar tu rol' 
        });
      }
      
      // Update the user
      const updated = await User.update(id, { name, email, role });
      
      if (!updated) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo actualizar el usuario' 
        });
      }
      
      logger.info(`User updated: ${id}`);
      
      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente'
      });
    } catch (error) {
      logger.error(`Update user error: ${error.message}`);
      
      // Handle specific errors
      if (error.message === 'Email already in use by another user') {
        return res.status(400).json({ 
          success: false, 
          message: 'El correo electrónico ya está en uso por otro usuario' 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el usuario' 
      });
    }
  },
  
  /**
   * Delete a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent deleting the admin user who's logged in
      if (parseInt(id) === req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No puedes eliminar tu propia cuenta' 
        });
      }
      
      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }
      
      // Delete the user
      const deleted = await User.delete(id);
      
      if (!deleted) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo eliminar el usuario' 
        });
      }
      
      logger.info(`User deleted: ${id}`);
      
      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      logger.error(`Delete user error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar el usuario' 
      });
    }
  },
  
  /**
   * Get process leaders (users with process_leader role)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProcessLeaders: async (req, res) => {
    try {
      const users = await User.findAll();
      
      // Filter to get only process leaders
      const processLeaders = users.filter(user => user.role === config.roles.PROCESS_LEADER);
      
      res.json({
        success: true,
        count: processLeaders.length,
        data: processLeaders
      });
    } catch (error) {
      logger.error(`Get process leaders error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los líderes de proceso' 
      });
    }
  }
};

module.exports = userController;
