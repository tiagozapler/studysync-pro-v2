/**
 * Parser de sílabos basado en regex (sin IA)
 * Extrae evaluaciones, fechas y estructura del sílabo de manera confiable
 */

export interface SyllabusEvaluation {
  number: number;
  week?: number;
  date?: string;
  name: string;
  abbreviation?: string; // EE, TI, PC, etc.
  weight: number;
  type: 'exam' | 'project' | 'homework' | 'participation' | 'other';
}

export interface SyllabusScheduleItem {
  week: number;
  date?: string;
  topic: string;
  evaluation?: string;
}

export interface ParsedSyllabus {
  evaluations: SyllabusEvaluation[];
  schedule: SyllabusScheduleItem[];
  metadata: {
    courseName?: string;
    professor?: string;
    semester?: string;
  };
}

/**
 * Detecta el tipo de evaluación basado en el nombre
 */
function detectEvaluationType(name: string): SyllabusEvaluation['type'] {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('examen') || nameLower.includes('exam')) {
    return 'exam';
  }
  if (nameLower.includes('trabajo') || nameLower.includes('project') || 
      nameLower.includes('investigación') || nameLower.includes('investigacion')) {
    return 'project';
  }
  if (nameLower.includes('práctica') || nameLower.includes('practica') || 
      nameLower.includes('tarea') || nameLower.includes('homework')) {
    return 'homework';
  }
  if (nameLower.includes('participación') || nameLower.includes('participacion') || 
      nameLower.includes('asistencia')) {
    return 'participation';
  }
  
  return 'other';
}

/**
 * Normaliza abreviaturas comunes de evaluaciones
 */
function normalizeAbbreviation(abbr: string): string {
  const normalized = abbr.trim().toUpperCase();
  
  // Mapeo de abreviaturas comunes
  const abbreviationMap: Record<string, string> = {
    'EE': 'EE',    // Examen Escrito
    'EP': 'EP',    // Examen Parcial
    'EF': 'EF',    // Examen Final
    'TI': 'TI',    // Trabajo de Investigación
    'PC': 'PC',    // Práctica Calificada
    'EC': 'EC',    // Evaluación Continua
    'PF': 'PF',    // Producto Final
    'TA': 'TA',    // Trabajo Académico
  };
  
  return abbreviationMap[normalized] || normalized;
}

/**
 * Extrae evaluaciones de la sección "VII. Evaluación"
 */
function parseEvaluationSection(content: string): SyllabusEvaluation[] {
  console.log('📊 Iniciando extracción de evaluaciones...');
  
  // 1. Buscar sección de Evaluación (VII o similar)
  const evalSectionRegex = /(?:VII|7)\.?\s*(?:Sistema\s+de\s+)?Evaluaci[oó]n([\s\S]*?)(?:VIII|8|\n\n\n|$)/i;
  const evalSectionMatch = content.match(evalSectionRegex);
  
  if (!evalSectionMatch) {
    console.log('❌ No se encontró sección de Evaluación');
    return [];
  }
  
  const evalSection = evalSectionMatch[1];
  console.log('✅ Sección de Evaluación encontrada');
  
  // 2. Buscar tabla de evaluación
  // Formatos posibles:
  // - "N.º  Semana  Tipo de evaluación     Peso"
  // - "Evaluación  Sigla  Peso"
  // - "Tipo  %"
  
  const evaluations: SyllabusEvaluation[] = [];
  
  // Estrategia 1: Tabla con columnas N.º, Semana, Tipo, Peso
  const tableMatch = evalSection.match(/N\.?\s*º.*?(?:Semana|Fecha).*?(?:Tipo|Evaluaci[oó]n).*?Peso([\s\S]*?)(?:\n\n|$)/i);
  
  if (tableMatch) {
    console.log('✅ Tabla de evaluación encontrada (formato estándar)');
    const tableContent = tableMatch[1];
    console.log('📋 Contenido de la tabla:', tableContent.substring(0, 500));

    // Estrategia robusta: detectar cada bloque por índice y semana, y extraer el peso
    const startRegex = /(\d+)\s+(\d+)\s+/g; // (número) (semana)
    const starts: Array<{ idx: number; number: number; week: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = startRegex.exec(tableContent)) !== null) {
      starts.push({ idx: m.index, number: parseInt(m[1]), week: parseInt(m[2]) });
    }

    for (let i = 0; i < starts.length; i++) {
      const cur = starts[i];
      const next = starts[i + 1];
      const segment = tableContent.slice(cur.idx, next ? next.idx : tableContent.length);
      console.log('🔎 Segmento detectado:', segment.trim());

      // Quitar prefijo "número semana"
      const body = segment.replace(/^\s*\d+\s+\d+\s+/, '');

      // Peso: número que precede a un porcentaje (ej. "20  100%" o "30  75%")
      const weightMatch = body.match(/(\d{1,3})\s+\d{1,3}%/);
      const weight = weightMatch ? parseInt(weightMatch[1]) : NaN;

      // Nombre: todo lo que queda antes del peso detectado
      let name = body;
      if (weightMatch && typeof weightMatch.index === 'number') {
        name = body.slice(0, weightMatch.index).trim();
      }
      // Normalizar espacios en nombre
      name = name.replace(/\s+/g, ' ').trim();

      console.log('✅ Evaluación capturada:', {
        number: cur.number,
        week: cur.week,
        name,
        weight,
      });

      evaluations.push({
        number: cur.number,
        week: cur.week,
        name,
        weight: isNaN(weight) ? 0 : weight,
        type: detectEvaluationType(name),
      });
    }

    console.log(`📊 Total evaluaciones extraídas: ${evaluations.length}`);
  }
  
  // Estrategia 2: Tabla con Siglas (EE1, EE2, TI, etc.)
  if (evaluations.length === 0) {
    console.log('🔄 Intentando formato con siglas...');
    
    // Buscar líneas como "EE1  Examen Escrito 1  20"
    const siglaRegex = /([A-Z]{2,3}\d*)\s+(.+?)\s+(\d+)%?/g;
    let match;
    
    while ((match = siglaRegex.exec(evalSection)) !== null) {
      const [, abbr, name, weight] = match;
      
      evaluations.push({
        number: evaluations.length + 1,
        name: name.trim(),
        abbreviation: normalizeAbbreviation(abbr),
        weight: parseInt(weight),
        type: detectEvaluationType(name),
      });
    }
  }
  
  // Estrategia 3: Formato simple "Tipo: X%"
  if (evaluations.length === 0) {
    console.log('🔄 Intentando formato simple...');
    
    const simpleRegex = /(?:^|\n)\s*([^:\n]+?)\s*:\s*(\d+)%/g;
    let match;
    
    while ((match = simpleRegex.exec(evalSection)) !== null) {
      const [, name, weight] = match;
      
      evaluations.push({
        number: evaluations.length + 1,
        name: name.trim(),
        weight: parseInt(weight),
        type: detectEvaluationType(name),
      });
    }
  }
  
  console.log(`✅ Evaluaciones extraídas: ${evaluations.length}`);
  evaluations.forEach(e => console.log(`   - ${e.name} (${e.weight}%)`));
  
  return evaluations;
}

