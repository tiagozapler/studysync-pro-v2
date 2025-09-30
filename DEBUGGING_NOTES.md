# 🐛 Notas de Debugging - Análisis de Archivos

## Problema Actual
El análisis de archivos con IA NO está funcionando correctamente después de múltiples intentos.

## Síntomas
- El usuario reporta que "sigue sin funcionar"
- Anteriormente vimos que Groq respondía con texto explicativo en lugar de solo JSON
- Implementamos extracción de JSON pero el problema persiste

## Intentos Realizados

### 1. Método de 4 Etapas
- ✅ Implementado proceso estructurado
- ❌ No resolvió el problema

### 2. Mejora del Prompt
- ✅ Simplificado y más directo
- ✅ Temperatura = 0
- ❌ Groq sigue respondiendo con texto explicativo

### 3. Extracción de JSON
- ✅ Busca primer `{` y último `}`
- ✅ Maneja markdown
- ❌ Aún no funciona

## Próximos Pasos a Investigar

### Opción 1: Probar con otro modelo de Groq
- Probar `llama-3.3-70b-versatile` o `mixtral-8x7b-32768`
- Algunos modelos respetan mejor las instrucciones de formato

### Opción 2: Usar un enfoque de 2 pasos
1. Primer prompt: Extraer evaluaciones en texto plano
2. Segundo prompt: Convertir a JSON

### Opción 3: Parseo más robusto
- Usar regex para extraer campos específicos
- No depender del JSON completo

### Opción 4: Análisis local sin IA
- Usar regex patterns para detectar:
  - Tabla de evaluación (buscar "Semana", "Tipo", "Peso")
  - Pesos (números seguidos de "%")
  - NO depender de IA para estructura

## Información del Usuario

### Necesidades Clave:
1. NO inventar notas (solo extraer si existen puntajes)
2. Detectar pesos correctamente de la tabla de evaluación
3. Escala 0-20 para calificaciones
4. Tabla editable de notas (pendiente)

### Formato de Sílabo del Usuario:
```
VII. Evaluación
N.º  Semana  Tipo de evaluación     Peso
1    5       Examen escrito 1       20
2    10      Examen escrito 2       25
3    13      Trabajo de Investigación  30
4    15      Examen escrito 3       25
```

## Archivos Clave
- `src/lib/ai/fileAnalyzer.ts` - Análisis con Groq
- `src/features/courses/components/MaterialsSection.tsx` - UI de subida
- `src/features/courses/components/GradesSection.tsx` - Calculadora

## Estado de las Funcionalidades

### ✅ Funcionando:
- Chat con IA (Groq)
- Persistencia de mensajes
- Calculadora de notas (escala 0-20)
- Promedio ponderado
- Proyección "qué necesitas para aprobar"

### ❌ NO Funcionando:
- Análisis automático de archivos
- Detección de evaluaciones del sílabo
- Extracción de pesos

### ⏸️ Pendiente:
- Tabla editable de notas
- Vista de calendario mejorada

## Última Versión Desplegada
https://studysync-pro-v2-au2cpmban-tzs-projects-b0f29678.vercel.app

## Recomendación
Necesitamos ver los logs exactos de la consola para entender por qué sigue fallando.
El usuario debe compartir lo que aparece en la consola después de subir el archivo.
