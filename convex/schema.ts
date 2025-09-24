import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Cursos
  courses: defineTable({
    name: v.string(),
    teacher: v.optional(v.string()),
    credits: v.optional(v.number()),
    semester: v.optional(v.string()),
    color: v.string(),
    archived: v.boolean(),
    userId: v.string(),
  })
  .index("by_user", ["userId"])
  .index("by_user_archived", ["userId", "archived"]),

  // Archivos
  files: defineTable({
    courseId: v.id("courses"),
    name: v.string(),
    size: v.number(),
    type: v.string(),
    tags: v.array(v.string()),
    userId: v.string(),
  })
  .index("by_course", ["courseId"])
  .index("by_user", ["userId"]),

  // Texto extraído de archivos
  fileTexts: defineTable({
    fileId: v.id("files"),
    courseId: v.id("courses"),
    content: v.string(),
    userId: v.string(),
  })
  .index("by_file", ["fileId"])
  .index("by_course", ["courseId"]),

  // Chunks RAG para IA
  ragChunks: defineTable({
    fileId: v.id("files"),
    courseId: v.id("courses"),
    chunkId: v.string(),
    content: v.string(),
    embedding: v.optional(v.array(v.number())),
    position: v.object({
      startChar: v.number(),
      endChar: v.number(),
    }),
    userId: v.string(),
  })
  .index("by_file", ["fileId"])
  .index("by_course", ["courseId"]),

  // Notas/Calificaciones
  notes: defineTable({
    courseId: v.id("courses"),
    type: v.union(
      v.literal("parcial"),
      v.literal("final"),
      v.literal("practica"),
      v.literal("tarea"),
      v.literal("proyecto"),
      v.literal("participacion")
    ),
    description: v.string(),
    value: v.number(),
    maxValue: v.number(),
    date: v.string(),
    userId: v.string(),
  })
  .index("by_course", ["courseId"])
  .index("by_user", ["userId"]),

  // Eventos de calendario
  events: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("clase"),
      v.literal("examen"),
      v.literal("entrega"),
      v.literal("evento")
    ),
    date: v.string(),
    userId: v.string(),
  })
  .index("by_course", ["courseId"])
  .index("by_user", ["userId"])
  .index("by_date", ["date"]),

  // Tareas/TODOs
  todos: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    done: v.boolean(),
    userId: v.string(),
  })
  .index("by_course", ["courseId"])
  .index("by_user", ["userId"])
  .index("by_due_date", ["dueDate"]),

  // Notas rápidas
  quickNotes: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
    userId: v.string(),
  })
  .index("by_user", ["userId"]),

  // Mensajes de chat IA
  chatMessages: defineTable({
    courseId: v.optional(v.id("courses")),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    attachedFiles: v.array(v.id("files")),
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
    })),
    userId: v.string(),
  })
  .index("by_course", ["courseId"])
  .index("by_user", ["userId"]),
});
