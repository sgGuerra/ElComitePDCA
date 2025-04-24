const express = require('express');
const router = express.Router();
const processController = require('../controllers/processController');
const opportunityController = require('../controllers/opportunityController');
const findingController = require('../controllers/findingController');
const actionController = require('../controllers/actionController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   - name: Processes
 *     description: Process management
 *   - name: Opportunities
 *     description: Opportunity management
 *   - name: Findings
 *     description: Finding management
 *   - name: Actions
 *     description: Action management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Process:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 */

/**
 * @swagger
 * /api/processes:
 *   get:
 *     summary: Get all processes
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of processes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Process'
 */
router.get('/', authenticateToken, processController.getAllProcesses);

/**
 * @swagger
 * /api/processes:
 *   post:
 *     summary: Create a new process
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Process'
 *     responses:
 *       201:
 *         description: Process created successfully
 *       400:
 *         description: Invalid request data
 */
router.post('/', authenticateToken, processController.createProcess);

/**
 * @swagger
 * /api/processes/{id}:
 *   get:
 *     summary: Get process by ID
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Process details
 *       404:
 *         description: Process not found
 */
router.get('/:id', authenticateToken, processController.getProcessById);

/**
 * @swagger
 * /api/processes/{id}:
 *   put:
 *     summary: Update process
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Process'
 *     responses:
 *       200:
 *         description: Process updated successfully
 *       404:
 *         description: Process not found
 */
router.put('/:id', authenticateToken, processController.updateProcess);

/**
 * @swagger
 * /api/processes/{id}:
 *   delete:
 *     summary: Delete process
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Process deleted successfully
 *       404:
 *         description: Process not found
 */
router.delete('/:id', authenticateToken, processController.deleteProcess);

// Continue with similar Swagger annotations for the rest of your routes
// I'll show just one example for each category

/**
 * @swagger
 * /api/processes/{processId}/opportunities:
 *   get:
 *     summary: Get all opportunities for a process
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: processId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of opportunities
 */
router.get('/:processId/opportunities', authenticateToken, opportunityController.getOpportunitiesByProcess);

/**
 * @swagger
 * /api/processes/{processId}/findings:
 *   get:
 *     summary: Get all findings for a process
 *     tags: [Findings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: processId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of findings
 */
router.get('/:processId/findings', authenticateToken, findingController.getFindingsByProcess);

/**
 * @swagger
 * /api/processes/{processId}/actions:
 *   get:
 *     summary: Get all actions for a process
 *     tags: [Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: processId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of actions
 */
router.get('/:processId/actions', authenticateToken, actionController.getActionsByProcess);

module.exports = router;
