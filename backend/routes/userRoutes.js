const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, checkRole, checkOwnership } = require('../middleware/auth');
const config = require('../config/config');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get('/', authenticateToken, checkRole([config.roles.ADMIN]), userController.getAllUsers);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private/Admin
 */
router.post('/', authenticateToken, checkRole([config.roles.ADMIN]), userController.createUser);

/**
 * @route   GET /api/users/process-leaders
 * @desc    Get all process leaders
 * @access  Private
 */
router.get('/process-leaders', authenticateToken, userController.getProcessLeaders);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (admin or own profile)
 */
router.get('/:id', authenticateToken, checkOwnership, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (admin or own profile)
 */
router.put('/:id', authenticateToken, checkOwnership, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', authenticateToken, checkRole([config.roles.ADMIN]), userController.deleteUser);

module.exports = router;
