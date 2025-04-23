const { run, get, all } = require('../utils/database');
const logger = require('../utils/logger');

class Action {
  /**
   * Create a new improvement action
   * @param {Object} actionData - Action data
   * @returns {Object} Created action data
   */
  static async create(actionData) {
    try {
      const {
        process_id,
        leader_id,
        name,
        origin,
        start_date,
        due_date,
        goal,
        what,
        why,
        how,
        location,
        status = 'in_progress',
        type = 'corrective',
        created_by
      } = actionData;
      
      const result = await run(
        `INSERT INTO improvement_actions 
        (process_id, leader_id, name, origin, start_date, due_date, goal, what, why, how, where, status, type, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          process_id, leader_id, name, origin, start_date, due_date, 
          goal || null, what || null, why || null, how || null, where || null, 
          status, type, created_by
        ]
      );
      
      // Add entry to action history
      await run(
        `INSERT INTO action_history 
        (action_id, change_type, field_name, old_value, new_value, changed_by) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [result.lastID, 'create', 'status', null, status, created_by]
      );
      
      return {
        id: result.lastID,
        process_id,
        leader_id,
        name,
        origin,
        start_date,
        due_date,
        goal,
        what,
        why,
        how,
        where,
        status,
        type,
        created_by,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error creating action: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find an action by ID
   * @param {number} id - Action ID
   * @returns {Object|null} Action data or null if not found
   */
  static async findById(id) {
    try {
      const action = await get(`
        SELECT a.*, 
               p.name as process_name,
               l.name as leader_name,
               c.name as creator_name
        FROM improvement_actions a
        LEFT JOIN processes p ON a.process_id = p.id
        LEFT JOIN users l ON a.leader_id = l.id
        LEFT JOIN users c ON a.created_by = c.id
        WHERE a.id = ?
      `, [id]);
      
      if (!action) return null;
      
      // Parse JSON fields
      action.observations = JSON.parse(action.observations || '[]');
      action.files = JSON.parse(action.files || '[]');
      
      return action;
    } catch (error) {
      logger.error(`Error finding action by ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get actions by process ID
   * @param {number} processId - Process ID
   * @returns {Array} Array of action objects
   */
  static async findByProcessId(processId) {
    try {
      const actions = await all(`
        SELECT a.*, 
               l.name as leader_name,
               c.name as creator_name
        FROM improvement_actions a
        LEFT JOIN users l ON a.leader_id = l.id
        LEFT JOIN users c ON a.created_by = c.id
        WHERE a.process_id = ?
        ORDER BY a.due_date ASC
      `, [processId]);
      
      // Parse JSON fields for each action
      return actions.map(action => {
        return {
          ...action,
          observations: JSON.parse(action.observations || '[]'),
          files: JSON.parse(action.files || '[]')
        };
      });
    } catch (error) {
      logger.error(`Error finding actions by process ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get actions by leader ID
   * @param {number} leaderId - Leader ID
   * @returns {Array} Array of action objects
   */
  static async findByLeaderId(leaderId) {
    try {
      const actions = await all(`
        SELECT a.*, 
               p.name as process_name,
               c.name as creator_name
        FROM improvement_actions a
        LEFT JOIN processes p ON a.process_id = p.id
        LEFT JOIN users c ON a.created_by = c.id
        WHERE a.leader_id = ?
        ORDER BY a.due_date ASC
      `, [leaderId]);
      
      // Parse JSON fields for each action
      return actions.map(action => {
        return {
          ...action,
          observations: JSON.parse(action.observations || '[]'),
          files: JSON.parse(action.files || '[]')
        };
      });
    } catch (error) {
      logger.error(`Error finding actions by leader ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update an action
   * @param {number} id - Action ID
   * @param {Object} actionData - Action data to update
   * @param {number} userId - User ID making the update
   * @returns {boolean} True if updated successfully
   */
  static async update(id, actionData, userId) {
    try {
      // Get current action data for comparison
      const currentAction = await this.findById(id);
      if (!currentAction) {
        throw new Error('Action not found');
      }
      
      // Start a transaction
      await run('BEGIN TRANSACTION');
      
      try {
        // Track which fields changed
        const changedFields = [];
        
        // Build query and params dynamically
        let query = 'UPDATE improvement_actions SET';
        const params = [];
        
        // Check each field for changes
        const fields = [
          'leader_id', 'name', 'origin', 'start_date', 'due_date', 
          'goal', 'what', 'why', 'how', 'where', 'status', 'type'
        ];
        
        // Check which fields have changed
        for (const field of fields) {
          if (field in actionData && actionData[field] !== currentAction[field]) {
            query += ` ${field} = ?,`;
            params.push(actionData[field]);
            
            // Add to history
            await run(
              `INSERT INTO action_history 
              (action_id, change_type, field_name, old_value, new_value, changed_by) 
              VALUES (?, ?, ?, ?, ?, ?)`,
              [id, 'update', field, currentAction[field], actionData[field], userId]
            );
            
            changedFields.push(field);
          }
        }
        
        // Handle special fields: observations and files
        if ('observations' in actionData) {
          const observationsJson = JSON.stringify(actionData.observations);
          query += ` observations = ?,`;
          params.push(observationsJson);
          changedFields.push('observations');
        }
        
        if ('files' in actionData) {
          const filesJson = JSON.stringify(actionData.files);
          query += ` files = ?,`;
          params.push(filesJson);
          changedFields.push('files');
        }
        
        // Add updated_at timestamp
        query += ` updated_at = CURRENT_TIMESTAMP`;
        
        // Finish the query
        query += ` WHERE id = ?`;
        params.push(id);
        
        // Execute update if there are changes
        if (changedFields.length > 0) {
          const result = await run(query, params);
          
          // Commit transaction
          await run('COMMIT');
          
          return result.changes > 0;
        } else {
          // No changes to make
          await run('COMMIT');
          return true;
        }
      } catch (error) {
        // Rollback in case of error
        await run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      logger.error(`Error updating action: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Add an observation to an action
   * @param {number} id - Action ID
   * @param {string} observation - Observation text
   * @param {number} userId - User ID adding the observation
   * @returns {boolean} True if added successfully
   */
  static async addObservation(id, observation, userId) {
    try {
      // Get current observations
      const action = await this.findById(id);
      if (!action) {
        throw new Error('Action not found');
      }
      
      const observations = action.observations || [];
      
      // Add new observation with timestamp and user
      const newObservation = {
        text: observation,
        user_id: userId,
        timestamp: new Date().toISOString()
      };
      
      observations.push(newObservation);
      
      // Update the action
      const result = await run(
        `UPDATE improvement_actions 
         SET observations = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [JSON.stringify(observations), id]
      );
      
      // Add history entry
      await run(
        `INSERT INTO action_history 
        (action_id, change_type, field_name, old_value, new_value, changed_by) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [id, 'update', 'observations', null, observation, userId]
      );
      
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error adding observation to action: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Add a file to an action
   * @param {number} id - Action ID
   * @param {Object} fileData - File data
   * @param {number} userId - User ID adding the file
   * @returns {boolean} True if added successfully
   */
  static async addFile(id, fileData, userId) {
    try {
      // Get current files
      const action = await this.findById(id);
      if (!action) {
        throw new Error('Action not found');
      }
      
      const files = action.files || [];
      
      // Add new file with timestamp and user
      const newFile = {
        ...fileData,
        user_id: userId,
        timestamp: new Date().toISOString()
      };
      
      files.push(newFile);
      
      // Update the action
      const result = await run(
        `UPDATE improvement_actions 
         SET files = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [JSON.stringify(files), id]
      );
      
      // Add history entry
      await run(
        `INSERT INTO action_history 
        (action_id, change_type, field_name, old_value, new_value, changed_by) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [id, 'update', 'files', null, fileData.name, userId]
      );
      
      return result.changes > 0;
    } catch (error) {
      logger.error(`Error adding file to action: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete an action
   * @param {number} id - Action ID
   * @returns {boolean} True if deleted successfully
   */
  static async delete(id) {
    try {
      // Start a transaction
      await run('BEGIN TRANSACTION');
      
      try {
        // Delete related records first
        await run('DELETE FROM action_comments WHERE action_id = ?', [id]);
        await run('DELETE FROM action_history WHERE action_id = ?', [id]);
        
        // Delete the action itself
        const result = await run('DELETE FROM improvement_actions WHERE id = ?', [id]);
        
        // Commit the transaction
        await run('COMMIT');
        
        return result.changes > 0;
      } catch (error) {
        // Rollback in case of error
        await run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      logger.error(`Error deleting action: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get action history
   * @param {number} id - Action ID
   * @returns {Array} Array of history entries
   */
  static async getHistory(id) {
    try {
      const history = await all(`
        SELECT h.*, u.name as user_name
        FROM action_history h
        LEFT JOIN users u ON h.changed_by = u.id
        WHERE h.action_id = ?
        ORDER BY h.changed_at DESC
      `, [id]);
      
      return history;
    } catch (error) {
      logger.error(`Error getting action history: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Add a comment to an action
   * @param {number} id - Action ID
   * @param {string} comment - Comment text
   * @param {number} userId - User ID adding the comment
   * @returns {Object} Created comment data
   */
  static async addComment(id, comment, userId) {
    try {
      const result = await run(
        `INSERT INTO action_comments (action_id, comment, user_id) 
         VALUES (?, ?, ?)`,
        [id, comment, userId]
      );
      
      // Get the created comment with user info
      const createdComment = await get(`
        SELECT c.*, u.name as user_name
        FROM action_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `, [result.lastID]);
      
      return createdComment;
    } catch (error) {
      logger.error(`Error adding comment to action: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get comments for an action
   * @param {number} id - Action ID
   * @returns {Array} Array of comment objects
   */
  static async getComments(id) {
    try {
      const comments = await all(`
        SELECT c.*, u.name as user_name
        FROM action_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.action_id = ?
        ORDER BY c.created_at ASC
      `, [id]);
      
      return comments;
    } catch (error) {
      logger.error(`Error getting action comments: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get statistics about actions
   * @param {Object} filters - Optional filters like process_id, status, etc.
   * @returns {Object} Statistics object
   */
  static async getStatistics(filters = {}) {
    try {
      // Build query parts based on filters
      let whereClause = '';
      const params = [];
      
      if (filters.process_id) {
        whereClause += ' WHERE process_id = ?';
        params.push(filters.process_id);
      }
      
      if (filters.leader_id) {
        whereClause += whereClause ? ' AND leader_id = ?' : ' WHERE leader_id = ?';
        params.push(filters.leader_id);
      }
      
      // Get total count
      const totalQuery = `SELECT COUNT(*) as count FROM improvement_actions${whereClause}`;
      const total = await get(totalQuery, params);
      
      // Get count by status
      const statusQuery = `
        SELECT status, COUNT(*) as count 
        FROM improvement_actions${whereClause} 
        GROUP BY status
      `;
      const statusCounts = await all(statusQuery, params);
      
      // Get count by type
      const typeQuery = `
        SELECT type, COUNT(*) as count 
        FROM improvement_actions${whereClause} 
        GROUP BY type
      `;
      const typeCounts = await all(typeQuery, params);
      
      // Get upcoming actions (due in the next 14 days)
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
      const twoWeeksStr = twoWeeksLater.toISOString().split('T')[0];
      
      let upcomingWhereClause = whereClause ? 
      `${whereClause} AND due_date <= ?` : 
      'WHERE due_date <= ?';
      upcomingWhereClause += ' AND status != "completed"';
      
      const upcomingParams = [...params, twoWeeksStr];
      
      const upcomingQuery = `
        SELECT id, name, due_date, process_id, leader_id, status
        FROM improvement_actions${upcomingWhereClause}
        ORDER BY due_date ASC
        LIMIT 10
      `;
      const upcomingActions = await all(upcomingQuery, upcomingParams);
      
      // Get recently completed actions
      let completedWhereClause = whereClause ? 
        `${whereClause} AND status = "completed"` : 
        ' WHERE status = "completed"';
      
      const completedQuery = `
        SELECT id, name, due_date, process_id, leader_id, status, updated_at
        FROM improvement_actions${completedWhereClause}
        ORDER BY updated_at DESC
        LIMIT 10
      `;
      const completedActions = await all(completedQuery, params);
      
      return {
        total: total.count,
        byStatus: statusCounts,
        byType: typeCounts,
        upcoming: upcomingActions,
        completed: completedActions
      };
    } catch (error) {
      logger.error(`Error getting action statistics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Action;
