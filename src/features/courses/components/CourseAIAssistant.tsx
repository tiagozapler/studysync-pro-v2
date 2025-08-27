import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  FileText,
  Settings,
  MessageSquare,
  Brain,
  Upload,
  X,
} from 'lucide-react'
import { useAppStore } from '../../../lib/store'
import { AIService } from '../../../lib/services/AIService'
import toast from 'react-hot-toast'

interface CourseAIAssistantProps {
  courseId: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  files?: string[]
}

export const CourseAIAssistant: React.FC<CourseAIAssistantProps> = ({
  courseId,
}) => {
  const { files, grades, courseEvents } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [huggingFaceToken, setHuggingFaceToken] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showFileSelector, setShowFileSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const courseFiles = files[courseId] || []
  const aiService = AIService.getInstance()

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() && selectedFiles.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      files: selectedFiles,
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Preparar contexto del curso
      const courseContext = buildCourseContext()

      // Preparar contenido de archivos si hay archivos seleccionados
      let fileContent = ''
      if (selectedFiles.length > 0) {
        const selectedFileObjects = courseFiles.filter(f =>
          selectedFiles.includes(f.id)
        )
        for (const file of selectedFileObjects) {
          // Usar el contenido extraído del archivo si está disponible
          const fileContentText = await extractFileContent(file)
          if (fileContentText) {
            fileContent += `\n\n--- CONTENIDO DE ${file.name} ---\n${fileContentText}`
          }
        }
      }

      // Construir prompt para la IA
      const prompt = buildPrompt(inputValue, courseContext, fileContent)

      // Obtener respuesta de la IA
      const response = await getAIResponse(prompt)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
      setSelectedFiles([])
    } catch (error) {
      console.error('Error getting AI response:', error)
      toast.error('Error al obtener respuesta de la IA')

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const extractFileContent = async (file: any): Promise<string> => {
    try {
      // Si el archivo tiene contenido extraído, usarlo
      if (file.content) {
        return file.content
      }

      // Si no, intentar extraer el contenido del blob
      if (file.blob) {
        // Aquí podrías implementar la extracción de contenido del blob
        // Por ahora, retornamos un mensaje informativo
        return `[Archivo ${file.name} - Contenido no extraído]`
      }

      return `[Archivo ${file.name} - Sin contenido disponible]`
    } catch (error) {
      console.error('Error extracting file content:', error)
      return `[Error al extraer contenido de ${file.name}]`
    }
  }

  const buildCourseContext = (): string => {
    let context = ''

    // Agregar información de calificaciones
    const courseGrades = grades[courseId] || []
    if (courseGrades.length > 0) {
      context += '\n\nCALIFICACIONES DEL CURSO:\n'
      courseGrades.forEach((grade: any) => {
        context += `- ${grade.name}: ${grade.score}/${grade.maxScore} (${grade.weight}% peso)\n`
      })
    }

    // Agregar información de eventos
    const courseEventsList = courseEvents[courseId] || []
    if (courseEventsList.length > 0) {
      context += '\n\nEVENTOS DEL CURSO:\n'
      courseEventsList.forEach((event: any) => {
        context += `- ${event.title}: ${event.date} (${event.type})\n`
      })
    }

    // Agregar información de archivos
    if (courseFiles.length > 0) {
      context += '\n\nARCHIVOS DISPONIBLES:\n'
      courseFiles.forEach(file => {
        context += `- ${file.name} (${file.type || 'tipo desconocido'})\n`
      })
    }

    return context
  }

  const buildPrompt = (
    userQuestion: string,
    courseContext: string,
    fileContent: string
  ): string => {
    let prompt = `Eres un asistente de IA especializado en ayudar con cursos académicos. 
    
CONTEXTO DEL CURSO:
${courseContext}

${fileContent ? `CONTENIDO DE ARCHIVOS SELECCIONADOS:${fileContent}` : ''}

PREGUNTA DEL USUARIO: ${userQuestion}

Por favor, proporciona una respuesta útil y detallada basada en el contexto del curso y el contenido de los archivos si están disponibles. 
Si la pregunta es sobre calificaciones, cálculos o proyecciones, incluye los cálculos matemáticos.
Si la pregunta es sobre fechas o eventos, menciona las fechas específicas del curso.
Si la pregunta es sobre archivos, analiza el contenido proporcionado.`

    return prompt
  }

  const getAIResponse = async (prompt: string): Promise<string> => {
    try {
      // Usar el método público analyzeFileContent
      const analysis = await aiService.analyzeFileContent(prompt, 'prompt.txt')

      // Convertir el análisis en una respuesta de texto
      let response = ''

      if (analysis.summary) {
        response += analysis.summary + '\n\n'
      }

      if (analysis.topics.length > 0) {
        response +=
          '**Temas identificados:** ' + analysis.topics.join(', ') + '\n\n'
      }

      if (analysis.importantInfo.length > 0) {
        response += '**Información importante:**\n'
        analysis.importantInfo.forEach(info => {
          response += `• ${info}\n`
        })
        response += '\n'
      }

      if (response.trim() === '') {
        response =
          'He analizado tu pregunta y el contexto del curso. ¿Hay algo específico sobre lo que te gustaría que profundice?'
      }

      return response
    } catch (error) {
      console.error('Error in AI response:', error)
      return 'Lo siento, los servicios de IA no están disponibles en este momento. Por favor, verifica la configuración de Ollama o Hugging Face.'
    }
  }

  const handleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      // Aquí podrías procesar el archivo si es necesario
      toast.success(`Archivo ${file.name} seleccionado`)
    }
  }

  const handleSaveHuggingFaceToken = () => {
    aiService.setHuggingFaceToken(huggingFaceToken)
    setShowSettings(false)
    setHuggingFaceToken('')
    toast.success('Token de Hugging Face guardado')
  }

  const getSystemInfo = () => {
    return aiService.getSystemInfo()
  }

  const systemInfo = getSystemInfo()

  return (
    <div className='flex flex-col h-full bg-white rounded-lg shadow'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200'>
        <div className='flex items-center'>
          <Bot className='h-6 w-6 text-purple-600 mr-2' />
          <h3 className='text-lg font-semibold text-gray-900'>Asistente IA</h3>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className='p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100'
        >
          <Settings className='h-5 w-5' />
        </button>
      </div>

      {/* Estado de IA */}
      <div className='px-4 py-3 bg-gray-50 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <Brain className='h-4 w-4 text-purple-600 mr-2' />
            <span className='text-xs text-gray-600'>Estado de la IA</span>
          </div>
          <div className='flex space-x-2'>
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                systemInfo.ollama
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Ollama: {systemInfo.ollama ? '✓' : '✗'}
            </span>
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                systemInfo.hasToken
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              HF: {systemInfo.hasToken ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.length === 0 ? (
          <div className='text-center text-gray-500 py-8'>
            <Bot className='h-12 w-12 mx-auto mb-4 text-gray-300' />
            <p className='text-sm'>
              ¡Hola! Soy tu asistente de IA para este curso.
            </p>
            <p className='text-xs mt-1'>
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
                  <div className='mb-2'>
                    <p className='text-xs opacity-75'>
                      Archivos referenciados:
                    </p>
                    <div className='flex flex-wrap gap-1'>
                      {message.files.map(fileId => {
                        const file = courseFiles.find(f => f.id === fileId)
                        return file ? (
                          <span
                            key={fileId}
                            className='text-xs bg-white bg-opacity-20 px-2 py-1 rounded'
                          >
                            {file.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
                <p className='text-sm whitespace-pre-wrap'>{message.content}</p>
                <p className='text-xs opacity-75 mt-1'>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className='flex justify-start'>
            <div className='bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg'>
              <div className='flex items-center space-x-2'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600'></div>
                <span className='text-sm'>Pensando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selector de archivos */}
      {showFileSelector && (
        <div className='px-4 py-3 bg-gray-50 border-t border-gray-200'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-gray-700'>
              Archivos seleccionados:
            </span>
            <button
              onClick={() => setShowFileSelector(false)}
              className='text-gray-400 hover:text-gray-600'
            >
              <X className='h-4 w-4' />
            </button>
          </div>
          <div className='space-y-2 max-h-32 overflow-y-auto'>
            {courseFiles.map(file => (
              <label
                key={file.id}
                className='flex items-center space-x-2 cursor-pointer'
              >
                <input
                  type='checkbox'
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => handleFileSelection(file.id)}
                  className='rounded border-gray-300 text-purple-600 focus:ring-purple-500'
                />
                <span className='text-sm text-gray-700'>{file.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className='p-4 border-t border-gray-200'>
        <div className='flex space-x-2'>
          <button
            onClick={() => setShowFileSelector(!showFileSelector)}
            className='p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100'
            title='Seleccionar archivos'
          >
            <FileText className='h-5 w-5' />
          </button>
          <input
            type='text'
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            placeholder='Haz una pregunta sobre el curso...'
            className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={
              isLoading || (!inputValue.trim() && selectedFiles.length === 0)
            }
            className='p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Send className='h-5 w-5' />
          </button>
        </div>

        {selectedFiles.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-1'>
            {selectedFiles.map(fileId => {
              const file = courseFiles.find(f => f.id === fileId)
              return file ? (
                <span
                  key={fileId}
                  className='inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full'
                >
                  {file.name}
                  <button
                    onClick={() => handleFileSelection(fileId)}
                    className='ml-1 text-purple-600 hover:text-purple-800'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </span>
              ) : null
            })}
          </div>
        )}
      </div>

      {/* Modal de configuración */}
      {showSettings && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                <Brain className='h-5 w-5 text-purple-600 mr-2' />
                Configurar IA
              </h3>

              <div className='space-y-4'>
                {/* Ollama */}
                <div className='p-3 bg-gray-50 rounded-lg'>
                  <h4 className='text-sm font-medium text-gray-900 mb-2'>
                    Ollama (Local - Gratuito)
                  </h4>
                  <p className='text-xs text-gray-600 mb-2'>
                    Instala Ollama en tu computadora para usar IA local
                    gratuita.
                  </p>
                  <a
                    href='https://ollama.ai'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-xs text-blue-600 hover:text-blue-500'
                  >
                    Descargar Ollama →
                  </a>
                </div>

                {/* Hugging Face */}
                <div className='p-3 bg-blue-50 rounded-lg'>
                  <h4 className='text-sm font-medium text-gray-900 mb-2'>
                    Hugging Face (API Gratuita)
                  </h4>
                  <p className='text-xs text-gray-600 mb-2'>
                    Obtén un token gratuito de Hugging Face para usar IA en la
                    nube.
                  </p>
                  <div className='space-y-2'>
                    <input
                      type='text'
                      placeholder='Token de Hugging Face'
                      value={huggingFaceToken}
                      onChange={e => setHuggingFaceToken(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <a
                      href='https://huggingface.co/settings/tokens'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-xs text-blue-600 hover:text-blue-500 block'
                    >
                      Obtener Token →
                    </a>
                  </div>
                </div>
              </div>

              <div className='flex space-x-3 pt-4'>
                <button
                  onClick={handleSaveHuggingFaceToken}
                  disabled={!huggingFaceToken.trim()}
                  className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Guardar Token
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className='flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors'
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type='file'
        className='hidden'
        onChange={handleFileUpload}
        accept='.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif'
      />
    </div>
  )
}
