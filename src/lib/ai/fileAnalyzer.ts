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

      const prompt = `Analiza el siguiente contenido del archivo "${fileName}" y extrae información académica.

**SISTEMA DE CALIFICACIÓN: Escala de 0-20 puntos** (sistema latinoamericano/peruano)

CONTENIDO DEL ARCHIVO:
${truncatedContent}

---

INSTRUCCIONES CRÍTICAS:

**IMPORTANTE: Los sílabos pueden variar en formato. Adapta tu búsqueda según la estructura del documento.**

1. **FECHAS IMPORTANTES**: 
   - BUSCA en secciones como: "Programa analítico", "CRONOGRAMA", "Calendario", "Fechas", "Schedule"
   - Pueden estar en secciones numeradas (VI., VII., etc.) o con títulos diferentes
   
   **FORMATOS POSIBLES:**
   a) TABLA con semanas y evaluaciones:
      "Semana  Tema             Evaluación
       5       Ratios           EE1"
      → Si hay fechas explícitas en otra parte, úsalas
   
   b) FECHAS EXPLÍCITAS (preferidas):
      "15/03/2024", "2024-03-15", "15 de marzo", "marzo 15"
      → Usa estas fechas directamente
   
   c) TEXTO descriptivo:
      "El examen parcial será el 20 de marzo"
      → Extrae la fecha y el contexto
   
   **REGLAS:**
   - SOLO incluye fechas con día/mes/año completo
   - Si solo hay "Semana X", NO la incluyas
   - Adapta según lo que encuentres en el documento

2. **CALIFICACIONES - REGLAS ESTRICTAS**:
   
   **DETECCIÓN DE PESOS/PORCENTAJES:**
   - El PESO es el porcentaje que vale la evaluación del total de la nota final
   - BUSCA en secciones como: "Evaluación", "Sistema de Evaluación", "Calificación", "Ponderación", "Grading", "Assessment"
   - La sección puede estar numerada (VII., VIII., etc.) o tener títulos variados
   
   **FORMATOS POSIBLES (adapta según el documento):**
   
   a) TABLA con columna "Peso" o "Weight" o "%":
      Ejemplos de encabezados: "Peso", "Ponderación", "Porcentaje", "%", "Weight"
      "N.º  Semana  Tipo de evaluación     Peso
       1    5       Examen escrito 1       20
       2    10      Examen escrito 2       25"
      → Busca la columna que contenga números sin "%" o con "%"
   
   b) LISTA con porcentajes:
      "- Exámenes parciales: 40%"
      "- Prácticas (30%)"
      "- Trabajo Final - 20%"
      → Los números con "%" son los pesos
   
   c) TEXTO descriptivo:
      "vale 30% de la nota", "pesa 40%", "representa el 25%"
   
   d) TABLA sin encabezado explícito de "Peso":
      A veces la tabla tiene números sin encabezado claro
      → Busca una columna con números que sumen cerca de 100
   
   **REGLAS CRÍTICAS:**
   - PRIORIDAD: Busca primero tablas, luego listas, luego texto
   - Si encuentras pesos que sumen cerca de 100 (95-100), úsalos
   - **SI NO HAY PESOS EXPLÍCITOS, USA weight: 100**
   - **NUNCA inventes pesos distribuyendo 100/N evaluaciones**
   - Adapta la búsqueda al formato específico del documento
   
   **DETECCIÓN DE NOTAS:**
   - Las notas están en escala de 0-20 (NO de 0-100)
   - BUSCA PATRONES como:
     * "15/20" o "15 de 20" o "15 sobre 20"
     * "Nota: 18" o "Calificación: 16"
     * "Obtuvo 14 puntos"
   
   **TIPOS DE EVALUACIÓN:**
   - Parcial/Examen/Midterm → "exam"
   - Práctica/Tarea/Homework → "homework"
   - Proyecto/Trabajo Final → "project"
   - Participación → "participation"
   - Quiz/Prueba Corta → "quiz"
   - Otros → "other"

**EJEMPLOS REALES DE SÍLABOS:**

✅ EJEMPLO 1 - Formato con tabla de evaluación:
Texto del sílabo:
"VII. Evaluación
N.º  Semana  Tipo de evaluación  Peso
1    5       Examen escrito 1    20
2    10      Examen escrito 2    25
3    13      Trabajo de Investigación  30
4    15      Examen escrito 3    25"

Si encuentras notas del estudiante:
"Examen escrito 1: 15/20"
"Trabajo de Investigación: 18/20"

→ Resultado:
{ name: "Examen escrito 1", score: 15, maxScore: 20, weight: 20, type: "exam" }
{ name: "Trabajo de Investigación", score: 18, maxScore: 20, weight: 30, type: "project" }

✅ EJEMPLO 2 - Formato con porcentajes:
Texto del sílabo:
"SISTEMA DE EVALUACIÓN:
- Exámenes Parciales (40%)
- Prácticas Calificadas (30%)
- Trabajo Final (20%)
- Participación (10%)"

→ Resultado (si hay notas):
{ name: "Parcial 1", score: 15, maxScore: 20, weight: 40, type: "exam" }
{ name: "Práctica 1", score: 18, maxScore: 20, weight: 30, type: "homework" }

✅ CORRECTO - Sin pesos en el documento:
- Texto: "Práctica 2: obtuvo 16 de 20 puntos"
  → { name: "Práctica 2", score: 16, maxScore: 20, weight: 100, type: "homework" }
  (weight = 100 porque NO se menciona el porcentaje)

✅ CORRECTO - Con peso explícito:
- Texto: "Proyecto Final: 19/20 - Representa el 40% del curso"
  → { name: "Proyecto Final", score: 19, maxScore: 20, weight: 40, type: "project" }

❌ INCORRECTO (NO INVENTES PESOS):
- Si solo dice "Parcial 1: 15/20" y NO hay sección de evaluación → weight debe ser 100, NO inventes 25 o 30
- Si hay 4 evaluaciones pero NO se menciona "%" → NO dividas 100/4 = 25, usa weight: 100 para todas
- Si solo dice "Examen: 18 puntos" → weight debe ser 100, NO adivines

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
      "name": "nombre exacto de la evaluación como aparece en el texto",
      "score": número_de_0_a_20,
      "maxScore": 20,
      "weight": porcentaje_0_a_100_SOLO_SI_SE_MENCIONA_EXPLÍCITAMENTE,
      "type": "exam|quiz|project|homework|participation|other"
    }
  ],
  "summary": "resumen del contenido del archivo en 1-2 oraciones"
}

REGLAS CRÍTICAS - LEE ESTO CUIDADOSAMENTE:
1. maxScore SIEMPRE debe ser 20
2. weight: SOLO usa un número diferente de 100 si el texto EXPLÍCITAMENTE menciona "vale X%", "pesa X%", "X% del total", etc.
3. weight: Si NO hay mención explícita de porcentaje o peso, SIEMPRE usa 100
4. NO INVENTES ni ADIVINES pesos basándote en el número de evaluaciones
5. score debe estar entre 0 y 20
6. Solo incluye calificaciones donde puedas ver claramente la nota
7. Si no hay fechas o notas, devuelve arrays vacíos []
8. JSON válido: sin comas finales, comillas dobles
9. Copia el nombre de la evaluación EXACTAMENTE como aparece en el documento`;

      console.log('🤖 Enviando a Groq para análisis...');
      const completion = await this.groqClient.chat.completions.create({
        model: 'llama-3.1-8b-instant', // Modelo estable y rápido
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente experto en análisis de documentos académicos del sistema educativo peruano/latinoamericano. Los sílabos varían en formato, así que ADAPTA tu búsqueda a la estructura del documento. Entiendes calificaciones en escala 0-20 y porcentajes de peso en diferentes formatos (tablas, listas, texto). REGLA CRÍTICA: NUNCA inventes o adivines pesos/porcentajes - solo extrae lo que está EXPLÍCITAMENTE escrito. Si no encuentras pesos explícitos, usa weight: 100 para TODAS las evaluaciones. Respondes ÚNICAMENTE con JSON válido, sin texto adicional.',
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
