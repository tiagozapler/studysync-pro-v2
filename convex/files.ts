import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Crear un archivo
export const createFile = mutation({
  args: {
    courseId: v.id("courses"),
    name: v.string(),
    size: v.number(),
    type: v.string(),
    tags: v.array(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", args);
  },
});

// Obtener archivos por curso
export const getFilesByCourse = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

// Obtener archivos por usuario
export const getFilesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Guardar o actualizar texto de archivo
export const upsertFileText = mutation({
  args: {
    fileId: v.string(),
    courseId: v.string(),
    content: v.string(),
    userId: v.string(),
    extractedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("fileTexts")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        extractedAt: args.extractedAt,
      });
      return existing._id;
    }

    return await ctx.db.insert("fileTexts", args);
  },
});

// Obtener texto de un archivo específico
export const getFileTextByFile = query({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fileTexts")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .unique();
  },
});

// Obtener todos los textos de archivos de un curso
export const getFileTextsByCourse = query({
  args: {
    courseId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fileTexts")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .paginate(args.paginationOpts);
  },
});

// Eliminar archivo y sus textos relacionados
export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const fileTexts = await ctx.db
      .query("fileTexts")
      .withIndex("by_file", (q) => q.eq("fileId", args.id))
      .collect();

    const ragChunks = await ctx.db
      .query("ragChunks")
      .withIndex("by_file", (q) => q.eq("fileId", args.id))
      .collect();

    await Promise.all([
      ...fileTexts.map(text => ctx.db.delete(text._id)),
      ...ragChunks.map(chunk => ctx.db.delete(chunk._id)),
      ctx.db.delete(args.id),
    ]);
  },
});
