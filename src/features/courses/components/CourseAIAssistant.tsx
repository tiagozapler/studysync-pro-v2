import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  FileText,
  Settings,
  MessageSquare,
  Brain,
  Upload,
  X,
} from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import Groq from 'groq-sdk';
import toast from 'react-hot-toast';
import env from '../../../lib/config/env';
import { getCourseFileTexts } from '../../../lib/convex/database';
import type { GroqMessage } from '../../../lib/ai/adapters/GroqAdapter';

interface CourseAIAssistantProps {
  courseId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: string[];
}

export const CourseAIAssistant: React.FC<CourseAIAssistantProps> = ({
  courseId,
}) => {
  const { files, grades, courseEvents } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState(
    localStorage.getItem('groqApiKey') || env.GROQ_API_KEY || ''
  );

  // Efecto para sincronizar con localStorage en caso de cambios externos
  useEffect(() => {
    const storedKey =
      localStorage.getItem('groqApiKey') || env.GROQ_API_KEY || '';
    if (storedKey !== groqApiKey) {
      setGroqApiKey(storedKey);
    }
  }, []);
  const groqKeyValid = Boolean(groqApiKey);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificación segura de files
  const safeFiles = files && typeof files === 'object' ? files : {};
  const courseFiles = Array.isArray(safeFiles[courseId])
    ? safeFiles[courseId]
    : [];
  const [groqClient, setGroqClient] = useState<Groq | null>(null);
  const [isGroqReady, setIsGroqReady] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!groqApiKey) {
      setGroqClient(null);
      setIsGroqReady(false);
      return;
    }

    try {
      const client = new Groq({
        apiKey: groqApiKey,
        dangerouslyAllowBrowser: true, // Necesario para entorno browser
      });
      setGroqClient(client);
      setIsGroqReady(true);
      console.log('✅ Groq client initialized successfully');
    } catch (error) {
      console.error('❌ Error configurando Groq:', error);
      setGroqClient(null);
      setIsGroqReady(false);
    }
  }, [groqApiKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!groqKeyValid) {
      toast.error('Configura y guarda tu clave de Groq para usar la IA.');
      return;
    }

    if (!inputValue.trim() && selectedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      files: selectedFiles,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const context = await buildCourseContext();

      const history = buildChatHistory();

      const response = await getGroqResponse(inputValue, {
        context,
        history,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Error al obtener respuesta de la IA');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildCourseContext = useCallback(async (): Promise<string> => {
    try {
      const [convexTexts, courseContext] = await Promise.all([
        getCourseFileTexts(courseId, { numItems: 100 }),
        Promise.resolve(buildMetadataContext()),
      ]);

      const fileContext = convexTexts
        .map(text => text.content)
        .filter(Boolean)
        .join('\n\n');

      return [courseContext, fileContext].filter(Boolean).join('\n\n').trim();
    } catch (error) {
      console.error('Error obteniendo contexto del curso:', error);
      return buildMetadataContext();
    }
  }, [courseId, courseEvents, courseFiles, grades]);

  const buildMetadataContext = (): string => {
    let context = '';

    const courseGrades = grades[courseId] || [];
    if (courseGrades.length > 0) {
      context += '\n\nCALIFICACIONES DEL CURSO:\n';
      courseGrades.forEach((grade: any) => {
        context += `- ${grade.name}: ${grade.score}/${grade.maxScore} (${grade.weight}% peso)\n`;
      });
    }

    const courseEventsList = courseEvents[courseId] || [];
    if (courseEventsList.length > 0) {
      context += '\n\nEVENTOS DEL CURSO:\n';
      courseEventsList.forEach((event: any) => {
        context += `- ${event.title}: ${event.date} (${event.type})\n`;
      });
    }

    if (courseFiles.length > 0) {
      context += '\n\nARCHIVOS DISPONIBLES:\n';
      courseFiles.forEach(file => {
        context += `- ${file.name} (${file.type || 'tipo desconocido'})\n`;
      });
    }

    return context.trim();
  };

  const buildChatHistory = (): GroqMessage[] => {
    return messages.map(message => ({
      role: message.role,
      content: message.content,
    }));
  };

  const getGroqResponse = async (
    userMessage: string,
    options: {
      context: string;
      history: GroqMessage[];
    }
  ): Promise<string> => {
    if (!groqClient) {
      throw new Error('Groq no está configurado');
    }

    const { context, history } = options;

    const completion = await groqClient.chat.completions.create({
      model: 'gemma-7b-it',
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente académico que utiliza el contexto del curso para responder preguntas de estudiantes. Si la información no está en el contexto, dilo claramente.',
        },
        ...(context
          ? [
              {
                role: 'system' as const,
                content: `Contexto del curso:
${context}`,
              },
            ]
          : []),
        ...history,
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });

    return (
      completion.choices[0]?.message?.content?.trim() ||
      'No pude generar una respuesta en este momento.'
    );
  };

  const handleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Aquí podrías procesar el archivo si es necesario
      toast.success(`Archivo ${file.name} seleccionado`);
    }
  };

  const handleSaveGroqKey = () => {
    if (!groqApiKey) {
      toast.error('Ingresa una clave válida de Groq.');
      return;
    }

    localStorage.setItem('groqApiKey', groqApiKey);
    setShowSettings(false);
    toast.success('Clave de Groq guardada y activada');

    // Forzar actualización del estado para reflejar el cambio inmediatamente
    setGroqApiKey(groqApiKey); // Esto fuerza que el useEffect se ejecute
  };

  const systemInfo = {
    groq: groqKeyValid && isGroqReady,
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Bot className="h-6 w-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Asistente IA</h3>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Estado de IA */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="h-4 w-4 text-purple-600 mr-2" />
            <span className="text-xs text-gray-600">Estado de la IA</span>
          </div>
          <div className="flex space-x-2">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                systemInfo.groq
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              Groq: {systemInfo.groq ? 'Activo' : 'Sin clave'}
            </span>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">
              ¡Hola! Soy tu asistente de IA para este curso.
            </p>
            <p className="text-xs mt-1">
              Puedo ayudarte con preguntas sobre el curso, analizar archivos y
              más.
            </p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.files && message.files.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs opacity-75">
                      Archivos referenciados:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {message.files.map(fileId => {
                        const file = courseFiles.find(f => f.id === fileId);
                        return file ? (
                          <span
                            key={fileId}
                            className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded"
                          >
                            {file.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-75 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="text-sm">Pensando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selector de archivos */}
      {showFileSelector && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Archivos seleccionados:
            </span>
            <button
              onClick={() => setShowFileSelector(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {courseFiles.map(file => (
              <label
                key={file.id}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => handleFileSelection(file.id)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{file.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFileSelector(!showFileSelector)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            title="Seleccionar archivos"
          >
            <FileText className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Haz una pregunta sobre el curso..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={
              isLoading || (!inputValue.trim() && selectedFiles.length === 0)
            }
            className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedFiles.map(fileId => {
              const file = courseFiles.find(f => f.id === fileId);
              return file ? (
                <span
                  key={fileId}
                  className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
                >
                  {file.name}
                  <button
                    onClick={() => handleFileSelection(fileId)}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Modal de configuración */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4 border border-purple-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" /> Configuración de
                Groq
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  API Key de Groq
                </label>
                <input
                  type="password"
                  value={groqApiKey}
                  onChange={e => setGroqApiKey(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  placeholder="gsk_..."
                />
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-sm text-purple-900">
                <h4 className="font-semibold mb-2">¿Dónde obtengo la clave?</h4>
                <p>
                  Consigue tu API key gratuita en
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:text-purple-800 ml-1"
                  >
                    console.groq.com
                  </a>
                </p>
              </div>

              <button
                onClick={handleSaveGroqKey}
                disabled={!groqApiKey.trim()}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar clave
              </button>

              <div className="text-xs text-gray-500">
                La clave se guarda localmente en tu navegador y puedes cambiarla
                o borrarla cuando quieras.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
      />
    </div>
  );
};
