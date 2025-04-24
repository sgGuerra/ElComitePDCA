#!/usr/bin/env node

/**
 * Script to create admin users from the command line.
 * This is useful for initial setup when there are no users in the system.
 * 
 * Usage:
 *   node create-admin.js --name admin --email admin@example.com --password secretpw
 *   node create-admin.js -n admin -e admin@example.com -p secretpw
 */

const { program } = require('commander');
const readline = require('readline');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

// Load User model and controller
const User = require('../models/User');
const userController = require('../controllers/userController');
const config = require('../config/config');

// Setup command line arguments
program
  .option('-n, --name <name>', 'Name for the admin user')
  .option('-e, --email <email>', 'Email for the admin user')
  .option('-p, --password <password>', 'Password for the admin user')
  .option('-y, --yes', 'Skip confirmation prompt')
  .parse(process.argv);

const options = program.opts();

// Create readline interface for prompting user
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Connect to database
async function connectToDatabase() {
  try {
    // Using the SQLite database that's already set up in the app
    const db = require('../utils/database');
    console.log('Connected to database');
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

// Function to create admin user
async function createAdminUser(name, email, password, skipConfirmation = false) {
  try {
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      console.error(`Error: Email '${email}' already exists.`);
      return null;
    }
    
    // Confirm creation if not skipped
    if (!skipConfirmation) {
      console.log(`\nReady to create admin user:`);
      console.log(`  Name: ${name}`);
      console.log(`  Email: ${email}`);
      
      const confirmation = await prompt('\nCreate this admin user? [y/N]: ');
      if (!['y', 'yes'].includes(confirmation.toLowerCase())) {
        console.log('User creation cancelled.');
        return null;
      }
    }
    
    // Create the user using the existing User model
    const newUser = await User.create({
      name,
      email,
      password, // User.create handles password hashing
      role: 'admin' // Set role to admin
    });
    
    console.log(`Admin user '${name}' created successfully!`);
    return newUser;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return null;
  }
}

// Main function
async function main() {
  try {
    const db = await connectToDatabase();
    
    let { name, email, password, yes } = options;
    
    // Prompt for missing information
    if (!name) {
      name = await prompt('Enter name: ');
    }
    
    if (!email) {
      email = await prompt('Enter email: ');
    }
    
    if (!password) {
      password = await prompt('Enter password: ');
      const confirmPassword = await prompt('Confirm password: ');
      
      if (password !== confirmPassword) {
        console.error('Error: Passwords do not match.');
        process.exit(1);
      }
    }
    
    await createAdminUser(name, email, password, yes);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Execute the script
main();