import Groq from 'groq-sdk';
import env from '../config/env';

export interface DetectedDate {
  date: Date;
  type: 'examen' | 'entrega' | 'clase' | 'otro';
  context: string;
  confidence: number;
}

export interface DetectedGrade {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  type: 'exam' | 'quiz' | 'project' | 'homework' | 'participation' | 'other';
}

export interface FileAnalysisResult {
  dates: DetectedDate[];
  grades: DetectedGrade[];
  summary: string;
}

export class AIFileAnalyzer {
  private groqClient: Groq | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || localStorage.getItem('groqApiKey') || env.GROQ_API_KEY;
    if (key) {
      this.groqClient = new Groq({
        apiKey: key,
        dangerouslyAllowBrowser: true,
      });
    }
  }

  async analyzeFile(
    fileName: string,
    fileContent: string
  ): Promise<FileAnalysisResult> {
    if (!this.groqClient) {
      console.warn('Groq not configured, skipping AI analysis');
      return { dates: [], grades: [], summary: '' };
    }

    try {
      // Limitar contenido para no exceder límites de tokens
      const truncatedContent = fileContent.substring(0, 4000);

      const prompt = `Analiza el siguiente contenido del archivo "${fileName}" y extrae:

1. FECHAS IMPORTANTES: Busca fechas de exámenes, entregas, clases especiales, etc.
2. CALIFICACIONES: Busca notas, puntuaciones, evaluaciones con sus pesos.

CONTENIDO:
${truncatedContent}

Responde ÚNICAMENTE con un objeto JSON válido en este formato exacto (sin comentarios ni texto adicional):
{
  "dates": [
    {
      "date": "YYYY-MM-DD",
      "type": "examen|entrega|clase|otro",
      "context": "descripción breve",
      "confidence": 0.0-1.0
    }
  ],
  "grades": [
    {
      "name": "nombre de la evaluación",
      "score": número,
      "maxScore": número,
      "weight": porcentaje (0-100),
      "type": "exam|quiz|project|homework|participation|other"
    }
  ],
  "summary": "resumen breve del contenido"
}

REGLAS IMPORTANTES:
- Solo incluye fechas futuras o del presente
- Solo incluye calificaciones con valores numéricos claros
- Si no encuentras fechas o calificaciones, devuelve arrays vacíos []
- El JSON debe ser válido (sin comas finales, comillas correctas)`;

      const completion = await this.groqClient.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente experto en análisis de documentos académicos. Respondes ÚNICAMENTE con JSON válido, sin texto adicional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const responseText = completion.choices[0]?.message?.content?.trim() || '';

      // Limpiar la respuesta para obtener solo el JSON
      let jsonText = responseText;
      
      // Remover posibles bloques de código markdown
      if (jsonText.includes('```')) {
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
          jsonText = match[1].trim();
        }
      }

      // Intentar parsear el JSON
      try {
        const result = JSON.parse(jsonText);
        
        // Validar y transformar fechas
        const validDates: DetectedDate[] = (result.dates || [])
          .map((d: any) => {
            try {
              const date = new Date(d.date);
              if (isNaN(date.getTime())) return null;
              
              return {
                date,
                type: d.type || 'otro',
                context: d.context || '',
                confidence: d.confidence || 0.5,
              };
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        // Validar calificaciones
        const validGrades: DetectedGrade[] = (result.grades || [])
          .map((g: any) => {
            if (!g.name || !g.score || !g.maxScore) return null;
            
            return {
              name: g.name,
              score: parseFloat(g.score),
              maxScore: parseFloat(g.maxScore),
              weight: parseFloat(g.weight) || 100,
              type: g.type || 'other',
            };
          })
          .filter(Boolean);

        return {
          dates: validDates,
          grades: validGrades,
          summary: result.summary || '',
        };
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('AI Response:', responseText);
        return { dates: [], grades: [], summary: '' };
      }
    } catch (error) {
      console.error('Error analyzing file with AI:', error);
      return { dates: [], grades: [], summary: '' };
    }
  }

  /**
   * Análisis rápido sin IA (fallback)
   */
  static quickAnalysis(content: string): FileAnalysisResult {
    const dates: DetectedDate[] = [];
    const grades: DetectedGrade[] = [];

    // Patrones simples de fechas
    const datePatterns = [
      /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/g,
      /(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/g,
    ];

    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        try {
          const date = new Date(match[0]);
          if (!isNaN(date.getTime())) {
            dates.push({
              date,
              type: 'otro',
              context: content.substring(
                Math.max(0, match.index - 50),
                Math.min(content.length, match.index + 50)
              ),
              confidence: 0.6,
            });
          }
        } catch {
          // Ignorar fechas inválidas
        }
      }
    });

    // Patrones simples de calificaciones
    const gradePattern = /(\w+(?:\s+\w+)*)\s*[:=]\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/gi;
    let gradeMatch;
    
    while ((gradeMatch = gradePattern.exec(content)) !== null) {
      grades.push({
        name: gradeMatch[1].trim(),
        score: parseFloat(gradeMatch[2]),
        maxScore: parseFloat(gradeMatch[3]),
        weight: 100,
        type: 'other',
      });
    }

    return {
      dates: dates.slice(0, 5), // Limitar a 5 fechas
      grades: grades.slice(0, 5), // Limitar a 5 calificaciones
      summary: content.substring(0, 200),
    };
  }
}
