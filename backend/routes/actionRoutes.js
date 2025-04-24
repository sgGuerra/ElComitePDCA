const express = require('express');
const router = express.Router();
const actionController = require('../controllers/actionController');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

/**
 * @swagger
 * /api/actions/leader/{leaderId}:
 *   get:
 *     summary: Get actions by leader ID
 *     tags: [Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The leader ID
 *     responses:
 *       200:
 *         description: List of actions
 *       401:
 *         description: Unauthorized
 */
router.get('/leader/:leaderId', authenticateToken, actionController.getActionsByLeader);

/**
 * @swagger
 * /api/actions/statistics:
 *   get:
 *     summary: Get action statistics
 *     tags: [Actions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Action statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/statistics', authenticateToken, actionController.getActionStatistics);

/**
 * @swagger
 * /api/actions/{id}:
 *   get:
 *     summary: Get action by ID
 *     tags: [Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The action ID
 *     responses:
 *       200:
 *         description: Action details
 *       404:
 *         description: Action not found
 */
router.get('/:id', authenticateToken, actionController.getActionById);

// Continue adding Swagger documentation for each route
// I'll include just one more as an example for different HTTP methods

/**
 * @swagger
 * /api/actions/{id}/files:
 *   post:
 *     summary: Upload file for action
 *     tags: [Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The action ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/files', 
  authenticateToken, 
  upload.single('file'), 
  handleMulterError, 
  actionController.uploadFile
);

module.exports = router;
