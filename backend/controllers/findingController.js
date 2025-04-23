const Finding = require('../models/Finding');
const Process = require('../models/Process');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Controller for finding related operations
 */
const findingController = {
  /**
   * Get all findings by process ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getFindingsByProcess: async (req, res) => {
    try {
      const { processId } = req.params;
      
      // Check if process exists
      const process = await Process.findById(processId);
      
      if (!process) {
        return res.status(404).json({ 
          success: false, 
          message: 'Proceso no encontrado' 
        });
      }
      
      // If not admin and not the creator, deny access
      if (req.user.role !== config.roles.ADMIN && process.created_by !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para ver estos hallazgos' 
        });
      }
      
      const findings = await Finding.findByProcessId(processId);
      
      res.json({
        success: true,
        count: findings.length,
        data: findings
      });
    } catch (error) {
      logger.error(`Get findings by process error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los hallazgos' 
      });
    }
  },
  
  /**
   * Get finding by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getFindingById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const finding = await Finding.findById(id);
      
      if (!finding) {
        return res.status(404).json({ 
          success: false, 
          message: 'Hallazgo no encontrado' 
        });
      }
      
      // Check if user has access to the process
      const process = await Process.findById(finding.process_id);
      
      // If not admin and not the creator of the process, deny access
      if (req.user.role !== config.roles.ADMIN && process.created_by !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para ver este hallazgo' 
        });
      }
      
      res.json({
        success: true,
        data: finding
      });
    } catch (error) {
      logger.error(`Get finding by ID error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener el hallazgo' 
      });
    }
  },
  
  /**
   * Create a new finding
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createFinding: async (req, res) => {
    try {
      const { processId } = req.params;
      const { description, source, discovery_date, status } = req.body;
      
      if (!description || !source) {
        return res.status(400).json({ 
          success: false, 
          message: 'La descripción y la fuente son obligatorias' 
        });
      }
      
      // Check if process exists
      const process = await Process.findById(processId);
      
      if (!process) {
        return res.status(404).json({ 
          success: false, 
          message: 'Proceso no encontrado' 
        });
      }
      
      // If not admin and not the creator, deny access
      if (req.user.role !== config.roles.ADMIN && process.created_by !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para agregar hallazgos a este proceso' 
        });
      }
      
      const newFinding = await Finding.create({
        process_id: processId,
        description,
        source,
        discovery_date: discovery_date || new Date().toISOString(),
        status: status || 'pending',
        created_by: req.user.id
      });
      
      logger.info(`New finding created for process ${processId}`);
      
      res.status(201).json({
        success: true,
        message: 'Hallazgo registrado exitosamente',
        data: newFinding
      });
    } catch (error) {
      logger.error(`Create finding error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al crear el hallazgo' 
      });
    }
  },
  
  /**
   * Update a finding
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateFinding: async (req, res) => {
    try {
      const { id } = req.params;
      const { description, source, discovery_date, status } = req.body;
      
      if (!description || !source) {
        return res.status(400).json({ 
          success: false, 
          message: 'La descripción y la fuente son obligatorias' 
        });
      }
      
      // Get the finding
      const finding = await Finding.findById(id);
      
      if (!finding) {
        return res.status(404).json({ 
          success: false, 
          message: 'Hallazgo no encontrado' 
        });
      }
      
      // Check if user has access to the process
      const process = await Process.findById(finding.process_id);
      
      // If not admin and not the creator of the process, deny access
      if (req.user.role !== config.roles.ADMIN && process.created_by !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para actualizar este hallazgo' 
        });
      }
      
      // Update the finding
      const updated = await Finding.update(id, { 
        description, 
        source, 
        discovery_date: discovery_date || finding.discovery_date,
        status: status || finding.status 
      });
      
      if (!updated) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo actualizar el hallazgo' 
        });
      }
      
      logger.info(`Finding updated: ${id}`);
      
      res.json({
        success: true,
        message: 'Hallazgo actualizado exitosamente'
      });
    } catch (error) {
      logger.error(`Update finding error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el hallazgo' 
      });
    }
  },
  
  /**
   * Delete a finding
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteFinding: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the finding
      const finding = await Finding.findById(id);
      
      if (!finding) {
        return res.status(404).json({ 
          success: false, 
          message: 'Hallazgo no encontrado' 
        });
      }
      
      // Check if user has access to the process
      const process = await Process.findById(finding.process_id);
      
      // If not admin and not the creator of the process, deny access
      if (req.user.role !== config.roles.ADMIN && process.created_by !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para eliminar este hallazgo' 
        });
      }
      
      // Delete the finding
      const deleted = await Finding.delete(id);
      
      if (!deleted) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo eliminar el hallazgo' 
        });
      }
      
      logger.info(`Finding deleted: ${id}`);
      
      res.json({
        success: true,
        message: 'Hallazgo eliminado exitosamente'
      });
    } catch (error) {
      logger.error(`Delete finding error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar el hallazgo' 
      });
    }
  },
  
  /**
   * Get finding statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getFindingStatistics: async (req, res) => {
    try {
      const { processId } = req.params;
      
      // Check if process exists
      const process = await Process.findById(processId);
      
      if (!process) {
        return res.status(404).json({ 
          success: false, 
          message: 'Proceso no encontrado' 
        });
      }
      
      // If not admin and not the creator, deny access
      if (req.user.role !== config.roles.ADMIN && process.created_by !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para ver las estadísticas de este proceso' 
        });
      }
      
      // Get finding statistics
      const sourceStats = await Finding.getSourceStats(processId);
      const statusStats = await Finding.getStatusStats(processId);
      
      // Get all findings for the process
      const findings = await Finding.findByProcessId(processId);
      
      const statistics = {
        total: findings.length,
        bySource: sourceStats,
        byStatus: statusStats
      };
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error(`Get finding statistics error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener las estadísticas de hallazgos' 
      });
    }
  }
};

module.exports = findingController;
