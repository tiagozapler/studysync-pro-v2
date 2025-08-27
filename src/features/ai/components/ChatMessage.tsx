import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChatMessage as ChatMessageType } from '../../../lib/ai/chat/GroqChatService';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? 'bg-course-blue text-white'
            : 'bg-dark-bg-tertiary text-dark-text-primary'
        }`}
      >
        {/* Contenido del mensaje */}
        <div className="whitespace-pre-wrap">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-blue-100' : 'text-dark-text-muted'
          }`}
        >
          {format(message.timestamp, 'HH:mm', { locale: es })}
        </div>

        {/* Indicador de archivos adjuntos */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
            <div className="text-xs opacity-75">
              Archivos adjuntos: {message.attachments.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
