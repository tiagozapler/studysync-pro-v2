import { GroqAdapter, GroqMessage } from '../adapters/GroqAdapter';
import { getCourseFileTexts } from '../../convex/database';

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

export class GroqChatService {
  private adapter: GroqAdapter;
  private sessions: Map<string, ChatSession> = new Map();
  private updateCallbacks: Map<string, Set<(message: ChatMessage) => void>> =
    new Map();

  constructor(apiKey: string) {
    this.adapter = new GroqAdapter(apiKey);
  }

  // Inicializar el servicio
  initialize(): void {
    this.loadFromLocalStorage();
  }

  // Crear una nueva sesión
  createSession(
    title: string,
    courseId?: string,
    courseName?: string
  ): ChatSession {
    const session: ChatSession = {
      id: this.generateId(),
      courseId: courseId || '',
      courseName: courseName || '',
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(session.id, session);
    this.saveToLocalStorage();
    return session;
  }

  // Obtener todas las sesiones
  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  // Obtener una sesión específica
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Enviar un mensaje
  async sendMessage(
    sessionId: string,
    content: string,
    attachments?: string[]
  ): Promise<ChatMessage> {
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
      attachments: attachments || [],
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
      isStreaming: true,
    };

    // Agregar mensaje de la IA a la sesión
    session.messages.push(aiMessage);
    session.updatedAt = new Date();
    this.saveToLocalStorage();

    // Emitir actualización inicial
    this.emitUpdate(sessionId, aiMessage);

    try {
      // Preparar historial de conversación para el contexto
      const history: GroqMessage[] = session.messages
        .slice(0, -2) // Excluir el mensaje actual del usuario y la respuesta de la IA
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      const extraContext = await this.buildCourseContext(session.courseId);

      // Obtener stream de respuesta de la IA
      const stream = await this.adapter.sendMessageStream(content, {
        history,
        ...(session.courseName && { courseName: session.courseName }),
        ...(extraContext && { extraContext }),
      });

      // Leer el stream y actualizar el mensaje en tiempo real
      const reader = stream.getReader();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          fullContent += value;
          aiMessage.content = fullContent;

          // Emitir actualización en tiempo real
          this.emitUpdate(sessionId, aiMessage);
        }
      } finally {
        reader.releaseLock();
      }

      // Finalizar el mensaje
      aiMessage.isStreaming = false;
      session.updatedAt = new Date();
      this.saveToLocalStorage();

      // Emitir actualización final
      this.emitUpdate(sessionId, aiMessage);

      return aiMessage;
    } catch (error) {
      // En caso de error, actualizar el mensaje con el error
      aiMessage.content = `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      aiMessage.isStreaming = false;
      session.updatedAt = new Date();
      this.saveToLocalStorage();
      this.emitUpdate(sessionId, aiMessage);

      throw error;
    }
  }

  private async buildCourseContext(courseId?: string): Promise<string | null> {
    if (!courseId) {
      return null;
    }

    try {
      const fileTexts = await getCourseFileTexts(courseId, { numItems: 50 });

      if (fileTexts.length === 0) {
        return null;
      }

      const joined = fileTexts
        .map(text => text.content)
        .filter(Boolean)
        .join('\n\n');

      if (!joined) {
        return null;
      }

      const maxLength = 6000;
      return joined.length > maxLength ? joined.slice(0, maxLength) : joined;
    } catch (error) {
      console.error('Error building course context:', error);
      return null;
    }
  }

  // Eliminar una sesión
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.updateCallbacks.delete(sessionId);
    this.saveToLocalStorage();
  }

  // Actualizar el título de una sesión
  updateSessionTitle(sessionId: string, title: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.title = title;
      session.updatedAt = new Date();
      this.saveToLocalStorage();
    }
  }

  // Suscribirse a actualizaciones de una sesión
  onUpdate(
    sessionId: string,
    callback: (message: ChatMessage) => void
  ): () => void {
    if (!this.updateCallbacks.has(sessionId)) {
      this.updateCallbacks.set(sessionId, new Set());
    }

    this.updateCallbacks.get(sessionId)!.add(callback);

    // Retornar función para desuscribirse
    return () => {
      const callbacks = this.updateCallbacks.get(sessionId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.updateCallbacks.delete(sessionId);
        }
      }
    };
  }

  // Emitir actualización a los suscriptores
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
      localStorage.setItem(
        'studysync_chat_sessions',
        JSON.stringify(sessionsData)
      );
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
        this.sessions.clear();

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
}
