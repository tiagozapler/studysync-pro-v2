import { supabase } from './client';
import { Course } from '../types';

// 🔹 Guardar un curso en Supabase
export async function saveCourseToSupabase(
  course: Omit<
    Course,
    'id' | 'created_at' | 'updated_at' | 'user_id' | 'archived'
  >,
  userId: string
) {
  const { data, error } = await supabase
    .from('courses')
    .insert([
      {
        name: course.name,
        teacher: course.teacher,
        credits: course.credits,
        semester: course.semester,
        color: course.color,
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('❌ Error insertando curso en Supabase:', error.message);
    throw error;
  }

  return data as Course;
}

// 🔹 Obtener cursos del usuario desde Supabase
export async function getCoursesFromSupabase(userId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error leyendo cursos de Supabase:', error.message);
    throw error;
  }

  return data as Course[];
}
