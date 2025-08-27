import { supabase } from './config';
import { authService } from './auth';
import type { Course, FileRecord, Grade, Event, Note } from './config';

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // ===== CURSOS =====
  async getCourses(): Promise<Course[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo cursos:', error);
      return [];
    }
  }

  async createCourse(courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('courses')
        .insert([{ ...courseData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creando curso:', error);
      return null;
    }
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('courses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error actualizando curso:', error);
      return null;
    }
  }

  async deleteCourse(id: string): Promise<boolean> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error eliminando curso:', error);
      return false;
    }
  }

  // ===== ARCHIVOS =====
  async getFiles(courseId: string): Promise<FileRecord[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo archivos:', error);
      return [];
    }
  }

  async createFile(fileData: Omit<FileRecord, 'id' | 'created_at' | 'updated_at'>): Promise<FileRecord | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('files')
        .insert([{ ...fileData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creando archivo:', error);
      return null;
    }
  }

  async deleteFile(id: string): Promise<boolean> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      return false;
    }
  }

  // ===== CALIFICACIONES =====
  async getGrades(courseId: string): Promise<Grade[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo calificaciones:', error);
      return [];
    }
  }

  async createGrade(gradeData: Omit<Grade, 'id' | 'created_at' | 'updated_at'>): Promise<Grade | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('grades')
        .insert([{ ...gradeData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creando calificación:', error);
      return null;
    }
  }

  async updateGrade(id: string, updates: Partial<Grade>): Promise<Grade | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('grades')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error actualizando calificación:', error);
      return null;
    }
  }

  async deleteGrade(id: string): Promise<boolean> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error eliminando calificación:', error);
      return false;
    }
  }

  // ===== EVENTOS =====
  async getEvents(courseId: string): Promise<Event[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo eventos:', error);
      return [];
    }
  }

  async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('events')
        .insert([{ ...eventData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creando evento:', error);
      return null;
    }
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error actualizando evento:', error);
      return null;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error eliminando evento:', error);
      return false;
    }
  }

  // ===== NOTAS =====
  async getNotes(courseId: string): Promise<Note[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo notas:', error);
      return [];
    }
  }

  async createNote(noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('notes')
        .insert([{ ...noteData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creando nota:', error);
      return null;
    }
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error actualizando nota:', error);
      return null;
    }
  }

  async deleteNote(id: string): Promise<boolean> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error eliminando nota:', error);
      return false;
    }
  }

  // ===== SINCRONIZACIÓN =====
  async syncData(): Promise<boolean> {
    try {
      // Sincronizar todos los datos del usuario
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Aquí podrías implementar lógica de sincronización más compleja
      // Por ahora, solo verificamos la conexión
      const { error } = await supabase.from('courses').select('count').limit(1);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error en sincronización:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const databaseService = DatabaseService.getInstance();
