import { WebLLMAdapter, WebLLMMessage } from '../adapters/WebLLMAdapter';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: string[];
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  courseId?: string;
  courseName?: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export class FreeChatService {
  private adapter: WebLLMAdapter;
  private sessions: Map<string, ChatSession> = new Map();
  private updateCallbacks: Map<string, Set<(message: ChatMessage) => void>> = new Map();

  constructor() {
    this.adapter = new WebLLMAdapter();
  }

  // Inicializar el servicio
  initialize(): void {
    this.loadFromLocalStorage();
    console.log('✅ FreeChatService initialized');
  }

  // Crear una nueva sesión
  createSession(title: string, courseId?: string, courseName?: string): ChatSession {
    const session: ChatSession = {
      id: this.generateId(),
      courseId: courseId || '',
      courseName: courseName || '',
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(session.id, session);
    this.saveToLocalStorage();
    return session;
  }

  // Obtener todas las sesiones
  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  // Obtener una sesión específica
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Enviar un mensaje
  async sendMessage(sessionId: string, content: string, attachments?: string[]): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Sesión no encontrada: ${sessionId}`);
    }

    // Crear mensaje del usuario
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments: attachments || []
    };

    // Agregar mensaje del usuario a la sesión
    session.messages.push(userMessage);
    session.updatedAt = new Date();
    this.saveToLocalStorage();

    // Crear mensaje de respuesta de la IA (inicialmente vacío)
    const aiMessage: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    // Agregar mensaje de la IA a la sesión
    session.messages.push(aiMessage);
    session.updatedAt = new Date();
    this.saveToLocalStorage();

    // Emitir actualización inicial
    this.emitUpdate(sessionId, aiMessage);

    try {
      // Preparar historial para el contexto
      const history: WebLLMMessage[] = session.messages
        .slice(0, -1) // Excluir el mensaje actual de la IA
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Obtener stream de respuesta
      const stream = await this.adapter.sendMessageStream(content, {
        history,
        ...(session.courseName && { courseName: session.courseName })
      });

      // Procesar el stream
      const reader = stream.getReader();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        fullResponse += value;
        aiMessage.content = fullResponse;
        aiMessage.isStreaming = true;
        
        // Emitir actualización
        this.emitUpdate(sessionId, aiMessage);
      }

      // Finalizar mensaje
      aiMessage.isStreaming = false;
      session.updatedAt = new Date();
      this.saveToLocalStorage();
      this.emitUpdate(sessionId, aiMessage);

    } catch (error) {
      console.error('Error en sendMessage:', error);
      
      // En caso de error, mostrar mensaje de error
      aiMessage.content = 'Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo?';
      aiMessage.isStreaming = false;
      session.updatedAt = new Date();
      this.saveToLocalStorage();
      this.emitUpdate(sessionId, aiMessage);
    }

    return aiMessage;
  }

  // Eliminar una sesión
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.updateCallbacks.delete(sessionId);
    this.saveToLocalStorage();
  }

  // Suscribirse a actualizaciones de una sesión
  subscribeToUpdates(sessionId: string, callback: (message: ChatMessage) => void): () => void {
    if (!this.updateCallbacks.has(sessionId)) {
      this.updateCallbacks.set(sessionId, new Set());
    }
    
    this.updateCallbacks.get(sessionId)!.add(callback);
    
    // Retornar función para desuscribirse
    return () => {
      this.updateCallbacks.get(sessionId)?.delete(callback);
    };
  }

  // Emitir actualización
  private emitUpdate(sessionId: string, message: ChatMessage): void {
    const callbacks = this.updateCallbacks.get(sessionId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error en callback de actualización:', error);
        }
      });
    }
  }

  // Guardar en localStorage
  private saveToLocalStorage(): void {
    try {
      const sessionsData = Array.from(this.sessions.values());
      localStorage.setItem('studysync_chat_sessions', JSON.stringify(sessionsData));
    } catch (error) {
      console.error('Error guardando sesiones en localStorage:', error);
    }
  }

  // Cargar desde localStorage
  private loadFromLocalStorage(): void {
    try {
      const sessionsData = localStorage.getItem('studysync_chat_sessions');
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        sessions.forEach((session: any) => {
          // Convertir fechas de string a Date
          session.createdAt = new Date(session.createdAt);
          session.updatedAt = new Date(session.updatedAt);
          session.messages.forEach((msg: any) => {
            msg.timestamp = new Date(msg.timestamp);
          });
          
          this.sessions.set(session.id, session);
        });
      }
    } catch (error) {
      console.error('Error cargando sesiones desde localStorage:', error);
    }
  }

  // Generar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Obtener información del adaptador
  getAdapterInfo() {
    return this.adapter.getModelInfo();
  }

  // Verificar si el adaptador está listo
  isReady(): boolean {
    return this.adapter.isReady();
  }
}
