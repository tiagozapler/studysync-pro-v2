import axios from 'axios'

export interface AIAnalysisResult {
  dates: Array<{
    date: Date
    type: string
    context: string
    confidence: number
  }>
  grades: Array<{
    name: string
    score: number
    maxScore: number
    weight: number
    type: string
    confidence: number
  }>
  summary: string
  topics: string[]
  importantInfo: string[]
}

export class AIService {
  private static instance: AIService
  private ollamaUrl: string = 'http://localhost:11434'
  private huggingFaceUrl: string = 'https://api-inference.huggingface.co/models'
  private huggingFaceToken: string = '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'

  private constructor() {
    // Intentar obtener token de Hugging Face desde localStorage
    this.huggingFaceToken = localStorage.getItem('huggingFaceToken') || ''
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  /**
   * Configurar token de Hugging Face
   */
  public setHuggingFaceToken(token: string): void {
    this.huggingFaceToken = token
    localStorage.setItem('huggingFaceToken', token)
  }

  /**
   * Verificar si Ollama está disponible
   */
  public async isOllamaAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: 3000,
      })
      return response.status === 200
    } catch (error) {
      return false
    }
  }

  /**
   * Analizar contenido de archivo usando IA
   */
  public async analyzeFileContent(
    originalContent: string,
    fileName: string
  ): Promise<AIAnalysisResult> {
    try {
      // Intentar usar Ollama primero
      const ollamaResult = await this.analyzeWithOllama(
        originalContent,
        fileName
      )
      if (ollamaResult) {
        return ollamaResult
      }

      // Si Ollama no está disponible, usar Hugging Face
      const huggingFaceResult = await this.analyzeWithHuggingFace(
        originalContent,
        fileName
      )
      if (huggingFaceResult) {
        return huggingFaceResult
      }

      // Fallback a análisis básico
      return await this.basicAnalysis(originalContent, fileName)
    } catch (error) {
      console.error('Error in analyzeFileContent:', error)
      // Fallback a análisis básico en caso de error
      return await this.basicAnalysis(originalContent, fileName)
    }
  }

  /**
   * Análisis usando Ollama (local y gratuito)
   */
  private async analyzeWithOllama(
    content: string,
    fileName: string
  ): Promise<AIAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(content, fileName)

      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'llama2', // o cualquier modelo que tengas instalado
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          max_tokens: 2000,
        },
      })

      const aiResponse = response.data.response
      return this.parseAIResponse(aiResponse, content)
    } catch (error) {
      console.error('Error con Ollama:', error)
      throw error
    }
  }

  /**
   * Analizar contenido usando Hugging Face
   */
  private async analyzeWithHuggingFace(
    content: string,
    fileName: string
  ): Promise<AIAnalysisResult | null> {
    if (!this.huggingFaceToken) {
      console.log('No hay token de Hugging Face configurado')
      return null
    }

    try {
      const prompt = this.buildAnalysisPrompt(content, fileName)

      // Usar un modelo más potente para análisis de texto
      const model = 'microsoft/DialoGPT-medium' // Modelo alternativo si el principal falla

      const response = await fetch(`${this.huggingFaceUrl}/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.huggingFaceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 500,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(
          `Error de Hugging Face: ${response.status} ${response.statusText}`
        )
      }

      const result = await response.json()

      if (Array.isArray(result) && result.length > 0) {
        const aiResponse = result[0].generated_text || result[0].text || ''
        return this.parseAIResponse(aiResponse, content)
      }

      return null
    } catch (error) {
      console.error('Error con Hugging Face:', error)
      return null
    }
  }

  /**
   * Análisis básico sin IA (fallback)
   */
  private basicAnalysis(content: string, fileName: string): AIAnalysisResult {
    try {
      // Extraer información básica usando regex y análisis de texto
      const dates = this.extractDatesBasic(content)
      const grades = this.extractGradesBasic(content)
      const topics = this.extractTopicsBasic(content)
      const importantInfo = this.extractImportantInfoBasic(content)

      // Generar resumen básico
      const summary = this.generateBasicSummary(
        content,
        fileName,
        dates,
        grades,
        topics
      )

      return {
        dates,
        grades,
        summary,
        topics,
        importantInfo,
      }
    } catch (error) {
      console.error('Error en análisis básico:', error)
      // Retornar resultado vacío en caso de error
      return {
        dates: [],
        grades: [],
        summary: `Error al analizar ${fileName}`,
        topics: [],
        importantInfo: [],
      }
    }
  }

  /**
   * Construir prompt para IA
   */
  private buildAnalysisPrompt(content: string, fileName: string): string {
    return `Analiza el siguiente contenido del archivo "${fileName}" y extrae información estructurada en formato JSON:

CONTENIDO:
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

INSTRUCCIONES:
1. Identifica fechas importantes (exámenes, entregas, eventos)
2. Extrae calificaciones y notas
3. Identifica temas principales
4. Resalta información importante
5. Genera un resumen conciso

RESPONDE EN ESTE FORMATO JSON:
{
  "summary": "Resumen del contenido",
  "dates": [
    {
      "date": "YYYY-MM-DD",
      "type": "tipo de fecha",
      "context": "contexto de la fecha",
      "confidence": 0.9
    }
  ],
  "grades": [
    {
      "name": "nombre de la evaluación",
      "score": 85,
      "maxScore": 100,
      "weight": 20,
      "type": "tipo de evaluación",
      "confidence": 0.9
    }
  ],
  "topics": ["tema1", "tema2", "tema3"],
  "importantInfo": ["punto importante 1", "punto importante 2"]
}

Asegúrate de que el JSON sea válido y completo.`
  }

  /**
   * Parsear respuesta de IA
   */
  private parseAIResponse(
    aiResponse: string,
    originalContent: string
  ): AIAnalysisResult {
    try {
      // Intentar extraer JSON de la respuesta
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])

        // Convertir fechas string a objetos Date
        if (parsed.dates) {
          parsed.dates = parsed.dates.map((date: any) => ({
            ...date,
            date: new Date(date.date),
          }))
        }

        return parsed
      }
    } catch (error) {
      console.error('Error parseando respuesta de IA:', error)
    }

    // Fallback a análisis básico si falla el parsing
    return this.basicAnalysis(originalContent, 'archivo')
  }

  /**
   * Extracción básica de fechas
   */
  private extractDatesBasic(
    content: string
  ): Array<{ date: Date; type: string; context: string; confidence: number }> {
    const dates: Array<{
      date: Date
      type: string
      context: string
      confidence: number
    }> = []

    // Patrones de fechas
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
      /(\d{1,2})-(\d{1,2})-(\d{4})/g,
      /(\d{4})-(\d{1,2})-(\d{1,2})/g,
    ]

    datePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(content)) !== null) {
        try {
          let date: Date

          if (pattern.source.includes('-')) {
            if (pattern.source.startsWith('\\d{4}')) {
              date = new Date(
                parseInt(match[1]),
                parseInt(match[2]) - 1,
                parseInt(match[3])
              )
            } else {
              date = new Date(
                parseInt(match[3]),
                parseInt(match[2]) - 1,
                parseInt(match[1])
              )
            }
          } else {
            date = new Date(
              parseInt(match[3]),
              parseInt(match[2]) - 1,
              parseInt(match[1])
            )
          }

          if (!isNaN(date.getTime())) {
            const context = this.getDateContext(content, match.index)
            const type = this.determineDateType(context)

            dates.push({
              date,
              type,
              context: context.substring(0, 100),
              confidence: 0.8,
            })
          }
        } catch (error) {
          console.warn('Error parseando fecha:', error)
        }
      }
    })

    return dates
  }

  /**
   * Extracción básica de calificaciones
   */
  private extractGradesBasic(content: string): Array<{
    name: string
    score: number
    maxScore: number
    weight: number
    type: string
    confidence: number
  }> {
    const grades: Array<{
      name: string
      score: number
      maxScore: number
      weight: number
      type: string
      confidence: number
    }> = []

    const gradePatterns = [
      /(\w+(?:\s+\w+)*)\s*[:=]\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\(?(\d+(?:\.\d+)?)%?\)?/gi,
      /(\d+(?:\.\d+)?)\s+de\s+(\d+(?:\.\d+)?)\s+en\s+(\w+(?:\s+\w+)*)/gi,
    ]

    gradePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(content)) !== null) {
        try {
          let name: string
          let score: number
          let maxScore: number
          let weight: number = 100

          if (pattern.source.includes('de')) {
            score = parseFloat(match[1])
            maxScore = parseFloat(match[2])
            name = match[3]
          } else {
            name = match[1]
            score = parseFloat(match[2])
            maxScore = parseFloat(match[3])
            if (match[4]) {
              weight = parseFloat(match[4])
            }
          }

          if (!isNaN(score) && !isNaN(maxScore) && name.trim()) {
            const type = this.determineGradeType(name, content)
            grades.push({
              name: name.trim(),
              score,
              maxScore,
              weight,
              type,
              confidence: 0.85,
            })
          }
        } catch (error) {
          console.warn('Error parseando calificación:', error)
        }
      }
    })

    return grades
  }

  /**
   * Extraer temas básicos
   */
  private extractTopicsBasic(content: string): string[] {
    const topics: string[] = []
    const lowerContent = content.toLowerCase()

    // Palabras clave comunes en contenido académico
    const keywords = [
      'matemáticas',
      'matematica',
      'mathematics',
      'álgebra',
      'algebra',
      'cálculo',
      'calculo',
      'calculus',
      'física',
      'fisica',
      'physics',
      'química',
      'quimica',
      'chemistry',
      'biología',
      'biologia',
      'biology',
      'historia',
      'history',
      'literatura',
      'literature',
      'filosofía',
      'filosofia',
      'philosophy',
      'programación',
      'programacion',
      'programming',
      'informática',
      'informatica',
      'computer science',
      'economía',
      'economia',
      'economics',
      'psicología',
      'psicologia',
      'psychology',
    ]

    keywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        topics.push(keyword)
      }
    })

    return topics.slice(0, 5) // Máximo 5 temas
  }

  /**
   * Extraer información importante básica
   */
  private extractImportantInfoBasic(content: string): string[] {
    const importantInfo: string[] = []

    // Buscar frases que contengan palabras clave importantes
    const sentences = content.split(/[.!?]+/)

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase()
      if (
        lowerSentence.includes('importante') ||
        lowerSentence.includes('clave') ||
        lowerSentence.includes('principal') ||
        lowerSentence.includes('objetivo') ||
        lowerSentence.includes('meta') ||
        lowerSentence.includes('requisito') ||
        lowerSentence.includes('requerido')
      ) {
        importantInfo.push(sentence.trim().substring(0, 150))
      }
    })

    return importantInfo.slice(0, 3) // Máximo 3 puntos importantes
  }

  /**
   * Generar resumen básico
   */
  private generateBasicSummary(
    content: string,
    fileName: string,
    dates: Array<{
      date: Date
      type: string
      context: string
      confidence: number
    }>,
    grades: Array<{
      name: string
      score: number
      maxScore: number
      weight: number
      type: string
      confidence: number
    }>,
    topics: string[]
  ): string {
    const summaryParts: string[] = []

    if (dates.length > 0) {
      const recentDates = dates.filter(
        d => d.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ) // Últimos 30 días
      if (recentDates.length > 0) {
        summaryParts.push(
          `Recientes: ${recentDates.map(d => `${d.type} el ${d.date.toLocaleDateString()}`).join(', ')}`
        )
      }
    }

    if (grades.length > 0) {
      const highScores = grades.filter(g => g.score >= 80)
      if (highScores.length > 0) {
        summaryParts.push(
          `Notas altas: ${highScores.map(g => `${g.name} (${g.score}/${g.maxScore})`).join(', ')}`
        )
      }
    }

    if (topics.length > 0) {
      summaryParts.push(`Temas: ${topics.join(', ')}`)
    }

    if (summaryParts.length === 0) {
      return `Análisis básico de ${fileName}`
    }

    return `Análisis básico de ${fileName}: ${summaryParts.join('; ')}.`
  }

  /**
   * Obtener contexto de fecha
   */
  private getDateContext(content: string, index: number): string {
    const start = Math.max(0, index - 100)
    const end = Math.min(content.length, index + 100)
    return content.substring(start, end)
  }

  /**
   * Determinar tipo de fecha
   */
  private determineDateType(context: string): string {
    const lowerContext = context.toLowerCase()

    if (lowerContext.includes('examen') || lowerContext.includes('exam'))
      return 'examen'
    if (lowerContext.includes('trabajo') || lowerContext.includes('assignment'))
      return 'trabajo'
    if (lowerContext.includes('entrega') || lowerContext.includes('due'))
      return 'entrega'
    if (lowerContext.includes('clase') || lowerContext.includes('class'))
      return 'clase'
    if (lowerContext.includes('revisión') || lowerContext.includes('review'))
      return 'revisión'

    return 'otro'
  }

  /**
   * Determinar tipo de calificación
   */
  private determineGradeType(name: string, content: string): string {
    const lowerName = name.toLowerCase()
    const lowerContent = content.toLowerCase()

    if (
      lowerName.includes('examen') ||
      lowerName.includes('exam') ||
      lowerContent.includes('examen')
    )
      return 'examen'
    if (
      lowerName.includes('trabajo') ||
      lowerName.includes('project') ||
      lowerContent.includes('trabajo')
    )
      return 'trabajo'
    if (
      lowerName.includes('quiz') ||
      lowerName.includes('test') ||
      lowerContent.includes('quiz')
    )
      return 'quiz'
    if (
      lowerName.includes('participación') ||
      lowerName.includes('participation')
    )
      return 'participación'
    if (
      lowerName.includes('tarea') ||
      lowerName.includes('homework') ||
      lowerContent.includes('tarea')
    )
      return 'tarea'

    return 'otro'
  }

  /**
   * Obtener información del sistema
   */
  public getSystemInfo(): {
    ollama: boolean
    huggingFace: boolean
    hasToken: boolean
  } {
    return {
      ollama: false, // Se verifica dinámicamente
      huggingFace: true,
      hasToken: !!this.huggingFaceToken,
    }
  }
}
