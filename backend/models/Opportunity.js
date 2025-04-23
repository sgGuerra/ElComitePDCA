const { run, get, all } = require('../utils/database');
const logger = require('../utils/logger');

class Opportunity {
  /**
   * Create a new improvement opportunity
   * @param {Object} opportunityData - Opportunity data
   * @returns {Object} Created opportunity data
   */
  static async create(opportunityData) {
    try {
      const { process_id, description, status = 'pending', created_by } = opportunityData;
      
      const result = await run(
        `INSERT INTO improvement_opportunities 
         (process_id, description, status, created_by) 
         VALUES (?, ?, ?, ?)`,
        [process_id, description, status, created_by]
      );
      
      return {
        id: result.lastID,
        process_id,
        description,
        status,
        created_by,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error creating opportunity: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find an opportunity by ID
   * @param {number} id - Opportunity ID
   * @returns {Object|null} Opportunity data or null if not found
   */
  static async findById(id) {
    try {
      const opportunity = await get(`
        SELECT o.*, u.name as creator_name, p.name as process_name
        FROM improvement_opportunities o
        LEFT JOIN users u ON o.created_by = u.id
        LEFT JOIN processes p ON o.process_id = p.id
        WHERE o.id = ?
      `, [id]);
      
      return opportunity || null;
    } catch (error) {
      logger.error(`Error finding opportunity by ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get opportunities by process ID
   * @param {number} processId - Process ID
   * @returns {Array} Array of opportunity objects
   */
  static async findByProcessId(processId) {
    try {
      const opportunities = await all(`
        SELECT o.*, u.name as creator_name
        FROM improvement_opportunities o
        LEFT JOIN users u ON o.created_by = u.id
        WHERE o.process_id = ?
        ORDER BY o.created_at DESC
      `, [processId]);
      
      return opportunities;
    } catch (error) {
      logger.error(`Error finding opportunities by process ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update an opportunity
   * @param {number} id - Opportunity ID
   * @param {Object} opportunityData - Opportunity data to update
   * @returns {boolean} True if updated successfully
   */
  static async update(id, opportunityData) {
    try {
      const { description, status } = opportunityData;
      
      const result = await run(
        `UPDATE improvement_opportunities 
         SET description = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [description, status, id]
      );
      
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error updating opportunity: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete an opportunity
   * @param {number} id - Opportunity ID
   * @returns {boolean} True if deleted successfully
   */
  static async delete(id) {
    try {
      const result = await run('DELETE FROM improvement_opportunities WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error deleting opportunity: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get count of opportunities by status
   * @param {number} processId - Process ID
   * @returns {Array} Array of status counts
   */
  static async getStatusCounts(processId) {
    try {
      const counts = await all(`
        SELECT status, COUNT(*) as count
        FROM improvement_opportunities
        WHERE process_id = ?
        GROUP BY status
      `, [processId]);
      
      return counts;
    } catch (error) {
      logger.error(`Error getting opportunity status counts: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Opportunity;
