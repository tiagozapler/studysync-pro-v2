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

      const prompt = `Analiza el siguiente contenido del archivo "${fileName}" siguiendo un proceso estructurado en 4 ETAPAS.

**SISTEMA DE CALIFICACIÓN: Escala de 0-20 puntos** (sistema latinoamericano/peruano)

CONTENIDO DEL ARCHIVO:
${truncatedContent}

---

🔹 ETAPA 1: PROCESAMIENTO Y LIMPIEZA

1. Lee el contenido y elimina información repetitiva:
   - Encabezados/pies de página (ej: "Facultad de...", "Sílabos 2025-2")
   - Información administrativa irrelevante
   
2. Identifica si el documento es:
   - SOLO un sílabo (sistema de evaluación sin notas)
   - Sílabo + notas del estudiante (tiene puntajes como "15/20")

🔹 ETAPA 2: IDENTIFICACIÓN DE EVALUACIONES

Busca ÚNICAMENTE en estas secciones:
- "VI. Programa analítico"
- "VII. Evaluación"
- "Cronograma de evaluaciones"
- "Sistema de evaluación"
- "Criterios de evaluación"

Extrae:
- Semana/Fecha (ej: "Semana 5", "10/11/2025")
- Tipo de evaluación (Examen escrito, Parcial, Trabajo, Proyecto)
- Descripción breve
- Peso (%) - SOLO si está explícito

Reconoce abreviaturas:
- EE = Examen escrito
- TI = Trabajo de investigación
- PF = Proyecto final
- PC = Práctica calificada
- EC = Evaluación continua

🔹 ETAPA 3: DETECCIÓN DE NOTAS DEL ESTUDIANTE

**CRÍTICO:** Solo incluye calificaciones si VES puntajes explícitos:
- "Examen escrito 1: 15/20"
- "TI: 18 puntos"
- "Nota obtenida: 16/20"

Si NO hay puntajes → grades: []

🔹 ETAPA 4: VALIDACIÓN Y CONSISTENCIA

Antes de responder, verifica:
1. ¿Las evaluaciones del Programa Analítico coinciden con Sistema de Evaluación?
2. ¿Los pesos suman aproximadamente 100%?
3. ¿Hay notas del estudiante o solo el sílabo?
4. ¿Eliminaste duplicados?

Responde ÚNICAMENTE con JSON válido en este formato:
{
  "dates": [
    {
      "date": "YYYY-MM-DD" o "Semana X",
      "type": "exam|assignment|class|other",
      "context": "Tipo de evaluación + descripción breve",
      "confidence": 0.8
    }
  ],
  "grades": [
    {
      "name": "Nombre EXACTO de la evaluación",
      "score": número_de_0_a_20,
      "maxScore": 20,
      "weight": porcentaje_de_0_a_100,
      "type": "exam|quiz|project|homework|participation|other"
    }
  ],
  "summary": "Breve resumen del sílabo y evaluaciones encontradas"
}

REGLAS FINALES:
1. Si NO hay notas del estudiante → grades: []
2. Si NO hay pesos explícitos → weight: 100
3. maxScore siempre es 20
4. Solo JSON válido, sin texto adicional`;

      console.log('🤖 Enviando a Groq para análisis...');
      const completion = await this.groqClient.chat.completions.create({
        model: 'llama-3.1-8b-instant', // Modelo estable y rápido
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente experto en análisis de sílabos académicos peruanos/latinoamericanos. Sigues un proceso de 4 ETAPAS: 1) Limpia el texto eliminando encabezados repetitivos. 2) Identifica evaluaciones SOLO en secciones de "Programa analítico" y "Evaluación". 3) Detecta notas del estudiante (si existen). 4) Valida consistencia. CRÍTICO: Distingue sílabo (solo sistema de evaluación) vs documento con notas del estudiante (tiene "15/20", "18 puntos"). Si solo es sílabo → grades: []. NUNCA inventes pesos ni notas. Respondes SOLO JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Temperatura muy baja para máxima precisión y menos creatividad
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content?.trim() || '';
      console.log('✅ Respuesta de Groq recibida');
      console.log('📋 Respuesta:', responseText.substring(0, 200) + '...');

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
