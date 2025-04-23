const sqlite3 = require('sqlite3').verbose();
const config = require('../config/config');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * Database configuration and helper functions
 */

// Create database connection
const db = new sqlite3.Database(config.dbPath, (err) => {
  if (err) {
    logger.error(`Error connecting to SQLite database: ${err.message}`);
  } else {
    logger.info('Connected to SQLite database');
  }
});

/**
 * Run a SQL query with parameters
 * @param {string} query - SQL query to execute
 * @param {Array} params - Parameters for the SQL query
 * @returns {Promise} - Promise resolving to object with lastID and changes
 */
const run = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

/**
 * Get a single row from the database
 * @param {string} query - SQL query to execute
 * @param {Array} params - Parameters for the SQL query
 * @returns {Promise} - Promise resolving to a single row
 */
const get = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

/**
 * Get multiple rows from the database
 * @param {string} query - SQL query to execute
 * @param {Array} params - Parameters for the SQL query
 * @returns {Promise} - Promise resolving to an array of rows
 */
const all = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
};

/**
 * Execute multiple SQL statements in a transaction
 * @param {Function} callback - Function containing the transaction operations
 * @returns {Promise} - Promise resolving when transaction completes
 */
const transaction = async (callback) => {
  try {
    await run('BEGIN TRANSACTION');
    await callback();
    await run('COMMIT');
    return true;
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
};

/**
 * Initialize the database with required tables
 */
const initDatabase = async () => {
  try {
    // Add 'role' column to users table if it does not exist
    const userTableInfo = await all("PRAGMA table_info(users)");
    const hasRoleColumn = userTableInfo.some(col => col.name === 'role');
    if (!hasRoleColumn) {
      await run("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'process_leader'");
      logger.info("'role' column added to users table");
    }

    // Create users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'process_leader',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create processes table
    await run(`
      CREATE TABLE IF NOT EXISTS processes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create improvement_opportunities table
    await run(`
      CREATE TABLE IF NOT EXISTS improvement_opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (process_id) REFERENCES processes(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create findings table
    await run(`
      CREATE TABLE IF NOT EXISTS findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        source TEXT NOT NULL,
        discovery_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (process_id) REFERENCES processes(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create improvement_actions table
    await run(`
      CREATE TABLE IF NOT EXISTS improvement_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_id INTEGER NOT NULL,
        leader_id INTEGER,
        name TEXT NOT NULL,
        origin TEXT NOT NULL,
        start_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        goal TEXT,
        what TEXT,
        why TEXT,
        how TEXT,
        location TEXT,
        status TEXT DEFAULT 'in_progress',
        type TEXT DEFAULT 'corrective',
        observations TEXT DEFAULT '[]',
        files TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (process_id) REFERENCES processes(id),
        FOREIGN KEY (leader_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create action_history table
    await run(`
      CREATE TABLE IF NOT EXISTS action_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_id INTEGER NOT NULL,
        change_type TEXT NOT NULL,
        field_name TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_by INTEGER,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (action_id) REFERENCES improvement_actions(id),
        FOREIGN KEY (changed_by) REFERENCES users(id)
      )
    `);

    // Create action_comments table
    await run(`
      CREATE TABLE IF NOT EXISTS action_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_id INTEGER NOT NULL,
        comment TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (action_id) REFERENCES improvement_actions(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create notifications table
    await run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create files table
    await run(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        uploaded_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);
    
    // Create default admin user if none exists
    const adminExists = await get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    
    if (!adminExists || adminExists.count === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await run(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ["Admin User", "admin@elcomite.org", hashedPassword, "admin"]
      );
      logger.info("Default admin user created");
    }
    
    logger.info('Database tables initialized successfully');
    return true;
  } catch (error) {
    logger.error(`Error initializing database: ${error.message}`);
    throw error;
  }
};

module.exports = {
  db,
  run,
  get,
  all,
  transaction,
  initDatabase
};
