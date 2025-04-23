const { run, get, all } = require('../utils/database');
const logger = require('../utils/logger');


/**
 * @swagger
 * components:
 *   schemas:
 *     Process:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: Process ID
 *         name:
 *           type: string
 *           description: Process name
 *         description:
 *           type: string
 *           description: Process description
 *         created_by:
 *           type: integer
 *           description: ID of user who created the process
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
class Process {
  /**
   * Create a new process
   * @param {Object} processData - Process data
   * @returns {Object} Created process data
   */
  static async create(processData) {
    try {
      const { name, description, created_by } = processData;
      
      const result = await run(
        'INSERT INTO processes (name, description, created_by) VALUES (?, ?, ?)',
        [name, description || '', created_by]
      );
      
      return {
        id: result.lastID,
        name,
        description,
        created_by,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error creating process: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find a process by ID
   * @param {number} id - Process ID
   * @returns {Object|null} Process data or null if not found
   */
  static async findById(id) {
    try {
      const process = await get(`
        SELECT p.*, u.name as creator_name 
        FROM processes p 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE p.id = ?
      `, [id]);
      
      return process || null;
    } catch (error) {
      logger.error(`Error finding process by ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get all processes
   * @param {number} [userId] - Filter by user ID (created_by)
   * @returns {Array} Array of process objects
   */
  static async findAll(userId = null) {
    try {
      let query = `
        SELECT p.*, u.name as creator_name 
        FROM processes p 
        LEFT JOIN users u ON p.created_by = u.id
      `;
      
      const params = [];
      
      if (userId) {
        query += ' WHERE p.created_by = ?';
        params.push(userId);
      }
      
      query += ' ORDER BY p.created_at DESC';
      
      const processes = await all(query, params);
      return processes;
    } catch (error) {
      logger.error(`Error finding all processes: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update a process
   * @param {number} id - Process ID
   * @param {Object} processData - Process data to update
   * @returns {boolean} True if updated successfully
   */
  static async update(id, processData) {
    try {
      const { name, description } = processData;
      
      const result = await run(
        `UPDATE processes 
         SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [name, description || '', id]
      );
      
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error updating process: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a process
   * @param {number} id - Process ID
   * @returns {boolean} True if deleted successfully
   */
  static async delete(id) {
    try {
      // Start a transaction to ensure all related records are deleted
      await run('BEGIN TRANSACTION');
      
      try {
        // Delete related action comments
        await run(`
          DELETE FROM action_comments 
          WHERE action_id IN (SELECT id FROM improvement_actions WHERE process_id = ?)
        `, [id]);
        
        // Delete action history
        await run(`
          DELETE FROM action_history 
          WHERE action_id IN (SELECT id FROM improvement_actions WHERE process_id = ?)
        `, [id]);
        
        // Delete related files
        await run(`
          DELETE FROM files 
          WHERE entity_type = 'improvement_action' AND 
          entity_id IN (SELECT id FROM improvement_actions WHERE process_id = ?)
        `, [id]);
        
        // Delete improvement actions
        await run('DELETE FROM improvement_actions WHERE process_id = ?', [id]);
        
        // Delete findings
        await run('DELETE FROM findings WHERE process_id = ?', [id]);
        
        // Delete improvement opportunities
        await run('DELETE FROM improvement_opportunities WHERE process_id = ?', [id]);
        
        // Finally, delete the process itself
        const result = await run('DELETE FROM processes WHERE id = ?', [id]);
        
        // Commit the transaction
        await run('COMMIT');
        
        return result.changes > 0;
      } catch (error) {
        // Rollback in case of error
        await run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      logger.error(`Error deleting process: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get process statistics
   * @param {number} id - Process ID
   * @returns {Object} Statistics object
   */
  static async getStatistics(id) {
    try {
      // Get count of improvement opportunities
      const opportunitiesCount = await get(
        'SELECT COUNT(*) as count FROM improvement_opportunities WHERE process_id = ?',
        [id]
      );
      
      // Get count of findings
      const findingsCount = await get(
        'SELECT COUNT(*) as count FROM findings WHERE process_id = ?',
        [id]
      );
      
      // Get count of improvement actions by status
      const actionsStats = await all(`
        SELECT status, COUNT(*) as count 
        FROM improvement_actions 
        WHERE process_id = ? 
        GROUP BY status
      `, [id]);
      
      return {
        opportunities: opportunitiesCount.count || 0,
        findings: findingsCount.count || 0,
        actions: actionsStats
      };
    } catch (error) {
      logger.error(`Error getting process statistics: ${error.message}`);
      throw error;
    }
  }
}
