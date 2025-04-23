const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/opportunities/:id
 * @desc    Get opportunity by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, opportunityController.getOpportunityById);

/**
 * @route   PUT /api/opportunities/:id
 * @desc    Update opportunity
 * @access  Private
 */
router.put('/:id', authenticateToken, opportunityController.updateOpportunity);

/**
 * @route   DELETE /api/opportunities/:id
 * @desc    Delete opportunity
 * @access  Private
 */
router.delete('/:id', authenticateToken, opportunityController.deleteOpportunity);

module.exports = router;
