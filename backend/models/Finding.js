const { run, get, all } = require('../utils/database');
const logger = require('../utils/logger');

class Finding {
  /**
   * Create a new finding
   * @param {Object} findingData - Finding data
   * @returns {Object} Created finding data
   */
  static async create(findingData) {
    try {
      const {
        process_id,
        description,
        source,
        discovery_date = new Date().toISOString(),
        status = 'pending',
        created_by
      } = findingData;
      
      const result = await run(
        `INSERT INTO findings 
         (process_id, description, source, discovery_date, status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [process_id, description, source, discovery_date, status, created_by]
      );
      
      return {
        id: result.lastID,
        process_id,
        description,
        source,
        discovery_date,
        status,
        created_by,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error creating finding: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find a finding by ID
   * @param {number} id - Finding ID
   * @returns {Object|null} Finding data or null if not found
   */
  static async findById(id) {
    try {
      const finding = await get(`
        SELECT f.*, u.name as creator_name, p.name as process_name
        FROM findings f
        LEFT JOIN users u ON f.created_by = u.id
        LEFT JOIN processes p ON f.process_id = p.id
        WHERE f.id = ?
      `, [id]);
      
      return finding || null;
    } catch (error) {
      logger.error(`Error finding finding by ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get findings by process ID
   * @param {number} processId - Process ID
   * @returns {Array} Array of finding objects
   */
  static async findByProcessId(processId) {
    try {
      const findings = await all(`
        SELECT f.*, u.name as creator_name
        FROM findings f
        LEFT JOIN users u ON f.created_by = u.id
        WHERE f.process_id = ?
        ORDER BY f.discovery_date DESC
      `, [processId]);
      
      return findings;
    } catch (error) {
      logger.error(`Error finding findings by process ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update a finding
   * @param {number} id - Finding ID
   * @param {Object} findingData - Finding data to update
   * @returns {boolean} True if updated successfully
   */
  static async update(id, findingData) {
    try {
      const { description, source, discovery_date, status } = findingData;
      
      const result = await run(
        `UPDATE findings 
         SET description = ?, source = ?, discovery_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [description, source, discovery_date, status, id]
      );
      
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error updating finding: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a finding
   * @param {number} id - Finding ID
   * @returns {boolean} True if deleted successfully
   */
  static async delete(id) {
    try {
      const result = await run('DELETE FROM findings WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error deleting finding: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get findings statistics by source
   * @param {number} processId - Process ID
   * @returns {Array} Array of source statistics
   */
  static async getSourceStats(processId) {
    try {
      const stats = await all(`
        SELECT source, COUNT(*) as count
        FROM findings
        WHERE process_id = ?
        GROUP BY source
      `, [processId]);
      
      return stats;
    } catch (error) {
      logger.error(`Error getting finding source statistics: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get findings statistics by status
   * @param {number} processId - Process ID
   * @returns {Array} Array of status statistics
   */
  static async getStatusStats(processId) {
    try {
      const stats = await all(`
        SELECT status, COUNT(*) as count
        FROM findings
        WHERE process_id = ?
        GROUP BY status
      `, [processId]);
      
      return stats;
    } catch (error) {
      logger.error(`Error getting finding status statistics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Finding;
