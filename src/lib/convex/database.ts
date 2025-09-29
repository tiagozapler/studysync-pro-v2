import { convex, convexHttp } from './client';
import { api, type Doc } from './api';
import type { Course } from '../types';

export const fileTextsApi = {
  upsert: api.files.upsertFileText,
  byFile: api.files.getFileTextByFile,
  byCourse: api.files.getFileTextsByCourse,
};

export { convex, convexHttp, api };

export type FileTextDoc = Doc<'fileTexts'>;

export async function getCourseFileTexts(
  courseId: string,
  { numItems = 50 }: { numItems?: number } = {}
): Promise<FileTextDoc[]> {
  const results: FileTextDoc[] = [];
  let cursor: string | null = null;

  try {
    while (true) {
      const { page, isDone, continueCursor } = await convexHttp.query(
        fileTextsApi.byCourse,
        {
          courseId,
          paginationOpts: {
            numItems,
            cursor,
          },
        }
      );

      results.push(...page);

      if (isDone) {
        break;
      }

      cursor = continueCursor ?? null;
    }
  } catch (error) {
    console.error('Error fetching course file texts from Convex:', error);
  }

  return results;
}

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
