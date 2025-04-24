const bcrypt = require('bcryptjs');
const { run, get, all } = require('../utils/database');
const logger = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated user ID
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           description: The user's email
 *         password:
 *           type: string
 *           description: The user's password (hashed)
 *         role:
 *           type: string
 *           description: The user's role
 *           enum: [process_leader, admin]
 *           default: process_leader
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the user was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the user was last updated
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} Created user data
   */
  static async create(userData) {
    try {
      const { name, email, password, role = 'process_leader' } = userData;
      
      // Check if user with this email already exists
      const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert the user
      const result = await run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
      );
      
      // Return created user (without password)
      return {
        id: result.lastID,
        name,
        email,
        role
      };
    } catch (error) {
      logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Object|null} User data or null if not found
   */
  static async findById(id) {
    try {
      const user = await get(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [id]
      );
      
      if (user) {
        // Add default timestamps if they don't exist in the database
        return {
          ...user,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`Error finding user by ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Object|null} User data or null if not found
   */
  static async findByEmail(email) {
    try {
      const user = await get('SELECT * FROM users WHERE email = ?', [email]);
      return user || null;
    } catch (error) {
      logger.error(`Error finding user by email: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get all users
   * @returns {Array} Array of user objects
   */
  static async findAll() {
    try {
      const users = await all(
        'SELECT id, name, email, role, created_at FROM users'
      );
      return users;
    } catch (error) {
      logger.error(`Error finding all users: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update a user
   * @param {number} id - User ID
   * @param {Object} userData - User data to update
   * @returns {boolean} True if updated successfully
   */
  static async update(id, userData) {
    try {
      const { name, email, role } = userData;
      
      // Start building the query dynamically
      let query = 'UPDATE users SET';
      const params = [];
      
      if (name) {
        query += ' name = ?,';
        params.push(name);
      }
      
      if (email) {
        // Check if new email is already taken by another user
        if (email) {
          const existingUser = await get(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, id]
          );
          if (existingUser) {
            throw new Error('Email already in use by another user');
          }
        }
        
        query += ' email = ?,';
        params.push(email);
      }
      
      if (role) {
        query += ' role = ?,';
        params.push(role);
      }
      
      // Add updated_at timestamp
      query += ' updated_at = CURRENT_TIMESTAMP';
      
      // Finish the query
      query += ' WHERE id = ?';
      params.push(id);
      
      // Execute the update
      const result = await run(query, params);
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error updating user: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update a user's password
   * @param {number} id - User ID
   * @param {string} password - New password
   * @returns {boolean} True if updated successfully
   */
  static async updatePassword(id, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, id]
      );
      
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error updating user password: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {boolean} True if deleted successfully
   */
  static async delete(id) {
    try {
      const result = await run('DELETE FROM users WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error deleting user: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Validate user credentials
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object|null} User data if credentials are valid, null otherwise
   */
  static async validateCredentials(email, password) {
    try {
      const user = await this.findByEmail(email);
      
      if (!user) {
        return null;
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error(`Error validating credentials: ${error.message}`);
      throw error;
    }
  }
}

module.exports = User;
