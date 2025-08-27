import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, FileText, Settings, MessageSquare } from 'lucide-react'
import { useAppStore } from '../../../lib/store/appStore'
import { GroqAdapter } from '../../../lib/ai/adapters/GroqAdapter'
import { FileContentExtractor } from '../../../lib/services/FileContentExtractor'

interface CourseAIAssistantProps {
  courseId: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: string[]
}

export function CourseAIAssistant({ courseId }: CourseAIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [includeNotes, setIncludeNotes] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const course = useAppStore(state =>
    state.courses.find(c => c.id === courseId)
  )
  const courseMaterials = useAppStore(state => state.files[courseId] || [])
  const courseNotes = useAppStore(state => state.notes[courseId] || [])
  const courseGrades = useAppStore(state => state.grades[courseId] || [])
  const courseEvents = useAppStore(state => state.courseEvents[courseId] || [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getApiKey = () => {
    return localStorage.getItem('groq_api_key') || ''
  }

  const configureApiKey = () => {
    // Usar variable de entorno o localStorage existente
    const apiKey =
      import.meta.env.VITE_GROQ_API_KEY ||
      localStorage.getItem('groq_api_key') ||
      ''
    if (apiKey) {
      localStorage.setItem('groq_api_key', apiKey)
      // Recargar la página para aplicar los cambios
      window.location.reload()
    } else {
      alert(
        'Por favor, configura tu API key de Groq en las variables de entorno o en la configuración del chat.'
      )
    }
  }

  const createCourseContext = async () => {
    let context = `Eres un asistente IA especializado en el curso "${course?.name}" (${course?.teacher}). `
    context += `Tu función es ayudar al estudiante con preguntas específicas sobre este curso. `
    context += `Solo debes usar la información proporcionada en los materiales y notas del curso. `
    context += `Si no encuentras la respuesta en los materiales, debes responder: "No encuentro esa información en los materiales o notas de este curso. Intenta cargar más documentos o consulta con el Asistente General."\n\n`

    // Add content from course materials
    if (courseMaterials.length > 0) {
      const fileMaterials = courseMaterials.filter(m => m.type === 'file')
      if (fileMaterials.length > 0) {
        context += `CONTENIDO DE MATERIALES DEL CURSO:\n`

        for (const material of fileMaterials) {
          context += `\n=== ${material.name} ===\n`

          // Intentar extraer contenido real del archivo
          try {
            if (material.fileUrl) {
              // Si tenemos una URL del archivo, intentar extraer contenido
              const response = await fetch(material.fileUrl)
              const blob = await response.blob()
              const file = new File([blob], material.name, {
                type: material.mimeType || 'application/octet-stream',
              })

              const content = await FileContentExtractor.extractContent(file)
              context += content
            } else {
              // Si no hay URL, usar información básica del material
              context += `Archivo: ${material.name}\n`
              context += `Tipo: ${material.mimeType || 'Desconocido'}\n`
              if (material.size) {
                context += `Tamaño: ${(material.size / 1024).toFixed(1)} KB\n`
              }
              context += `[Contenido no disponible. Por favor, sube el archivo nuevamente.]\n`
            }
          } catch (error) {
            console.error(
              `Error extracting content from ${material.name}:`,
              error
            )
            context += `[Error al extraer contenido de ${material.name}. Por favor, sube el archivo nuevamente.]\n`
          }

          if (material.tags && material.tags.length > 0) {
            context += `Etiquetas: ${material.tags.join(', ')}\n`
          }
          context += `\n`
        }
      }
    }

    // Add course notes if enabled
    if (includeNotes && courseNotes.length > 0) {
      context += `NOTAS DEL CURSO:\n`
      courseNotes.forEach(note => {
        const noteData = note as any
        context += `- ${noteData.title || 'Sin título'}: ${noteData.content || 'Sin contenido'}\n`
      })
      context += `\n`
    }

    // Agregar notas de evaluaciones si está habilitado
    if (includeNotes && courseGrades.length > 0) {
      context += `EVALUACIONES DEL CURSO:\n`
      courseGrades.forEach(grade => {
        const percentage = (grade.score / grade.maxScore) * 100
        context += `- ${grade.name} (${grade.type}): ${grade.score}/${grade.maxScore} (${percentage.toFixed(1)}%) - Peso: ${grade.weight}%\n`
        if (grade.notes) {
          context += `  Notas: ${grade.notes}\n`
        }
      })
      context += `\n`
    }

    // Agregar eventos del calendario si está habilitado
    if (includeNotes && courseEvents.length > 0) {
      context += `EVENTOS DEL CALENDARIO:\n`
      courseEvents.forEach(event => {
        context += `- ${event.title} (${event.type}): ${event.date.toLocaleDateString()}`
        if (event.time) context += ` a las ${event.time}`
        if (event.location) context += ` en ${event.location}`
        context += ` - Prioridad: ${event.priority}\n`
        if (event.description) {
          context += `  Descripción: ${event.description}\n`
        }
      })
      context += `\n`
    }

    context += `INSTRUCCIONES:\n`
    context += `1. Responde basándote únicamente en los materiales y notas del curso.\n`
    context += `2. Si te preguntan sobre un archivo específico, busca en los materiales.\n`
    context += `3. Si te piden resúmenes, análisis o explicaciones, usa la información disponible.\n`
    context += `4. Si no encuentras la información, indica claramente que no está disponible.\n`
    context += `5. Mantén un tono educativo y de apoyo.\n\n`

    return context
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const apiKey = getApiKey()
      if (!apiKey) {
        throw new Error('API key de Groq no configurada')
      }

      const adapter = new GroqAdapter(apiKey)
      const context = await createCourseContext()

      const stream = await adapter.sendMessageStream(inputValue, {
        systemPrompt: context,
        courseName: course?.name,
      })

      const reader = stream.getReader()
      let responseContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        responseContent += value
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error enviando mensaje:', error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Lo siento, hubo un error al procesar tu pregunta. Verifica que tu API key de Groq esté configurada correctamente.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const getAvailableMaterialsCount = () => {
    return courseMaterials.filter(m => m.type === 'file').length
  }

  const getAvailableNotesCount = () => {
    return includeNotes
      ? courseNotes.length + courseGrades.length + courseEvents.length
      : 0
  }

  return (
    <div className='h-full flex flex-col bg-dark-bg-primary'>
      {/* Header */}
      <div className='p-4 border-b border-dark-border bg-dark-bg-secondary'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Bot size={24} className='text-course-blue' />
            <div>
              <h2 className='text-xl font-semibold text-dark-text-primary'>
                Asistente IA - {course?.name}
              </h2>
              <p className='text-sm text-dark-text-muted'>
                {getAvailableMaterialsCount()} materiales •{' '}
                {getAvailableNotesCount()} notas
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className='p-2 rounded-lg bg-dark-bg-primary hover:bg-dark-bg-tertiary text-dark-text-secondary hover:text-dark-text-primary transition-colors'
              title='Configuración'
            >
              <Settings size={18} />
            </button>
            <button
              onClick={clearChat}
              className='p-2 rounded-lg bg-dark-bg-primary hover:bg-dark-bg-tertiary text-dark-text-secondary hover:text-dark-text-primary transition-colors'
              title='Limpiar chat'
            >
              <MessageSquare size={18} />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className='mt-4 p-4 bg-dark-bg-primary rounded-lg border border-dark-border'>
            <h3 className='text-sm font-semibold text-dark-text-primary mb-3'>
              Configuración del Asistente
            </h3>
            <div className='space-y-3'>
              <label className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={includeNotes}
                  onChange={e => setIncludeNotes(e.target.checked)}
                  className='w-4 h-4 text-course-blue bg-dark-bg-secondary border-dark-border rounded focus:ring-course-blue focus:ring-2'
                />
                <span className='text-sm text-dark-text-secondary'>
                  Incluir notas, evaluaciones y eventos del curso
                </span>
              </label>

              {!getApiKey() && (
                <div className='p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg'>
                  <p className='text-sm text-yellow-400 mb-2'>
                    No se ha configurado la API key de Groq
                  </p>
                  <button
                    onClick={configureApiKey}
                    className='px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 rounded text-sm font-medium transition-colors'
                  >
                    Configurar API Key
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.length === 0 ? (
          <div className='text-center text-dark-text-muted py-8'>
            <Bot
              size={48}
              className='mx-auto mb-4 text-course-blue opacity-50'
            />
            <h3 className='text-lg font-semibold text-dark-text-secondary mb-2'>
              Asistente IA del Curso
            </h3>
            <p className='text-sm max-w-md mx-auto'>
              Haz preguntas sobre los materiales, notas y contenido de{' '}
              {course?.name}. El asistente solo responderá basándose en la
              información del curso.
            </p>
            {getAvailableMaterialsCount() === 0 && (
              <p className='text-sm text-yellow-400 mt-3'>
                💡 Sube algunos archivos al curso para obtener mejores
                respuestas
              </p>
            )}
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className='w-8 h-8 rounded-full bg-course-blue flex items-center justify-center flex-shrink-0'>
                  <Bot size={16} className='text-white' />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-course-blue text-white'
                    : 'bg-dark-bg-secondary text-dark-text-primary border border-dark-border'
                }`}
              >
                <div className='whitespace-pre-wrap text-sm leading-relaxed'>
                  {message.content}
                </div>
                <div className='text-xs opacity-70 mt-2'>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              {message.role === 'user' && (
                <div className='w-8 h-8 rounded-full bg-dark-bg-tertiary flex items-center justify-center flex-shrink-0'>
                  <FileText size={16} className='text-dark-text-secondary' />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className='flex gap-3 justify-start'>
            <div className='w-8 h-8 rounded-full bg-course-blue flex items-center justify-center flex-shrink-0'>
              <Bot size={16} className='text-white' />
            </div>
            <div className='bg-dark-bg-secondary border border-dark-border rounded-lg p-3'>
              <div className='flex items-center gap-2 text-dark-text-secondary'>
                <div className='w-2 h-2 bg-current rounded-full animate-bounce'></div>
                <div
                  className='w-2 h-2 bg-current rounded-full animate-bounce'
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className='w-2 h-2 bg-current rounded-full animate-bounce'
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <span className='text-sm ml-2'>Pensando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className='p-4 border-t border-dark-border bg-dark-bg-secondary'>
        <div className='flex gap-3'>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Pregunta sobre ${course?.name}...`}
            className='flex-1 resize-none rounded-lg border border-dark-border bg-dark-bg-primary text-dark-text-primary placeholder-dark-text-muted focus:ring-2 focus:ring-course-blue focus:border-transparent px-4 py-3 min-h-[44px] max-h-32'
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className='flex items-center justify-center w-12 h-12 rounded-lg bg-course-blue hover:bg-course-blue-dark disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors'
          >
            <Send size={18} />
          </button>
        </div>

        {getAvailableMaterialsCount() > 0 && (
          <p className='text-xs text-dark-text-muted mt-2'>
            Usando {getAvailableMaterialsCount()} archivos y{' '}
            {getAvailableNotesCount()} notas como contexto
          </p>
        )}
      </div>
    </div>
  )
}
