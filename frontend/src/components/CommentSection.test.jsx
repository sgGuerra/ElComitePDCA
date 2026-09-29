import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommentSection from './CommentSection';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import * as AuthContext from '../contexts/AuthContext';

// Mock dynamic imports
vi.mock('../services/actionService', () => ({
  default: {
    addActionComment: vi.fn(),
    deleteActionComment: vi.fn(),
  },
}));

vi.mock('../services/processService', () => ({
  default: {
    addProcessComment: vi.fn(),
    deleteProcessComment: vi.fn(),
  },
}));

// Mock useAuth directly to control user state easily
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

const mockComments = [
  { id: 1, comment: 'First comment', user_name: 'John Doe', user_id: 1, created_at: '2023-01-01T12:00:00Z' },
  { id: 2, comment: 'Second comment', user_name: 'Jane Smith', user_id: 2, created_at: '2023-01-02T12:00:00Z' },
];

const renderComponent = (props = {}) => {
  const defaultProps = {
    entityId: 10,
    entityType: 'action',
    comments: mockComments,
    setComments: vi.fn(),
    fetchComments: vi.fn(),
    ...props
  };

  return render(
    <ToastProvider>
      <CommentSection {...defaultProps} />
    </ToastProvider>
  );
};

describe('CommentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default user is John Doe (id 1, role admin)
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'John Doe', role: 'admin' }
    });
  });

  it('should render the comment form and list of comments', () => {
    renderComponent();
    
    expect(screen.getByText('Comentarios')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Escribe un comentario...')).toBeInTheDocument();
    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Second comment')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should show empty state when no comments exist', () => {
    renderComponent({ comments: [] });
    
    expect(screen.getByText('No hay comentarios todavía')).toBeInTheDocument();
    expect(screen.getByText('Sé el primero en comentar')).toBeInTheDocument();
  });

  it('should disable submit button when comment is empty', () => {
    renderComponent();
    
    const submitBtn = screen.getByRole('button', { name: '' }); // The button with icon
    // Actually finding the button by looking for the one inside the form
    const form = screen.getByPlaceholderText('Escribe un comentario...').closest('form');
    const btn = form.querySelector('button[type="submit"]');
    
    expect(btn).toBeDisabled();
  });

  it('should enable submit button when typing a comment', () => {
    renderComponent();
    
    const textarea = screen.getByPlaceholderText('Escribe un comentario...');
    fireEvent.change(textarea, { target: { value: 'New comment text' } });
    
    const form = textarea.closest('form');
    const btn = form.querySelector('button[type="submit"]');
    
    expect(btn).not.toBeDisabled();
  });

  it('should allow user to delete their own comment', () => {
    // User is John Doe (id 1)
    renderComponent();
    
    // There are 2 comments, John is admin so he sees 2 trash icons
    const deleteButtons = screen.getAllByTitle('Eliminar comentario');
    expect(deleteButtons.length).toBe(2);
  });

  it('should only show delete button for own comments if not admin', () => {
    // User is Jane Smith (id 2, role normal)
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 2, name: 'Jane Smith', role: 'auditor' }
    });
    
    renderComponent();
    
    // Only 1 trash icon should be visible (for her own comment)
    const deleteButtons = screen.queryAllByTitle('Eliminar comentario');
    expect(deleteButtons.length).toBe(1);
  });

  it('should call handleAddComment when submitting an action comment', async () => {
    const actionService = await import('../services/actionService');
    actionService.default.addActionComment.mockResolvedValueOnce({ success: true, data: { id: 3, comment: 'New comment' } });
    
    const setComments = vi.fn();
    renderComponent({ setComments });
    
    const textarea = screen.getByPlaceholderText('Escribe un comentario...');
    fireEvent.change(textarea, { target: { value: 'New comment text' } });
    
    fireEvent.submit(textarea.closest('form'));
    
    await waitFor(() => {
      expect(actionService.default.addActionComment).toHaveBeenCalledWith(10, 'New comment text');
    });
    
    expect(setComments).toHaveBeenCalled();
  });

  it('should call handleDeleteComment when clicking delete on process comment', async () => {
    const processService = await import('../services/processService');
    processService.default.deleteProcessComment.mockResolvedValueOnce({ success: true });
    
    // Stub window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    const setComments = vi.fn();
    renderComponent({ entityType: 'process', setComments });
    
    const deleteButtons = screen.getAllByTitle('Eliminar comentario');
    fireEvent.click(deleteButtons[0]); // Click first delete button
    
    await waitFor(() => {
      expect(processService.default.deleteProcessComment).toHaveBeenCalledWith(10, 1);
    });
    
    expect(setComments).toHaveBeenCalled();
  });
});
