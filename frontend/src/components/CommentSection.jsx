import React, { useState, useEffect } from 'react';
import { FaComment, FaPaperPlane, FaTrash, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingOverlay from './LoadingOverlay';

const CommentSection = ({ entityId, entityType, comments, setComments, fetchComments }) => {
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  // Determine which service to use based on entityType
  const getService = () => {
    if (entityType === 'action') {
      return import('../services/actionService').then(module => module.default);
    } else if (entityType === 'process') {
      return import('../services/processService').then(module => module.default);
    } else {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      const service = await getService();
      let response;
      
      if (entityType === 'action') {
        response = await service.addActionComment(entityId, newComment);
      } else if (entityType === 'process') {
        response = await service.addProcessComment(entityId, newComment);
      }
      
      if (response.success || response.data) {
        // If we received a comment object directly in the response
        if (response.data?.id || response.id) {
          const commentData = response.data || response;
          setComments([commentData, ...comments]);
        } else {
          // Otherwise, refresh all comments
          await fetchComments();
        }
        
        setNewComment('');
        success('Comentario agregado exitosamente');
      }
    } catch (err) {
      console.error(`Error adding comment to ${entityType}:`, err);
      showError(`Error al agregar el comentario: ${err.message || 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('¿Estás seguro de eliminar este comentario?')) {
      return;
    }
    
    setLoading(true);
    try {
      const service = await getService();
      let response;
      
      if (entityType === 'action') {
        response = await service.deleteActionComment(entityId, commentId);
      } else if (entityType === 'process') {
        response = await service.deleteProcessComment(entityId, commentId);
      }
      
      if (response.success || response.data) {
        setComments(comments.filter(c => c.id !== commentId));
        success('Comentario eliminado exitosamente');
      }
    } catch (err) {
      console.error(`Error deleting comment from ${entityType}:`, err);
      showError(`Error al eliminar el comentario: ${err.message || 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const canDeleteComment = (comment) => {
    if (!user) return false;
    
    // Admin can delete any comment
    if (user.role === 'admin') return true;
    
    // Users can delete their own comments
    return user.id === comment.user_id;
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <LoadingOverlay loading={loading} />
      
      <h3 className="text-lg font-semibold text-primary flex items-center">
        <FaComment className="mr-2" />
        Comentarios
      </h3>
      
      {/* Comment form */}
      <form onSubmit={handleAddComment} className="flex items-start space-x-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium border border-primary/30">
          {user?.name?.charAt(0)}
        </div>
        
        <div className="flex-1 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[80px]"
          ></textarea>
          
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute bottom-2 right-2 p-2 text-primary hover:text-primary/80 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
      
      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaComment className="mx-auto text-4xl text-gray-300 mb-2" />
          <p>No hay comentarios todavía</p>
          <p className="text-sm mt-1">Sé el primero en comentar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium border border-primary/30 mt-1">
                    {comment.user_name?.charAt(0)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-800">{comment.user_name}</p>
                      <span className="text-xs text-gray-500">{formatDateTime(comment.created_at)}</span>
                    </div>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                </div>
                
                {canDeleteComment(comment) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                    title="Eliminar comentario"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
