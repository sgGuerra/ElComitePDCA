const { run, get, all } = require('../utils/database');
const logger = require('../utils/logger');


/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - user_id
 *         - title
 *         - message
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the notification
 *         user_id:
 *           type: integer
 *           description: ID of the user this notification belongs to
 *         title:
 *           type: string
 *           description: Title of the notification
 *         message:
 *           type: string
 *           description: Content of the notification
 *         type:
 *           type: string
 *           description: Type of notification (info, action_assignment, deadline_soon, etc.)
 *           default: info
 *         read:
 *           type: integer
 *           description: Whether the notification has been read (0=unread, 1=read)
 *           default: 0
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date and time when the notification was created
 */
class Notification {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Object} Created notification data
   */
  static async create(notificationData) {
    try {
      const { user_id, title, message, type = 'info' } = notificationData;
      
      const result = await run(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [user_id, title, message, type]
      );
      
      return {
        id: result.lastID,
        user_id,
        title,
        message,
        type,
        read: 0,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error creating notification: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get notifications for a user
   * @param {number} userId - User ID
   * @param {Object} options - Options like limit, offset, and read status
   * @returns {Array} Array of notifications
   */
  static async getByUserId(userId, options = {}) {
    try {
      let query = 'SELECT * FROM notifications WHERE user_id = ?';
      const params = [userId];
      
      // Filter by read status if specified
      if (options.read !== undefined) {
        query += ' AND read = ?';
        params.push(options.read ? 1 : 0);
      }
      
      // Order by creation date, newest first
      query += ' ORDER BY created_at DESC';
      
      // Add limit and offset if specified
      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
        
        if (options.offset) {
          query += ' OFFSET ?';
          params.push(options.offset);
        }
      }
      
      const notifications = await all(query, params);
      return notifications;
    } catch (error) {
      logger.error(`Error getting notifications: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Mark a notification as read
   * @param {number} id - Notification ID
   * @returns {boolean} True if marked as read successfully
   */
  static async markAsRead(id) {
    try {
      const result = await run(
        'UPDATE notifications SET read = 1 WHERE id = ?',
        [id]
      );
      
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error marking notification as read: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   * @returns {boolean} True if marked as read successfully
   */
  static async markAllAsRead(userId) {
    try {
      const result = await run(
        'UPDATE notifications SET read = 1 WHERE user_id = ?',
        [userId]
      );
      
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error marking all notifications as read: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a notification
   * @param {number} id - Notification ID
   * @returns {boolean} True if deleted successfully
   */
  static async delete(id) {
    try {
      const result = await run('DELETE FROM notifications WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error deleting notification: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create an action assignment notification
   * @param {number} userId - User ID to notify
   * @param {Object} action - Action data
   * @returns {Object} Created notification data
   */
  static async createActionAssignment(userId, action) {
    try {
      return await this.create({
        user_id: userId,
        title: 'Nueva acción asignada',
        message: `Se te ha asignado una nueva acción de mejora: "${action.name}"`,
        type: 'action_assignment'
      });
    } catch (error) {
      logger.error(`Error creating action assignment notification: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create a deadline reminder notification
   * @param {number} userId - User ID to notify
   * @param {Object} action - Action data
   * @param {number} daysLeft - Number of days left
   * @returns {Object} Created notification data
   */
  static async createDeadlineReminder(userId, action, daysLeft) {
    try {
      let type = 'deadline_soon';
      let message = `La acción "${action.name}" vence en ${daysLeft} días.`;
      
      // If it's very close (less than 3 days) or already overdue, mark it as urgent
      if (daysLeft <= 0) {
        type = 'deadline_overdue';
        message = `¡La acción "${action.name}" ha vencido!`;
      } else if (daysLeft <= 3) {
        type = 'deadline_urgent';
        message = `¡La acción "${action.name}" vence en solo ${daysLeft} días!`;
      }
      
      return await this.create({
        user_id: userId,
        title: 'Recordatorio de vencimiento',
        message,
        type
      });
    } catch (error) {
      logger.error(`Error creating deadline reminder notification: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create a status change notification
   * @param {number} userId - User ID to notify
   * @param {Object} action - Action data
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @returns {Object} Created notification data
   */
  static async createStatusChange(userId, action, oldStatus, newStatus) {
    try {
      return await this.create({
        user_id: userId,
        title: 'Cambio de estado en acción',
        message: `La acción "${action.name}" ha cambiado de "${oldStatus}" a "${newStatus}".`,
        type: 'status_change'
      });
    } catch (error) {
      logger.error(`Error creating status change notification: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get count of unread notifications for a user
   * @param {number} userId - User ID
   * @returns {number} Count of unread notifications
   */
  static async getUnreadCount(userId) {
    try {
      const result = await get(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
        [userId]
      );
      
      return result.count;
    } catch (error) {
      logger.error(`Error getting unread notification count: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Notification;
