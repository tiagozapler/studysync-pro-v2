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

      const prompt = `Analiza el siguiente contenido del archivo "${fileName}" y extrae información académica.

**SISTEMA DE CALIFICACIÓN: Escala de 0-20 puntos** (sistema latinoamericano/peruano)

CONTENIDO DEL ARCHIVO:
${truncatedContent}

---

INSTRUCCIONES:

1. **FECHAS IMPORTANTES**: 
   - Busca fechas de exámenes, entregas de trabajos, proyectos, presentaciones
   - Identifica el tipo de evento
   - Extrae el contexto (qué es el evento)

2. **CALIFICACIONES** (MUY IMPORTANTE):
   - Las notas están en escala de 0-20 (NO de 0-100)
   - Busca evaluaciones con sus puntuaciones
   - Identifica el PESO/PORCENTAJE de cada evaluación (ej: "30%", "vale 40%", "pesa 25%")
   - Si NO se menciona el peso explícitamente, usa 100 (significa que no se especificó)
   - Tipos: Parcial/Examen → "exam", Práctica → "homework", Proyecto → "project", Participación → "participation"

**EJEMPLOS DE CALIFICACIONES:**
- "Parcial 1: 15/20 (30%)" → score: 15, maxScore: 20, weight: 30
- "Examen Final: 18 puntos de 20 (40%)" → score: 18, maxScore: 20, weight: 40
- "Práctica 2: 16/20" → score: 16, maxScore: 20, weight: 100 (no especificado)
- "Proyecto: 19 sobre 20, vale 35%" → score: 19, maxScore: 20, weight: 35

Responde ÚNICAMENTE con JSON válido en este formato:
{
  "dates": [
    {
      "date": "YYYY-MM-DD",
      "type": "examen|entrega|clase|otro",
      "context": "descripción breve del evento",
      "confidence": 0.8
    }
  ],
  "grades": [
    {
      "name": "nombre de la evaluación",
      "score": número_de_0_a_20,
      "maxScore": 20,
      "weight": porcentaje_0_a_100,
      "type": "exam|quiz|project|homework|participation|other"
    }
  ],
  "summary": "resumen del contenido en 1-2 oraciones"
}

REGLAS CRÍTICAS:
- maxScore SIEMPRE debe ser 20
- weight: Si NO se menciona peso, usa 100
- weight: Si dice "30%", usa 30 (no 0.30)
- Solo incluye calificaciones con números claros
- Si no hay fechas o notas, devuelve arrays vacíos []
- JSON válido: sin comas finales, comillas dobles`;

      const completion = await this.groqClient.chat.completions.create({
        model: 'llama-3.1-70b-versatile', // Modelo más potente para mejor comprensión
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente experto en análisis de documentos académicos del sistema educativo peruano/latinoamericano. Entiendes calificaciones en escala 0-20 y porcentajes de peso. Respondes ÚNICAMENTE con JSON válido, sin texto adicional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // Baja temperatura para respuestas más precisas
        max_tokens: 2000,
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
            if (!g.name || !g.score) return null;
            
            const score = parseFloat(g.score);
            const maxScore = 20; // Siempre 20 para sistema peruano/latinoamericano
            const weight = parseFloat(g.weight) || 100; // Si no hay peso, asumimos 100
            
            // Validar que la nota esté en rango válido
            if (score < 0 || score > 20) return null;
            
            // Validar que el peso sea razonable
            if (weight < 0 || weight > 100) return null;
            
            return {
              name: g.name,
              score,
              maxScore,
              weight,
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
