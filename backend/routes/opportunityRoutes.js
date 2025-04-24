const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/opportunities/{id}:
 *   get:
 *     summary: Get opportunity by ID
 *     description: Retrieves a specific opportunity by its ID
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the opportunity
 *     responses:
 *       200:
 *         description: Opportunity details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Opportunity'
 *       404:
 *         description: Opportunity not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, opportunityController.getOpportunityById);

/**
 * @swagger
 * /api/opportunities/{id}:
 *   put:
 *     summary: Update opportunity
 *     description: Updates an existing opportunity
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the opportunity to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OpportunityInput'
 *     responses:
 *       200:
 *         description: Updated opportunity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Opportunity'
 *       404:
 *         description: Opportunity not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticateToken, opportunityController.updateOpportunity);

/**
 * @swagger
 * /api/opportunities/{id}:
 *   delete:
 *     summary: Delete opportunity
 *     description: Deletes an opportunity by ID
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the opportunity to delete
 *     responses:
 *       200:
 *         description: Opportunity deleted successfully
 *       404:
 *         description: Opportunity not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticateToken, opportunityController.deleteOpportunity);

module.exports = router;
