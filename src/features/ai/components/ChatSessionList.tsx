import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Edit3, Check, X } from 'lucide-react';
import { ChatSession } from '../../../lib/ai/chat/GroqChatService';

interface ChatSessionListProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function ChatSessionList({
  sessions,
  currentSession,
  onSelectSession,
  onDeleteSession
}: ChatSessionListProps) {
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleEditStart = (session: ChatSession) => {
    setEditingSession(session.id);
    setEditTitle(session.title);
  };

  const handleEditSave = (sessionId: string) => {
    // TODO: Implementar actualización del título en el servicio
    setEditingSession(null);
    setEditTitle('');
  };

  const handleEditCancel = () => {
    setEditingSession(null);
    setEditTitle('');
  };

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      onDeleteSession(sessionId);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-dark-text-muted text-sm">
            No hay conversaciones
          </p>
          <p className="text-dark-text-muted text-xs mt-1">
            Crea una nueva para comenzar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {sessions.map((session) => {
        const isCurrent = currentSession?.id === session.id;
        const isEditing = editingSession === session.id;
        const lastMessage = session.messages[session.messages.length - 1];
        const preview = lastMessage?.content?.slice(0, 50) + (lastMessage?.content?.length && lastMessage.content.length > 50 ? '...' : '');

        return (
          <div
            key={session.id}
            className={`p-3 border-b border-dark-border cursor-pointer transition-colors ${
              isCurrent ? 'bg-dark-bg-tertiary' : 'hover:bg-dark-bg-tertiary'
            }`}
            onClick={() => !isEditing && onSelectSession(session)}
          >
            {isEditing ? (
              // Modo edición
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 bg-dark-bg-primary border border-dark-border rounded px-2 py-1 text-sm text-dark-text-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleEditSave(session.id);
                      } else if (e.key === 'Escape') {
                        handleEditCancel();
                      }
                    }}
                  />
                  <button
                    onClick={() => handleEditSave(session.id)}
                    className="p-1 text-success hover:bg-success hover:bg-opacity-10 rounded"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="p-1 text-danger hover:bg-danger hover:bg-opacity-10 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              // Modo visualización
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-dark-text-primary text-sm truncate">
                      {session.title}
                    </h4>
                    {session.courseName && (
                      <p className="text-xs text-course-blue mt-1">
                        {session.courseName}
                      </p>
                    )}
                    {preview && (
                      <p className="text-xs text-dark-text-muted mt-1 truncate">
                        {preview}
                      </p>
                    )}
                    <p className="text-xs text-dark-text-muted mt-1">
                      {format(session.updatedAt, 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStart(session);
                      }}
                      className="p-1 text-dark-text-muted hover:text-dark-text-primary transition-colors"
                      title="Editar título"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      className="p-1 text-dark-text-muted hover:text-danger transition-colors"
                      title="Eliminar conversación"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
