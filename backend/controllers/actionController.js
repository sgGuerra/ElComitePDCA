const Action = require('../models/Action');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Process = require('../models/Process');
const config = require('../config/config');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Controller for action related operations
 */
const actionController = {
  /**
   * Get actions by process ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getActionsByProcess: async (req, res) => {
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
          message: 'No tienes permiso para ver estas acciones de mejora' 
        });
      }
      
      const actions = await Action.findByProcessId(processId);
      
      res.json({
        success: true,
        count: actions.length,
        data: actions
      });
    } catch (error) {
      logger.error(`Get actions by process error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener las acciones de mejora' 
      });
    }
  },
  
  /**
   * Get actions by leader ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getActionsByLeader: async (req, res) => {
    try {
      const { leaderId } = req.params;
      
      // Validate if leader exists
      const leader = await User.findById(leaderId);
      if (!leader) {
        return res.status(404).json({ 
          success: false, 
          message: 'Líder de proceso no encontrado' 
        });
      }
      
      // If not admin and not the leader, deny access
      if (req.user.role !== config.roles.ADMIN && req.user.id !== parseInt(leaderId)) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para ver estas acciones de mejora' 
        });
      }
      
      const actions = await Action.findByLeaderId(leaderId);
      
      res.json({
        success: true,
        count: actions.length,
        data: actions
      });
    } catch (error) {
      logger.error(`Get actions by leader error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener las acciones de mejora' 
      });
    }
  },
  
  /**
   * Get action by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getActionById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const action = await Action.findById(id);
      
      if (!action) {
        return res.status(404).json({ 
          success: false, 
          message: 'Acción de mejora no encontrada' 
        });
      }
      
      // Get the process to check access
      const process = await Process.findById(action.process_id);
      
      // If not admin, not the process creator, and not the assigned leader, deny access
      if (req.user.role !== config.roles.ADMIN && 
          process.created_by !== req.user.id && 
          action.leader_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para ver esta acción de mejora' 
        });
      }
      
      // Get action comments
      const comments = await Action.getComments(id);
      
      // Get action history
      const history = await Action.getHistory(id);
      
      // Return complete action data
      res.json({
        success: true,
        data: {
          ...action,
          comments,
          history
        }
      });
    } catch (error) {
      logger.error(`Get action by ID error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener la acción de mejora' 
      });
    }
  },
  
  /**
   * Create a new action
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createAction: async (req, res) => {
    try {
      const { processId } = req.params;
      const { 
        leader_id, 
        name, 
        origin, 
        start_date, 
        due_date, 
        goal,
        what,
        why,
        how,
        where,
        status,
        type
      } = req.body;
      
      // Check required fields
      if (!name || !origin || !start_date || !due_date || !leader_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nombre, origen, líder, fecha de inicio y fecha de vencimiento son obligatorios' 
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
          message: 'No tienes permiso para crear acciones de mejora en este proceso' 
        });
      }
      
      // Check if leader exists
      const leader = await User.findById(leader_id);
      if (!leader) {
        return res.status(404).json({ 
          success: false, 
          message: 'Líder de proceso no encontrado' 
        });
      }
      
      // Create the action
      const newAction = await Action.create({
        process_id: processId,
        leader_id,
        name,
        origin,
        start_date,
        due_date,
        goal,
        what,
        why,
        how,
        where,
        status: status || 'in_progress',
        type: type || 'corrective',
        created_by: req.user.id
      });
      
      // Send notification to the leader
      await Notification.createActionAssignment(leader_id, newAction);
      
      logger.info(`New action created for process ${processId}: ${name}`);
      
      res.status(201).json({
        success: true,
        message: 'Acción de mejora creada exitosamente',
        data: newAction
      });
    } catch (error) {
      logger.error(`Create action error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al crear la acción de mejora' 
      });
    }
  },
  
  /**
   * Update an action
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateAction: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        leader_id, 
        name, 
        origin, 
        start_date, 
        due_date, 
        goal,
        what,
        why,
        how,
        where,
        status,
        type,
        observations,
        files
      } = req.body;
      
      // Check if action exists
      const action = await Action.findById(id);
      
      if (!action) {
        return res.status(404).json({ 
          success: false, 
          message: 'Acción de mejora no encontrada' 
        });
      }
      
      // Get the process to check access
      const process = await Process.findById(action.process_id);
      
      // If not admin, not the process creator, and not the assigned leader, deny access
      if (req.user.role !== config.roles.ADMIN && 
          process.created_by !== req.user.id && 
          action.leader_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para actualizar esta acción de mejora' 
        });
      }
      
      // If changing leader, check if new leader exists
      if (leader_id && leader_id !== action.leader_id) {
        const leader = await User.findById(leader_id);
        if (!leader) {
          return res.status(404).json({ 
            success: false, 
            message: 'Nuevo líder de proceso no encontrado' 
          });
        }
      }
      
      // Prepare update data
      const updateData = {};
      
      // Only allow process creators or admins to update certain fields
      if (req.user.role === config.roles.ADMIN || process.created_by === req.user.id) {
        if (leader_id) updateData.leader_id = leader_id;
        if (name) updateData.name = name;
        if (origin) updateData.origin = origin;
        if (start_date) updateData.start_date = start_date;
        if (due_date) updateData.due_date = due_date;
        if (goal !== undefined) updateData.goal = goal;
        if (what !== undefined) updateData.what = what;
        if (why !== undefined) updateData.why = why;
        if (how !== undefined) updateData.how = how;
        if (where !== undefined) updateData.location = where;
        if (type) updateData.type = type;
      }
      
      // Allow leaders to update status and add observations
      if (status) updateData.status = status;
      if (observations) updateData.observations = observations;
      if (files) updateData.files = files;
      
      // Update the action
      const updated = await Action.update(id, updateData, req.user.id);
      
      if (!updated) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo actualizar la acción de mejora' 
        });
      }
      
      // If status changed, send notification to process creator
      if (status && status !== action.status) {
        await Notification.createStatusChange(
          process.created_by, 
          action, 
          action.status, 
          status
        );
      }
      
      // If leader changed, send notification to new leader
      if (leader_id && leader_id !== action.leader_id) {
        await Notification.createActionAssignment(leader_id, action);
      }
      
      logger.info(`Action updated: ${id}`);
      
      res.json({
        success: true,
        message: 'Acción de mejora actualizada exitosamente'
      });
    } catch (error) {
      logger.error(`Update action error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar la acción de mejora' 
      });
    }
  },
  
  /**
   * Delete an action
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteAction: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if action exists
      const action = await Action.findById(id);
      
      if (!action) {
        return res.status(404).json({ 
          success: false, 
          message: 'Acción de mejora no encontrada' 
        });
      }
      
      // Get the process to check access
      const process = await Process.findById(action.process_id);
      
      // Only admin or process creator can delete actions
      if (req.user.role !== config.roles.ADMIN && process.created_by !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para eliminar esta acción de mejora' 
        });
      }
      
      // Delete the action
      const deleted = await Action.delete(id);
      
      if (!deleted) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo eliminar la acción de mejora' 
        });
      }
      
      logger.info(`Action deleted: ${id}`);
      
      res.json({
        success: true,
        message: 'Acción de mejora eliminada exitosamente'
      });
    } catch (error) {
      logger.error(`Delete action error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar la acción de mejora' 
      });
    }
  },
  
  /**
   * Add observation to action
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addObservation: async (req, res) => {
    try {
      const { id } = req.params;
      const { observation } = req.body;
      
      if (!observation) {
        return res.status(400).json({ 
          success: false, 
          message: 'La observación es obligatoria' 
        });
      }
      
      // Check if action exists
      const action = await Action.findById(id);
      
      if (!action) {
        return res.status(404).json({ 
          success: false, 
          message: 'Acción de mejora no encontrada' 
        });
      }
      
      // Get the process to check access
      const process = await Process.findById(action.process_id);
      
      // If not admin, not the process creator, and not the assigned leader, deny access
      if (req.user.role !== config.roles.ADMIN && 
          process.created_by !== req.user.id && 
          action.leader_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para agregar observaciones a esta acción de mejora' 
        });
      }
      
      // Add the observation
      const added = await Action.addObservation(id, observation, req.user.id);
      
      if (!added) {
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo agregar la observación' 
        });
      }
      
      logger.info(`Observation added to action ${id}`);
      
      res.json({
        success: true,
        message: 'Observación agregada exitosamente'
      });
    } catch (error) {
      logger.error(`Add observation error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al agregar la observación' 
      });
    }
  },
  
  /**
   * Add comment to action
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      
      if (!comment) {
        return res.status(400).json({ 
          success: false, 
          message: 'El comentario es obligatorio' 
        });
      }
      
      // Check if action exists
      const action = await Action.findById(id);
      
      if (!action) {
        return res.status(404).json({ 
          success: false, 
          message: 'Acción de mejora no encontrada' 
        });
      }
      
      // Get the process to check access
      const process = await Process.findById(action.process_id);
      
      // If not admin, not the process creator, and not the assigned leader, deny access
      if (req.user.role !== config.roles.ADMIN && 
          process.created_by !== req.user.id && 
          action.leader_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para agregar comentarios a esta acción de mejora' 
        });
      }
      
      // Add the comment
      const newComment = await Action.addComment(id, comment, req.user.id);
      
      logger.info(`Comment added to action ${id}`);
      
      res.status(201).json({
        success: true,
        message: 'Comentario agregado exitosamente',
        data: newComment
      });
    } catch (error) {
      logger.error(`Add comment error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al agregar el comentario' 
      });
    }
  },
  
  /**
   * Upload file for action
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  uploadFile: async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se ha proporcionado ningún archivo' 
        });
      }
      
      // Check if action exists
      const action = await Action.findById(id);
      
      if (!action) {
        // Delete the file if action doesn't exist
        fs.unlinkSync(req.file.path);
        
        return res.status(404).json({ 
          success: false, 
          message: 'Acción de mejora no encontrada' 
        });
      }
      
      // Get the process to check access
      const process = await Process.findById(action.process_id);
      
      // If not admin, not the process creator, and not the assigned leader, deny access
      if (req.user.role !== config.roles.ADMIN && 
          process.created_by !== req.user.id && 
          action.leader_id !== req.user.id) {
        // Delete the file if user doesn't have permission
        fs.unlinkSync(req.file.path);
        
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para agregar archivos a esta acción de mejora' 
        });
      }
      
      // Prepare file data
      const fileData = {
        name: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
      
      // Add the file to the action
      const added = await Action.addFile(id, fileData, req.user.id);
      
      if (!added) {
        // Delete the file if it couldn't be added to the action
        fs.unlinkSync(req.file.path);
        
        return res.status(500).json({ 
          success: false, 
          message: 'No se pudo agregar el archivo a la acción de mejora' 
        });
      }
      
      logger.info(`File uploaded to action ${id}: ${req.file.originalname}`);
      
      res.status(201).json({
        success: true,
        message: 'Archivo subido exitosamente',
        data: {
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype
        }
      });
    } catch (error) {
      logger.error(`Upload file error: ${error.message}`);
      
      // Delete the file if there was an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Error al subir el archivo' 
      });
    }
  },
  
  /**
   * Get action history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getActionHistory: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if action exists
      const action = await Action.findById(id);
      
      if (!action) {
        return res.status(404).json({ 
          success: false, 
          message: 'Acción de mejora no encontrada' 
        });
      }
      
      // Get the process to check access
      const process = await Process.findById(action.process_id);
      
      // If not admin, not the process creator, and not the assigned leader, deny access
      if (req.user.role !== config.roles.ADMIN && 
          process.created_by !== req.user.id && 
          action.leader_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para ver el historial de esta acción de mejora' 
        });
      }
      
      // Get the history
      const history = await Action.getHistory(id);
      
      res.json({
        success: true,
        count: history.length,
        data: history
      });
    } catch (error) {
      logger.error(`Get action history error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener el historial de la acción de mejora' 
      });
    }
  },
  
  /**
   * Get action statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getActionStatistics: async (req, res) => {
    try {
      // Build filters based on request
      const filters = {};
      
      if (req.params.processId) {
        filters.process_id = req.params.processId;
        
        // Check if process exists
        const process = await Process.findById(filters.process_id);
        
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
            message: 'No tienes permiso para ver estas estadísticas' 
          });
        }
      }
      
      if (req.query.leaderId) {
        filters.leader_id = req.query.leaderId;
        
        // If not admin and not the leader, deny access
        if (req.user.role !== config.roles.ADMIN && req.user.id !== parseInt(filters.leader_id)) {
          return res.status(403).json({ 
            success: false, 
            message: 'No tienes permiso para ver estas estadísticas' 
          });
        }
      }
      
      // If no specific filter and not admin, limit to actions where user is leader or process creator
      if (Object.keys(filters).length === 0 && req.user.role !== config.roles.ADMIN) {
        // This is a more complex case that would require custom SQL in the model
        // For now, we'll just deny access if not admin
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para ver todas las estadísticas. Por favor filtra por proceso o líder.' 
        });
      }
      
      // Get statistics
      const statistics = await Action.getStatistics(filters);
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error(`Get action statistics error: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener las estadísticas de acciones de mejora' 
      });
    }
  }
};

module.exports = actionController;
