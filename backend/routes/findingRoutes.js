const express = require('express');
const router = express.Router();
const findingController = require('../controllers/findingController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/findings/:id
 * @desc    Get finding by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, findingController.getFindingById);

/**
 * @route   PUT /api/findings/:id
 * @desc    Update finding
 * @access  Private
 */
router.put('/:id', authenticateToken, findingController.updateFinding);

/**
 * @route   DELETE /api/findings/:id
 * @desc    Delete finding
 * @access  Private
 */
router.delete('/:id', authenticateToken, findingController.deleteFinding);

module.exports = router;
