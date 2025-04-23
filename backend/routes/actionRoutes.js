const express = require('express');
const router = express.Router();
const actionController = require('../controllers/actionController');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

/**
 * @route   GET /api/actions/leader/:leaderId
 * @desc    Get actions by leader ID
 * @access  Private
 */
router.get('/leader/:leaderId', authenticateToken, actionController.getActionsByLeader);

/**
 * @route   GET /api/actions/statistics
 * @desc    Get action statistics
 * @access  Private
 */
router.get('/statistics', authenticateToken, actionController.getActionStatistics);

/**
 * @route   GET /api/actions/:id
 * @desc    Get action by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, actionController.getActionById);

/**
 * @route   PUT /api/actions/:id
 * @desc    Update action
 * @access  Private
 */
router.put('/:id', authenticateToken, actionController.updateAction);

/**
 * @route   DELETE /api/actions/:id
 * @desc    Delete action
 * @access  Private
 */
router.delete('/:id', authenticateToken, actionController.deleteAction);

/**
 * @route   POST /api/actions/:id/observations
 * @desc    Add observation to action
 * @access  Private
 */
router.post('/:id/observations', authenticateToken, actionController.addObservation);

/**
 * @route   POST /api/actions/:id/comments
 * @desc    Add comment to action
 * @access  Private
 */
router.post('/:id/comments', authenticateToken, actionController.addComment);

/**
 * @route   POST /api/actions/:id/files
 * @desc    Upload file for action
 * @access  Private
 */
router.post('/:id/files', 
  authenticateToken, 
  upload.single('file'), 
  handleMulterError, 
  actionController.uploadFile
);

/**
 * @route   GET /api/actions/:id/history
 * @desc    Get action history
 * @access  Private
 */
router.get('/:id/history', authenticateToken, actionController.getActionHistory);

module.exports = router;
