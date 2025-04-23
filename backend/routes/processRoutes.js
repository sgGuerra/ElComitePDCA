const express = require('express');
const router = express.Router();
const processController = require('../controllers/processController');
const opportunityController = require('../controllers/opportunityController');
const findingController = require('../controllers/findingController');
const actionController = require('../controllers/actionController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

/**
 * Process Routes
 */

/**
 * @route   GET /api/processes
 * @desc    Get all processes
 * @access  Private
 */
router.get('/', authenticateToken, processController.getAllProcesses);

/**
 * @route   POST /api/processes
 * @desc    Create a new process
 * @access  Private
 */
router.post('/', authenticateToken, processController.createProcess);

/**
 * @route   GET /api/processes/:id
 * @desc    Get process by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, processController.getProcessById);

/**
 * @route   PUT /api/processes/:id
 * @desc    Update process
 * @access  Private (admin or process creator)
 */
router.put('/:id', authenticateToken, processController.updateProcess);

/**
 * @route   DELETE /api/processes/:id
 * @desc    Delete process
 * @access  Private (admin or process creator)
 */
router.delete('/:id', authenticateToken, processController.deleteProcess);

/**
 * @route   GET /api/processes/:id/statistics
 * @desc    Get process statistics
 * @access  Private (admin or process creator)
 */
router.get('/:id/statistics', authenticateToken, processController.getProcessStatistics);

/**
 * Opportunity Routes (nested under processes)
 */

/**
 * @route   GET /api/processes/:processId/opportunities
 * @desc    Get all opportunities for a process
 * @access  Private
 */
router.get('/:processId/opportunities', authenticateToken, opportunityController.getOpportunitiesByProcess);

/**
 * @route   POST /api/processes/:processId/opportunities
 * @desc    Create a new opportunity for a process
 * @access  Private
 */
router.post('/:processId/opportunities', authenticateToken, opportunityController.createOpportunity);

/**
 * Finding Routes (nested under processes)
 */

/**
 * @route   GET /api/processes/:processId/findings
 * @desc    Get all findings for a process
 * @access  Private
 */
router.get('/:processId/findings', authenticateToken, findingController.getFindingsByProcess);

/**
 * @route   POST /api/processes/:processId/findings
 * @desc    Create a new finding for a process
 * @access  Private
 */
router.post('/:processId/findings', authenticateToken, findingController.createFinding);

/**
 * @route   GET /api/processes/:processId/findings/statistics
 * @desc    Get finding statistics for a process
 * @access  Private
 */
router.get('/:processId/findings/statistics', authenticateToken, findingController.getFindingStatistics);

/**
 * Action Routes (nested under processes)
 */

/**
 * @route   GET /api/processes/:processId/actions
 * @desc    Get all actions for a process
 * @access  Private
 */
router.get('/:processId/actions', authenticateToken, actionController.getActionsByProcess);

/**
 * @route   POST /api/processes/:processId/actions
 * @desc    Create a new action for a process
 * @access  Private
 */
router.post('/:processId/actions', authenticateToken, actionController.createAction);

/**
 * @route   GET /api/processes/:processId/actions/statistics
 * @desc    Get action statistics for a process
 * @access  Private
 */
router.get('/:processId/actions/statistics', authenticateToken, actionController.getActionStatistics);

module.exports = router;
