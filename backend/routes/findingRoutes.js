const express = require('express');
const router = express.Router();
const findingController = require('../controllers/findingController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/findings/{id}:
 *   get:
 *     summary: Get finding by ID
 *     tags: [Findings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Finding ID
 *     responses:
 *       200:
 *         description: Finding details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Finding'
 *       404:
 *         description: Finding not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, findingController.getFindingById);

/**
 * @swagger
 * /api/findings/{id}:
 *   put:
 *     summary: Update finding
 *     tags: [Findings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Finding ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FindingInput'
 *     responses:
 *       200:
 *         description: Updated finding
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Finding not found
 */
router.put('/:id', authenticateToken, findingController.updateFinding);

/**
 * @swagger
 * /api/findings/{id}:
 *   delete:
 *     summary: Delete finding
 *     tags: [Findings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Finding ID
 *     responses:
 *       200:
 *         description: Finding deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Finding not found
 */
router.delete('/:id', authenticateToken, findingController.deleteFinding);

module.exports = router;
