# 📋 Próximos Pasos - Parser sin IA

## 🎯 Objetivo
Crear un parser basado en regex para extraer evaluaciones del sílabo **sin depender de IA**.

## ✅ Estado Actual

### Funcionando:
- ✅ Chat con IA (Groq)
- ✅ Persistencia de chat en IndexedDB
- ✅ Calculadora de notas (escala 0-20)
- ✅ Promedio ponderado correcto
- ✅ Proyección "qué necesitas para aprobar"
- ✅ Subida de archivos y extracción de texto PDF

### NO Funcionando:
- ❌ Análisis automático de sílabos (Groq inventa datos)

## 🔧 Solución a Implementar

### Parser basado en Regex

**Archivo a crear/modificar:** `src/lib/files/syllabusParser.ts`

**Patrón a detectar:**
```
VII. Evaluación
N.º  Semana  Tipo de evaluación     Peso
1    5       Examen escrito 1       20
2    10      Examen escrito 2       25
3    13      Trabajo de Investigación  30
4    15      Examen escrito 3       25
```

**Estrategia:**

1. **Buscar sección de Evaluación:**
   - Regex: `/VII\.\s*Evaluaci[oó]n/i`
   - O variantes: `Evaluación`, `Sistema de Evaluación`, etc.

2. **Detectar inicio de tabla:**
   - Buscar encabezados: "N.º", "Semana", "Tipo", "Peso"
   - Regex: `/N\.?\s*º.*Semana.*Tipo.*Peso/i`

3. **Extraer filas de la tabla:**
   - Regex por línea: `/(\d+)\s+(\d+)\s+([^0-9]+?)\s+(\d+)/`
   - Grupos: N.º, Semana, Tipo de evaluación, Peso

4. **Mapear tipos:**
   - "Examen escrito" → type: "exam"
   - "Trabajo" → type: "project"
   - "Práctica" → type: "homework"

5. **Validar:**
   - Pesos suman ~100%
   - Semanas en orden lógico (1-16)

**Ventajas:**
- ✅ No inventa datos
- ✅ Más rápido
- ✅ Sin costos de API
- ✅ 100% predecible

**Desventajas:**
- ⚠️ Menos flexible con formatos muy diferentes
- ⚠️ Necesita actualizarse si cambia formato de sílabos

## 📝 Código Ejemplo

```typescript
export interface SyllabusEvaluation {
  number: number;
  week: number;
  name: string;
  weight: number;
  type: 'exam' | 'project' | 'homework' | 'other';
}

export function parseSyllabusEvaluations(content: string): SyllabusEvaluation[] {
  // 1. Encontrar sección de Evaluación
  const evalSectionMatch = content.match(/VII\.\s*Evaluaci[oó]n([\s\S]*?)(?:VIII\.|$)/i);
  if (!evalSectionMatch) return [];
  
  const evalSection = evalSectionMatch[1];
  
  // 2. Encontrar tabla
  const tableMatch = evalSection.match(/N\.?\s*º.*Semana.*Tipo.*Peso([\s\S]*?)(?:\n\n|$)/i);
  if (!tableMatch) return [];
  
  const tableContent = tableMatch[1];
  
  // 3. Extraer filas
  const rows = tableContent.split('\n').filter(line => line.trim());
  const evaluations: SyllabusEvaluation[] = [];
  
  for (const row of rows) {
    const match = row.match(/(\d+)\s+(\d+)\s+([^0-9]+?)\s+(\d+)/);
    if (match) {
      evaluations.push({
        number: parseInt(match[1]),
        week: parseInt(match[2]),
        name: match[3].trim(),
        weight: parseInt(match[4]),
        type: detectType(match[3]),
      });
    }
  }
  
  return evaluations;
}
```

## 🔄 Integración

1. Llamar `parseSyllabusEvaluations()` en lugar de Groq
2. Mostrar resultados en UI
3. Permitir al usuario editar/confirmar
4. Guardar en Convex

## 📊 Última Versión Desplegada

https://studysync-pro-v2-cgi8qp2vj-tzs-projects-b0f29678.vercel.app

## 🎯 Cuando Regreses

1. Implementar `syllabusParser.ts`
2. Integrar con `MaterialsSection.tsx`
3. Probar con tus sílabos reales
4. Ajustar regex según sea necesario
5. Desplegar versión final

---

**Nota:** El parser será más confiable que la IA para este caso de uso específico.
