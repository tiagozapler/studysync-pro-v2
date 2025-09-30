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
      console.warn('⚠️ Groq not configured, skipping AI analysis');
      return { dates: [], grades: [], summary: '' };
    }

    try {
      console.log(`🔍 Analizando archivo: ${fileName}`);
      console.log(`📄 Contenido: ${fileContent.length} caracteres`);
      
      // Limitar contenido para no exceder límites de tokens
      const truncatedContent = fileContent.substring(0, 4000);
      console.log(`✂️ Contenido truncado a: ${truncatedContent.length} caracteres`);

      const prompt = `Analiza este sílabo y extrae SOLO evaluaciones y notas.

ARCHIVO: "${fileName}"
CONTENIDO:
${truncatedContent}

---

INSTRUCCIONES:
1. Busca en secciones: "Programa analítico" y "Evaluación"
2. Extrae: tipo de evaluación, semana, peso (%)
3. Solo incluye calificaciones (grades) si VES puntajes como "15/20" o "18 puntos"
4. Si NO hay notas del estudiante → grades: []
5. Si NO hay pesos → weight: 100
6. Abreviaturas: EE=Examen, TI=Trabajo, PF=Proyecto

Responde SOLO con este JSON (sin texto adicional):

{
  "dates": [
    {
      "date": "YYYY-MM-DD (o Semana X si no hay fecha exacta)",
      "type": "exam|assignment|class|other",
      "context": "Examen escrito 1 - Ratios financieros",
      "confidence": 0.8
    }
  ],
  "grades": [],
  
IMPORTANTE: "grades" solo debe tener elementos si el documento tiene NOTAS del estudiante (ej: "15/20", "18 puntos").
Si el documento es SOLO un sílabo SIN notas, deja "grades": [] vacío.

Ejemplo CON notas:
  "grades": [{"name": "Examen 1", "score": 15, "maxScore": 20, "weight": 20, "type": "exam"}]
  
Ejemplo SIN notas (solo sílabo):
  "grades": []
  "summary": "Sílabo con 4 evaluaciones: 2 exámenes escritos (45%), 1 trabajo de investigación (30%), 1 examen final (25%)"
}

REGLAS CRÍTICAS:
- Si NO hay notas del estudiante en el documento → "grades": []
- Si NO hay pesos explícitos → weight: 100
- maxScore SIEMPRE es 20
- Solo devuelve JSON válido sin texto adicional`;

      console.log('🤖 Enviando a Groq para análisis...');
      const completion = await this.groqClient.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content:
              'Eres un analizador de sílabos. Tu respuesta DEBE ser SOLO un objeto JSON válido, nada más. No escribas explicaciones, no uses markdown, no agregues texto antes o después del JSON. Solo el JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0,
        max_tokens: 1500,
      });

      const responseText = completion.choices[0]?.message?.content?.trim() || '';
      console.log('✅ Respuesta de Groq recibida');
      console.log('📋 Respuesta completa:', responseText);

      // Extraer JSON de la respuesta (maneja texto antes/después)
      let jsonText = responseText;
      
      // 1. Intentar extraer de bloques de código markdown
      if (jsonText.includes('```')) {
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
          jsonText = match[1].trim();
          console.log('📋 JSON extraído de markdown');
        }
      }
      
      // 2. Buscar el primer { y el último }
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        console.log('📋 JSON extraído entre llaves');
      }

      // Intentar parsear el JSON
      try {
        console.log('📊 Parseando JSON...');
        const result = JSON.parse(jsonText);
        console.log('✅ JSON parseado correctamente');
        console.log(`📅 Fechas encontradas: ${result.dates?.length || 0}`);
        console.log(`📊 Calificaciones encontradas: ${result.grades?.length || 0}`);
        
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
            if (!g.name) return null;
            
            // Si score es un array vacío, undefined, null, o no existe → NO incluir
            if (!g.score || Array.isArray(g.score) || g.score === 'undefined' || g.score === '') {
              console.log(`⚠️ Calificación sin nota detectada (ignorada): ${g.name}`);
              return null;
            }
            
            const score = parseFloat(g.score);
            const maxScore = 20; // Siempre 20 para sistema peruano/latinoamericano
            const weight = parseFloat(g.weight) || 100; // Si no hay peso, asumimos 100
            
            // Validar que la nota esté en rango válido
            if (isNaN(score) || score < 0 || score > 20) {
              console.log(`⚠️ Score inválido para ${g.name}: ${score}`);
              return null;
            }
            
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

        const analysisResult = {
          dates: validDates,
          grades: validGrades,
          summary: result.summary || '',
        };
        
        console.log(`✅ Análisis completado: ${validDates.length} fechas, ${validGrades.length} calificaciones`);
        console.log('📊 Calificaciones detectadas:', validGrades);
        console.log('📅 Fechas detectadas:', validDates);
        return analysisResult;
      } catch (parseError) {
        console.error('❌ Error parsing AI response:', parseError);
        console.log('📋 AI Response:', responseText);
        return { dates: [], grades: [], summary: '' };
      }
    } catch (error: any) {
      console.error('❌ Error analyzing file with AI:', error);
      console.error('Detalles del error:', error?.message || error);
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