/**
 * Extrae cronograma de la sección correspondiente
 */
function parseScheduleSection(content: string): SyllabusScheduleItem[] {
  console.log('📅 Iniciando extracción de cronograma...');
  
  // Buscar sección de Cronograma
  const scheduleRegex = /(?:VI|6)\.?\s*Cronograma([\s\S]*?)(?:VII|7|\n\n\n|$)/i;
  const scheduleMatch = content.match(scheduleRegex);
  
  if (!scheduleMatch) {
    console.log('❌ No se encontró sección de Cronograma');
    return [];
  }
  
  const scheduleSection = scheduleMatch[1];
  console.log('✅ Sección de Cronograma encontrada');
  
  const schedule: SyllabusScheduleItem[] = [];
  const lines = scheduleSection.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Regex para capturar: Semana X (Fecha opcional) Tema (Evaluación opcional)
    // Ejemplos:
    // "1  02/03  Introducción  -"
    // "5  30/03  Tema 5  EE1"
    const rowMatch = line.match(/^\s*(\d+)\s+(?:(\d{2}\/\d{2})\s+)?(.+?)(?:\s+(EE\d*|TI|PC\d*|EC|PF))?\s*$/);
    
    if (rowMatch) {
      const [, week, date, topic, evaluation] = rowMatch;
      
      schedule.push({
        week: parseInt(week),
        date: date || undefined,
        topic: topic.trim(),
        evaluation: evaluation || undefined,
      });
    }
  }
  
  console.log(`✅ Elementos de cronograma extraídos: ${schedule.length}`);
  
  return schedule;
}

/**
 * Extrae metadatos del sílabo (nombre del curso, profesor, semestre)
 */
function parseMetadata(content: string): ParsedSyllabus['metadata'] {
  const metadata: ParsedSyllabus['metadata'] = {};
  
  // Nombre del curso
  const courseMatch = content.match(/(?:Curso|Asignatura)\s*:\s*(.+?)(?:\n|$)/i);
  if (courseMatch) {
    metadata.courseName = courseMatch[1].trim();
  }
  
  // Profesor
  const professorMatch = content.match(/(?:Profesor|Docente)\s*:\s*(.+?)(?:\n|$)/i);
  if (professorMatch) {
    metadata.professor = professorMatch[1].trim();
  }
  
  // Semestre/Ciclo
  const semesterMatch = content.match(/(?:Semestre|Ciclo|Periodo)\s*:\s*(.+?)(?:\n|$)/i);
  if (semesterMatch) {
    metadata.semester = semesterMatch[1].trim();
  }
  
  return metadata;
}

/**
 * Parser principal del sílabo
 */
export function parseSyllabus(content: string): ParsedSyllabus {
  console.log('📄 Iniciando análisis de sílabo...');
  console.log(`📊 Contenido: ${content.length} caracteres`);
  
  const evaluations = parseEvaluationSection(content);
  const schedule = parseScheduleSection(content);
  const metadata = parseMetadata(content);
  
  console.log('✅ Análisis completado');
  console.log(`   - Evaluaciones: ${evaluations.length}`);
  console.log(`   - Cronograma: ${schedule.length} semanas`);
  
  // Validar que los pesos sumen ~100%
  const totalWeight = evaluations.reduce((sum, e) => sum + e.weight, 0);
  if (totalWeight > 0 && Math.abs(totalWeight - 100) > 5) {
    console.warn(`⚠️ Los pesos suman ${totalWeight}% (esperado: 100%)`);
  }
  
  return {
    evaluations,
    schedule,
    metadata,
  };
}

/**
 * Vincula evaluaciones con fechas del cronograma
 */
export function linkEvaluationsWithSchedule(parsed: ParsedSyllabus): SyllabusEvaluation[] {
  const { evaluations, schedule } = parsed;
  
  return evaluations.map(evaluation => {
    // Buscar en el cronograma si hay una evaluación con la misma abreviatura
    const scheduleItem = schedule.find(item => 
      item.evaluation === evaluation.abbreviation
    );
    
    if (scheduleItem) {
      return {
        ...evaluation,
        week: scheduleItem.week,
        date: scheduleItem.date,
      };
    }
    
    return evaluation;
  });
}
