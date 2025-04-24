const Process = require('../models/Process');
const Action = require('../models/Action');
const Finding = require('../models/Finding');
const Opportunity = require('../models/Opportunity');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Controller for process related operations
 */
const processController = {
  /**
   * Get all processes
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllProcesses: async (req, res) => {
    try {
      let processes;
      
      // If not admin, only show processes created by the user
      if (req.user.role !== config.roles.ADMIN) {
        processes = await Process.findAll(req.user.id);
      } else {
        processes = await Process.findAll();
      }
      
      res.json({
        success: true,
        count: processes.length,
        data: processes
      });
    } catch (error) {
      logger.error(`Get all processes error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los procesos' 
      });
    }
  },
  
  /**
   * Get process by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProcessById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const process = await Process.findById(id);
      
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
          message: 'No tienes permiso para ver este proceso' 
        });
      }
      
      res.json({
        success: true,
        data: process
      });
    } catch (error) {
      logger.error(`Get process by ID error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener el proceso' 
      });
    }
  },
  
  /**
   * Create a new process
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createProcess: async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ 
          success: false, 
          message: 'El nombre del proceso es obligatorio' 
        });
      }
      
      const newProcess = await Process.create({
        name,
        description,
        created_by: req.user.id
      });
      
      logger.info(`New process created: ${name} (ID: ${newProcess.id})`);
      
      res.status(201).json({
        success: true,
        message: 'Proceso creado exitosamente',
        data: newProcess
      });
    } catch (error) {
      logger.error(`Create process error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al crear el proceso' 
      });
    }
  },
  
  /**
   * Update a process
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateProcess: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      // Check if process exists
      const process = await Process.findById(id);
      
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
          message: 'No tienes permiso para actualizar este proceso' 
        });
      }
      
      if (!name) {
        return res.status(400).json({ 
          success: false, 
          message: 'El nombre del proceso es obligatorio' 
        });
      }
      
      // Update the process
      const updated = await Process.update(id, { name, description });
      
      if (!updated) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo actualizar el proceso' 
        });
      }
      
      logger.info(`Process updated: ${id}`);
      
      res.json({
        success: true,
        message: 'Proceso actualizado exitosamente'
      });
    } catch (error) {
      logger.error(`Update process error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el proceso' 
      });
    }
  },
  
  /**
   * Delete a process
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteProcess: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if process exists
      const process = await Process.findById(id);
      
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
          message: 'No tienes permiso para eliminar este proceso' 
        });
      }
      
      // Delete the process and related records
      const deleted = await Process.delete(id);
      
      if (!deleted) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo eliminar el proceso' 
        });
      }
      
      logger.info(`Process deleted: ${id}`);
      
      res.json({
        success: true,
        message: 'Proceso y registros relacionados eliminados exitosamente'
      });
    } catch (error) {
      logger.error(`Delete process error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar el proceso' 
      });
    }
  },
  
  /**
   * Get process statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProcessStatistics: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if process exists
      const process = await Process.findById(id);
      
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
      
      // Get statistics
      const statistics = await Process.getStatistics(id);
      
      // Get action statistics
      const actionStats = await Action.getStatistics({ process_id: id });
      
      // Get finding statistics
      const findingSourceStats = await Finding.getSourceStats(id);
      const findingStatusStats = await Finding.getStatusStats(id);
      
      // Get opportunity statistics
      const opportunityStatusCounts = await Opportunity.getStatusCounts(id);
      
      const combinedStats = {
        process: {
          id: process.id,
          name: process.name,
          created_at: process.created_at
        },
        opportunities: {
          total: statistics.opportunities,
          byStatus: opportunityStatusCounts
        },
        findings: {
          total: statistics.findings,
          bySource: findingSourceStats,
          byStatus: findingStatusStats
        },
        actions: {
          total: actionStats.total,
          byStatus: actionStats.byStatus,
          byType: actionStats.byType,
          upcoming: actionStats.upcoming,
          completed: actionStats.completed
        }
      };
      
      res.json({
        success: true,
        data: combinedStats
      });
    } catch (error) {
      logger.error(`Get process statistics error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener las estadísticas del proceso' 
      });
    }
  }
};

module.exports = processController;
