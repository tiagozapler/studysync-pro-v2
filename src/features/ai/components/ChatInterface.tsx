import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatSessionList } from './ChatSessionList';
import {
  FreeChatService,
  ChatSession,
  ChatMessage as ChatMessageType,
} from '../../../lib/ai/chat/FreeChatService';

export function ChatInterface() {
  const [chatService, setChatService] = useState<FreeChatService | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicializar el servicio de chat
  useEffect(() => {
    // Inicializar servicio gratuito automáticamente
    const service = new FreeChatService();
    service.initialize();
    setChatService(service);

    // Cargar sesiones existentes
    const existingSessions = service.getAllSessions();
    setSessions(existingSessions);

    if (existingSessions.length > 0) {
      setCurrentSession(existingSessions[0] || null);
    } else {
      // Crear sesión inicial si no hay ninguna
      const newSession = service.createSession('Nueva conversación');
      setSessions([newSession]);
      setCurrentSession(newSession);
    }
  }, []);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const handleApiKeySubmit = (key: string) => {
    // Para compatibilidad con Groq si el usuario quiere usarlo
    localStorage.setItem('groq_api_key', key);
    setApiKey(key);

    // Por ahora seguimos usando el servicio gratuito
    const service = new FreeChatService();
    service.initialize();
    setChatService(service);

    // Crear nueva sesión
    const newSession = service.createSession('Nueva conversación');
    setSessions([newSession]);
    setCurrentSession(newSession);
  };

  const handleSendMessage = async (content: string) => {
    if (!chatService || !currentSession || !content.trim()) return;

    setIsLoading(true);
    try {
      await chatService.sendMessage(currentSession.id, content);
      // La sesión se actualiza automáticamente a través del callback
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSession(session);
  };

  const handleNewSession = () => {
    if (!chatService) return;

    const newSession = chatService.createSession('Nueva conversación');
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!chatService) return;

    chatService.deleteSession(sessionId);
    setSessions(prev => Array.isArray(prev) ? prev.filter(s => s.id !== sessionId) : []);

    if (currentSession?.id === sessionId) {
      const safeSessions = Array.isArray(sessions) ? sessions : [];
      const remainingSessions = safeSessions.filter(s => s.id !== sessionId);
      setCurrentSession(remainingSessions[0] || null);
    }
  };

  // Mostrar información del adaptador gratuito
  if (isConfiguring) {
    return (
      <div className="flex items-center justify-center h-full bg-dark-bg-primary">
        <div className="bg-dark-bg-secondary p-8 rounded-lg shadow-modal max-w-md w-full">
          <h2 className="text-2xl font-bold text-dark-text-primary mb-4">
            Chat con IA Gratuito
          </h2>
          <p className="text-dark-text-secondary mb-6">
            Para usar el chat con IA, necesitas configurar tu API key de Groq.
          </p>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (apiKey.trim()) {
                setIsConfiguring(false);
                handleApiKeySubmit(apiKey);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                API Key de Groq
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="gsk_..."
                  className="flex-1 bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-course-blue transition-colors"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />
                <button
                  type="button"
                  onClick={() => {
                    // Usar variable de entorno o localStorage existente
                    const key =
                      import.meta.env.VITE_GROQ_API_KEY ||
                      localStorage.getItem('groq_api_key') ||
                      '';
                    if (key) {
                      setApiKey(key);
                      setIsConfiguring(false);
                      handleApiKeySubmit(key);
                    } else {
                      alert(
                        'Por favor, configura tu API key de Groq en las variables de entorno o en la configuración del chat.'
                      );
                    }
                  }}
                  className="px-3 py-2 bg-course-blue text-white border border-dark-border rounded-lg hover:bg-blue-600 transition-colors text-xs"
                  title="Usar API key guardada"
                >
                  Usar Key
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={!apiKey.trim()}
              className="w-full bg-course-blue text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Configurar
            </button>
          </form>
          <div className="mt-4 text-xs text-dark-text-muted">
            <p>• Tu API key se guarda localmente en tu navegador</p>
            <p>• No se comparte con terceros</p>
            <p>
              • Puedes obtener una API key gratuita en{' '}
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-course-blue hover:underline"
              >
                console.groq.com
              </a>
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('groq_api_key');
                setApiKey('');
                setChatService(null);
                setSessions([]);
                setCurrentSession(null);
                setIsConfiguring(true);
              }}
              className="mt-2 text-xs text-danger hover:underline"
            >
              Limpiar configuración
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-dark-bg-primary">
      {/* Lista de sesiones */}
      <div className="w-80 bg-dark-bg-secondary border-r border-dark-border flex flex-col">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-dark-text-primary mb-2">
            Conversaciones
          </h2>
          <button onClick={handleNewSession} className="btn-primary w-full">
            Nueva conversación
          </button>
        </div>
        <ChatSessionList
          sessions={sessions}
          currentSession={currentSession}
          onSelectSession={handleSessionSelect}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-dark-border bg-dark-bg-secondary">
              <h3 className="text-lg font-semibold text-dark-text-primary">
                {currentSession.title}
              </h3>
              {currentSession.courseName && (
                <p className="text-sm text-dark-text-muted">
                  Curso: {currentSession.courseName}
                </p>
              )}
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentSession.messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-dark-border bg-dark-bg-secondary">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-dark-text-primary mb-2">
                Selecciona una conversación
              </h3>
              <p className="text-dark-text-muted">
                O crea una nueva para comenzar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
