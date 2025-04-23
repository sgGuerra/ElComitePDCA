const Opportunity = require('../models/Opportunity');
const Process = require('../models/Process');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Controller for improvement opportunity related operations
 */
const opportunityController = {
  /**
   * Get all opportunities by process ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getOpportunitiesByProcess: async (req, res) => {
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
          message: 'No tienes permiso para ver estas oportunidades de mejora' 
        });
      }
      
      const opportunities = await Opportunity.findByProcessId(processId);
      
      res.json({
        success: true,
        count: opportunities.length,
        data: opportunities
      });
    } catch (error) {
      logger.error(`Get opportunities by process error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener las oportunidades de mejora' 
      });
    }
  },
  
  /**
   * Get opportunity by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getOpportunityById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const opportunity = await Opportunity.findById(id);
      
      if (!opportunity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Oportunidad de mejora no encontrada' 
        });
      }
      
      // Check if user has access to the process
      const process = await Process.findById(opportunity.process_id);
      
      // If not admin and not the creator of the process, deny access
      if (req.user.role !== config.roles.ADMIN && process.created_by !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para ver esta oportunidad de mejora' 
        });
      }
      
      res.json({
        success: true,
        data: opportunity
      });
    } catch (error) {
      logger.error(`Get opportunity by ID error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener la oportunidad de mejora' 
      });
    }
  },
  
  /**
   * Create a new opportunity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createOpportunity: async (req, res) => {
    try {
      const { processId } = req.params;
      const { description, status } = req.body;
      
      if (!description) {
        return res.status(400).json({ 
          success: false, 
          message: 'La descripción es obligatoria' 
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
          message: 'No tienes permiso para agregar oportunidades de mejora a este proceso' 
        });
      }
      
      const newOpportunity = await Opportunity.create({
        process_id: processId,
        description,
        status: status || 'pending',
        created_by: req.user.id
      });
      
      logger.info(`New opportunity created for process ${processId}`);
      
      res.status(201).json({
        success: true,
        message: 'Oportunidad de mejora registrada exitosamente',
        data: newOpportunity
      });
    } catch (error) {
      logger.error(`Create opportunity error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al crear la oportunidad de mejora' 
      });
    }
  },
  
  /**
   * Update an opportunity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateOpportunity: async (req, res) => {
    try {
      const { id } = req.params;
      const { description, status } = req.body;
      
      if (!description) {
        return res.status(400).json({ 
          success: false, 
          message: 'La descripción es obligatoria' 
        });
      }
      
      // Get the opportunity
      const opportunity = await Opportunity.findById(id);
      
      if (!opportunity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Oportunidad de mejora no encontrada' 
        });
      }
      
      // Check if user has access to the process
      const process = await Process.findById(opportunity.process_id);
      
      // If not admin and not the creator of the process, deny access
      if (req.user.role !== config.roles.ADMIN && process.created_by !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para actualizar esta oportunidad de mejora' 
        });
      }
      
      // Update the opportunity
      const updated = await Opportunity.update(id, { description, status });
      
      if (!updated) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo actualizar la oportunidad de mejora' 
        });
      }
      
      logger.info(`Opportunity updated: ${id}`);
      
      res.json({
        success: true,
        message: 'Oportunidad de mejora actualizada exitosamente'
      });
    } catch (error) {
      logger.error(`Update opportunity error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar la oportunidad de mejora' 
      });
    }
  },
  
  /**
   * Delete an opportunity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteOpportunity: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the opportunity
      const opportunity = await Opportunity.findById(id);
      
      if (!opportunity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Oportunidad de mejora no encontrada' 
        });
      }
      
      // Check if user has access to the process
      const process = await Process.findById(opportunity.process_id);
      
      // If not admin and not the creator of the process, deny access
      if (req.user.role !== config.roles.ADMIN && process.created_by !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para eliminar esta oportunidad de mejora' 
        });
      }
      
      // Delete the opportunity
      const deleted = await Opportunity.delete(id);
      
      if (!deleted) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo eliminar la oportunidad de mejora' 
        });
      }
      
      logger.info(`Opportunity deleted: ${id}`);
      
      res.json({
        success: true,
        message: 'Oportunidad de mejora eliminada exitosamente'
      });
    } catch (error) {
      logger.error(`Delete opportunity error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar la oportunidad de mejora' 
      });
    }
  }
};

module.exports = opportunityController;
