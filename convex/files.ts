import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 🔹 Crear registro de archivo
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

// 🔹 Obtener archivos por curso
export const getFilesByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

// 🔹 Obtener archivos del usuario
export const getFilesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// 🔹 Eliminar archivo
export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    // También eliminar texto y chunks relacionados
    const fileTexts = await ctx.db
      .query("fileTexts")
      .withIndex("by_file", (q) => q.eq("fileId", args.id))
      .collect();
    
    const ragChunks = await ctx.db
      .query("ragChunks")
      .withIndex("by_file", (q) => q.eq("fileId", args.id))
      .collect();
    
    // Eliminar en paralelo
    await Promise.all([
      ...fileTexts.map(text => ctx.db.delete(text._id)),
      ...ragChunks.map(chunk => ctx.db.delete(chunk._id)),
      ctx.db.delete(args.id)
    ]);
  },
});
