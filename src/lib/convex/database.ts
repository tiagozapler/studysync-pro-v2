import { convex } from './client';
// import api from '../../../convex/_generated/api';
import type { Course } from '../types';

// Temporary fix for API types
const api = {
  courses: {
    createCourse: 'courses:createCourse' as any,
    getCoursesByUser: 'courses:getCoursesByUser' as any,
    updateCourse: 'courses:updateCourse' as any,
    deleteCourse: 'courses:deleteCourse' as any,
  }
};

// 🔹 Guardar un curso en Convex
export async function saveCourseToConvex(
  course: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'archived'>,
  userId: string
) {
  try {
    const courseId = await convex.mutation(api.courses.createCourse as any, {
      name: course.name,
      teacher: course.teacher,
      credits: course.credits,
      semester: course.semester,
      color: course.color,
      userId: userId,
    });

    return {
      id: courseId,
      ...course,
      archived: false,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Course;
  } catch (error) {
    console.error('❌ Error insertando curso en Convex:', error);
    throw error;
  }
}

// 🔹 Obtener cursos del usuario desde Convex
export async function getCoursesFromConvex(userId: string): Promise<Course[]> {
  try {
    const courses = await convex.query(api.courses.getCoursesByUser as any, {
      userId: userId,
      includeArchived: false,
    });

    // Convertir formato de Convex a formato de la app
    return courses.map((course) => ({
      id: course._id,
      name: course.name,
      teacher: course.teacher || '',
      credits: course.credits || 0,
      semester: course.semester || '',
      color: course.color,
      archived: course.archived,
      user_id: course.userId,
      created_at: course._creationTime ? new Date(course._creationTime).toISOString() : new Date().toISOString(),
      updated_at: course._creationTime ? new Date(course._creationTime).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('❌ Error leyendo cursos de Convex:', error);
    throw error;
  }
}

// 🔹 Actualizar curso en Convex
export async function updateCourseInConvex(
  courseId: string,
  updates: Partial<Course>
) {
  try {
    await convex.mutation(api.courses.updateCourse as any, {
      id: courseId as any,
      name: updates.name,
      teacher: updates.teacher,
      credits: updates.credits,
      semester: updates.semester,
      color: updates.color,
      archived: updates.archived,
    });
  } catch (error) {
    console.error('❌ Error actualizando curso en Convex:', error);
    throw error;
  }
}

// 🔹 Eliminar curso de Convex
export async function deleteCourseFromConvex(courseId: string) {
  try {
    await convex.mutation(api.courses.deleteCourse as any, {
      id: courseId as any,
    });
  } catch (error) {
    console.error('❌ Error eliminando curso de Convex:', error);
    throw error;
  }
}
