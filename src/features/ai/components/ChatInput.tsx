import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');

      // Resetear altura del textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileAttach = () => {
    // TODO: Implementar adjuntar archivos
    setIsAttaching(true);
    // Aquí se abriría el selector de archivos
    setTimeout(() => setIsAttaching(false), 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      {/* Botón de adjuntar archivo */}
      <button
        type="button"
        onClick={handleFileAttach}
        disabled={isLoading}
        className="p-2 text-dark-text-muted hover:text-dark-text-primary transition-colors disabled:opacity-50"
        title="Adjuntar archivo"
      >
        <Paperclip size={20} />
      </button>

      {/* Textarea */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje... (Shift + Enter para nueva línea)"
          className="w-full min-h-[44px] max-h-32 resize-none bg-dark-bg-tertiary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-course-blue transition-colors"
          disabled={isLoading}
          rows={1}
        />
      </div>

      {/* Botón de enviar */}
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className="p-2 bg-course-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Enviar mensaje"
      >
        <Send size={20} />
      </button>
    </form>
  );
}
