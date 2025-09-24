import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 🔹 Crear un nuevo curso
export const createCourse = mutation({
  args: {
    name: v.string(),
    teacher: v.optional(v.string()),
    credits: v.optional(v.number()),
    semester: v.optional(v.string()),
    color: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("courses", {
      ...args,
      archived: false,
    });
  },
});

// 🔹 Obtener cursos del usuario
export const getCoursesByUser = query({
  args: {
    userId: v.string(),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("courses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));
    
    if (!args.includeArchived) {
      query = query.filter((q) => q.eq(q.field("archived"), false));
    }
    
    return await query.collect();
  },
});

// 🔹 Actualizar un curso
export const updateCourse = mutation({
  args: {
    id: v.id("courses"),
    name: v.optional(v.string()),
    teacher: v.optional(v.string()),
    credits: v.optional(v.number()),
    semester: v.optional(v.string()),
    color: v.optional(v.string()),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

// 🔹 Eliminar un curso
export const deleteCourse = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// 🔹 Archivar/desarchivar curso
export const toggleArchiveCourse = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) throw new Error("Curso no encontrado");
    
    return await ctx.db.patch(args.id, {
      archived: !course.archived,
    });
  },
});
