import Dexie, { Table } from 'dexie'

// Interfaces para los tipos de datos
export interface Course {
  id: string
  name: string
  color: string
  teacher?: string
  credits?: number
  semester?: string
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FileRecord {
  id: string
  courseId: string
  name: string
  type: 'file' | 'folder'
  size?: number
  tags: string[]
  parentId?: string
  fileUrl?: string
  mimeType?: string
  createdAt: Date
  updatedAt: Date
  blob?: Blob
}

export interface FileText {
  fileId: string
  courseId: string
  text: string
  extractedAt: Date
}

export interface RAGChunk {
  id: string
  fileId: string
  courseId: string
  chunkId: string
  text: string
  embedding?: number[]
  metadata: {
    page?: number
    tag?: string
    startChar: number
    endChar: number
  }
  createdAt: Date
}

export interface Note {
  id: string
  courseId: string
  type:
    | 'parcial'
    | 'final'
    | 'practica'
    | 'tarea'
    | 'proyecto'
    | 'participacion'
  description: string
  value: number // 0-20
  weight: number // porcentaje
  date: Date
  observations?: string
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  courseId?: string // null para eventos globales
  title: string
  type: 'examen' | 'entrega' | 'clase' | 'otro'
  date: Date
  time?: string
  duration?: number // minutos
  fileId?: string // archivo relacionado
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Todo {
  id: string
  courseId: string
  title: string
  description?: string
  dueDate?: Date
  priority: 'baja' | 'media' | 'alta'
  done: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface QuickNote {
  id: string
  title: string
  content: string
  category: 'general' | 'estudio' | 'recordatorio' | 'idea'
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  courseId: string
  content: string
  role: 'user' | 'assistant'
  attachedFiles: string[] // fileIds
  metadata?: {
    model?: string
    tokens?: number
    timestamp: Date
  }
  createdAt: Date
}

// Clase de la base de datos
export class StudySyncDB extends Dexie {
  // Tablas
  courses!: Table<Course>
  files!: Table<FileRecord>
  fileTexts!: Table<FileText>
  ragChunks!: Table<RAGChunk>
  notes!: Table<Note>
  events!: Table<Event>
  todos!: Table<Todo>
  quickNotes!: Table<QuickNote>
  chatMessages!: Table<ChatMessage>

  constructor() {
    super('StudySyncDB')

    // Definición del esquema
    this.version(1).stores({
      courses: 'id, name, color, archived, createdAt',
      files: 'id, courseId, name, type, tags, createdAt',
      fileTexts: 'fileId, courseId, extractedAt',
      ragChunks: 'id, fileId, courseId, chunkId, createdAt',
      notes: 'id, courseId, type, value, date, createdAt',
      events: 'id, courseId, title, type, date, createdAt',
      todos: 'id, courseId, title, dueDate, priority, done, createdAt',
      quickNotes: 'id, title, category, createdAt',
      chatMessages: 'id, courseId, role, createdAt',
    })

    // Hooks para auto-timestamps
    this.courses.hook('creating', function (_primKey, obj, _trans) {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })

    this.courses.hook('updating', function (modifications: any) {
      modifications.updatedAt = new Date()
    })

    this.files.hook('creating', function (_primKey, obj, _trans) {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })

    this.files.hook('updating', function (modifications: any) {
      modifications.updatedAt = new Date()
    })

    this.notes.hook('creating', function (_primKey, obj, _trans) {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })

    this.notes.hook('updating', function (modifications: any) {
      modifications.updatedAt = new Date()
    })

    this.events.hook('creating', function (_primKey, obj, _trans) {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })

    this.events.hook('updating', function (modifications: any) {
      modifications.updatedAt = new Date()
    })

    this.todos.hook('creating', function (_primKey, obj, _trans) {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })

    this.todos.hook('updating', function (modifications: any) {
      modifications.updatedAt = new Date()
    })

    this.quickNotes.hook('creating', function (_primKey, obj, _trans) {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })

    this.quickNotes.hook('updating', function (modifications: any) {
      modifications.updatedAt = new Date()
    })

    this.chatMessages.hook('creating', function (_primKey, obj, _trans) {
      obj.createdAt = new Date()
    })
  }
}

// Instancia singleton de la base de datos
export const db = new StudySyncDB()

// Funciones de utilidad para la base de datos
export const dbUtils = {
  // Conectar IA real aquí - función para limpiar base de datos
  async clearAllData() {
    await db.transaction(
      'rw',
      [
        db.courses,
        db.files,
        db.fileTexts,
        db.ragChunks,
        db.notes,
        db.events,
        db.todos,
        db.quickNotes,
        db.chatMessages,
      ],
      async () => {
        await db.courses.clear()
        await db.files.clear()
        await db.fileTexts.clear()
        await db.ragChunks.clear()
        await db.notes.clear()
        await db.events.clear()
        await db.todos.clear()
        await db.quickNotes.clear()
        await db.chatMessages.clear()
      }
    )
  },

  // Conectar IA real aquí - función para exportar datos
  async exportData() {
    const data = {
      courses: await db.courses.toArray(),
      notes: await db.notes.toArray(),
      events: await db.events.toArray(),
      todos: await db.todos.toArray(),
      quickNotes: await db.quickNotes.toArray(),
      // No incluimos archivos binarios ni embeddings por tamaño
      exportedAt: new Date(),
      version: '1.0',
    }

    return data
  },

  // Conectar IA real aquí - función para importar datos
  async importData(data: any) {
    await db.transaction(
      'rw',
      [db.courses, db.notes, db.events, db.todos, db.quickNotes],
      async () => {
        if (data.courses) {
          await db.courses.bulkPut(data.courses)
        }
        if (data.notes) {
          await db.notes.bulkPut(data.notes)
        }
        if (data.events) {
          await db.events.bulkPut(data.events)
        }
        if (data.todos) {
          await db.todos.bulkPut(data.todos)
        }
        if (data.quickNotes) {
          await db.quickNotes.bulkPut(data.quickNotes)
        }
      }
    )
  },

  // Estadísticas rápidas
  async getStats() {
    const [coursesCount, filesCount, notesCount, eventsCount, todosCount] =
      await Promise.all([
        db.courses.where('archived').equals(0).count(),
        db.files.count(),
        db.notes.count(),
        db.events.count(),
        db.todos.where('done').equals(0).count(),
      ])

    return {
      coursesCount,
      filesCount,
      notesCount,
      eventsCount,
      pendingTodosCount: todosCount,
    }
  },
}

// Persistencia aquí - inicializar base de datos
export async function initDatabase() {
  try {
    await db.open()
    console.log('✅ Base de datos IndexedDB inicializada correctamente')
    return true
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error)
    return false
  }
}
