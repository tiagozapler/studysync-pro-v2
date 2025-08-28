// Constantes de la aplicación

export const APP_INFO = {
  name: 'StudySync Pro',
  version: '2.0.0',
  description: 'Asistente académico profesional con IA local',
  author: 'StudySync Team',
  repository: 'https://github.com/studysync/studysync-pro',
} as const;

export const STORAGE_KEYS = {
  // IndexedDB
  DB_NAME: 'StudySyncDB',
  DB_VERSION: 1,

  // localStorage
  SETTINGS: 'studysync_settings',
  PREFERENCES: 'studysync_preferences',
  CACHE: 'studysync_cache',
  BACKUP: 'studysync_backup',
  DEMO_LOADED: 'studysync_demo_loaded',
  ONBOARDING: 'studysync_onboarding',
} as const;

export const API_ENDPOINTS = {
  // Para futura integración con IA externa (opcional)
  OLLAMA_LOCAL: 'http://localhost:11434',
  WEBLLM_MODELS: 'https://huggingface.co/mlc-ai',
} as const;

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_COURSE: 100,
  SUPPORTED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  PDF_TYPES: ['application/pdf'],
  DOCUMENT_TYPES: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
  ],
} as const;

export const GRADE_SCALES = {
  PERUVIAN: {
    min: 0,
    max: 20,
    passing: 11,
    name: 'Vigesimal (0-20)',
  },
  PERCENTAGE: {
    min: 0,
    max: 100,
    passing: 60,
    name: 'Porcentual (0-100)',
  },
} as const;

export const COURSE_COLORS = [
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#EF4444', // Rojo
  '#FACC15', // Amarillo
  '#8B5CF6', // Púrpura
  '#EC4899', // Rosa
  '#F97316', // Naranja
  '#06B6D4', // Cian
  '#84CC16', // Lima
  '#F59E0B', // Ámbar
] as const;

export const EVENT_TYPES = {
  EXAM: 'examen',
  ASSIGNMENT: 'entrega',
  CLASS: 'clase',
  OTHER: 'otro',
} as const;

export const NOTE_TYPES = {
  PARTIAL: 'parcial',
  FINAL: 'final',
  PRACTICE: 'practica',
  HOMEWORK: 'tarea',
  PROJECT: 'proyecto',
  PARTICIPATION: 'participacion',
} as const;

export const TODO_PRIORITIES = {
  LOW: 'baja',
  MEDIUM: 'media',
  HIGH: 'alta',
} as const;

export const QUICK_NOTE_CATEGORIES = {
  GENERAL: 'general',
  STUDY: 'estudio',
  REMINDER: 'recordatorio',
  IDEA: 'idea',
} as const;

export const AI_ADAPTERS = {
  MOCK: 'mock',
  WEBLLM: 'webllm',
  OLLAMA: 'ollama',
} as const;

export const KEYBOARD_SHORTCUTS = {
  // Navegación
  OPEN_COMMAND_PALETTE: 'ctrl+k',
  GO_TO_DASHBOARD: 'ctrl+1',
  GO_TO_CALENDAR: 'ctrl+2',
  GO_TO_NOTES: 'ctrl+3',
  GO_TO_SEARCH: 'ctrl+/',

  // Acciones
  NEW_COURSE: 'ctrl+shift+c',
  NEW_TODO: 'ctrl+shift+t',
  NEW_EVENT: 'ctrl+shift+e',
  NEW_NOTE: 'ctrl+shift+n',
  UPLOAD_FILE: 'ctrl+u',

  // Focus mode
  START_POMODORO: 'space',
  MARK_TODO_DONE: 'm',
  QUICK_NOTE: 'n',

  // Accesibilidad
  SKIP_TO_CONTENT: 'ctrl+alt+s',
  FOCUS_SEARCH: 'ctrl+alt+f',
} as const;

export const POMODORO_DEFAULTS = {
  WORK_TIME: 25, // minutos
  SHORT_BREAK: 5,
  LONG_BREAK: 15,
  LONG_BREAK_INTERVAL: 4, // cada 4 pomodoros
} as const;

export const RAG_CONFIG = {
  CHUNK_SIZE: 800, // tokens
  CHUNK_OVERLAP: 200,
  MAX_CHUNKS_PER_QUERY: 5,
  SIMILARITY_THRESHOLD: 0.7,
  EMBEDDING_MODEL: 'all-MiniLM-L6-v2',
} as const;

export const WEBLLM_MODELS = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    name: 'Llama 3.2 1B (Cuantizado)',
    size: '0.9 GB',
    description: 'Modelo ligero, rápido pero menos preciso',
    recommended: true,
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
    name: 'Llama 3.2 3B (Cuantizado)',
    size: '2.2 GB',
    description: 'Equilibrio entre velocidad y calidad',
    recommended: false,
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f32_1-MLC',
    name: 'Phi 3.5 Mini (Cuantizado)',
    size: '2.4 GB',
    description: 'Modelo de Microsoft, bueno para tareas académicas',
    recommended: false,
  },
] as const;

export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenido a StudySync Pro',
    description: 'Tu asistente académico profesional con IA local',
  },
  {
    id: 'courses',
    title: 'Gestiona tus cursos',
    description: 'Agrega, organiza y personaliza tus cursos universitarios',
  },
  {
    id: 'files',
    title: 'Sube tus materiales',
    description: 'Archivos PDF, PPTs, lecturas - todo almacenado localmente',
  },
  {
    id: 'ai',
    title: 'Chat con IA (opcional)',
    description: 'Haz preguntas sobre tus materiales con IA gratuita',
  },
  {
    id: 'notes',
    title: 'Controla tus notas',
    description: 'Calcula promedios y simula escenarios',
  },
  {
    id: 'calendar',
    title: 'Planifica tu semestre',
    description: 'Eventos, recordatorios y cronogramas',
  },
] as const;

export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 50,
  DEBOUNCE_DELAY: 300, // ms
  HIGHLIGHT_CLASS: 'bg-yellow-200 dark:bg-yellow-800',
} as const;

export const PWA_CONFIG = {
  CACHE_VERSION: 'v1',
  CACHE_NAMES: {
    STATIC: 'studysync-static-v1',
    DYNAMIC: 'studysync-dynamic-v1',
    IMAGES: 'studysync-images-v1',
  },
  OFFLINE_URL: '/offline.html',
} as const;

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export const ACCESSIBILITY = {
  SKIP_LINK_TARGET: 'main-content',
  FOCUS_TRAP_SELECTORS: [
    'button',
    '[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
  ].join(','),
  REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
  HIGH_CONTRAST_QUERY: '(prefers-contrast: high)',
} as const;

export default {
  APP_INFO,
  STORAGE_KEYS,
  API_ENDPOINTS,
  FILE_LIMITS,
  GRADE_SCALES,
  COURSE_COLORS,
  EVENT_TYPES,
  NOTE_TYPES,
  TODO_PRIORITIES,
  QUICK_NOTE_CATEGORIES,
  AI_ADAPTERS,
  KEYBOARD_SHORTCUTS,
  POMODORO_DEFAULTS,
  RAG_CONFIG,
  WEBLLM_MODELS,
  ONBOARDING_STEPS,
  SEARCH_CONFIG,
  PWA_CONFIG,
  NOTIFICATION_TYPES,
  ACCESSIBILITY,
};
