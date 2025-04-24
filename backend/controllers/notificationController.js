const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Controller for notification related operations
 */
const notificationController = {
  /**
   * Get notifications for the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0, read } = req.query;
      
      // Parse limit and offset to integers
      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
      
      // Add read filter if specified
      if (read !== undefined) {
        options.read = read === 'true';
      }
      
      const notifications = await Notification.getByUserId(userId, options);
      
      res.json({
        success: true,
        count: notifications.length,
        data: notifications
      });
    } catch (error) {
      logger.error(`Get user notifications error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener las notificaciones' 
      });
    }
  },
  
  /**
   * Mark a notification as read
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if notification exists and belongs to the user
      const notifications = await Notification.getByUserId(req.user.id);
      const notification = notifications.find(n => n.id === parseInt(id));
      
      if (!notification) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notificación no encontrada o no pertenece al usuario' 
        });
      }
      
      const updated = await Notification.markAsRead(id);
      
      if (!updated) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo marcar la notificación como leída' 
        });
      }
      
      res.json({
        success: true,
        message: 'Notificación marcada como leída exitosamente'
      });
    } catch (error) {
      logger.error(`Mark notification as read error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al marcar la notificación como leída' 
      });
    }
  },
  
  /**
   * Mark all notifications as read
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const updated = await Notification.markAllAsRead(userId);
      
      if (!updated) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudieron marcar las notificaciones como leídas' 
        });
      }
      
      res.json({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas exitosamente'
      });
    } catch (error) {
      logger.error(`Mark all notifications as read error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al marcar todas las notificaciones como leídas' 
      });
    }
  },
  
  /**
   * Delete a notification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if notification exists and belongs to the user
      const notifications = await Notification.getByUserId(req.user.id);
      const notification = notifications.find(n => n.id === parseInt(id));
      
      if (!notification) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notificación no encontrada o no pertenece al usuario' 
        });
      }
      
      const deleted = await Notification.delete(id);
      
      if (!deleted) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo eliminar la notificación' 
        });
      }
      
      res.json({
        success: true,
        message: 'Notificación eliminada exitosamente'
      });
    } catch (error) {
      logger.error(`Delete notification error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar la notificación' 
      });
    }
  },
  
  /**
   * Get unread notification count
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const count = await Notification.getUnreadCount(userId);
      
      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      logger.error(`Get unread notification count error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener el conteo de notificaciones no leídas' 
      });
    }
  }
};

module.exports = notificationController;
