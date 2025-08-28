import { createClient } from '@supabase/supabase-js';
import { env, validateEnv } from '../config/env';

// Validar variables de entorno
validateEnv();

// Configuración de Supabase desde variables de entorno
const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Exportar globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

// Log de configuración (solo en desarrollo)
if (env.IS_DEVELOPMENT) {
  console.log('🔧 Configuración Supabase:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
  });
}

// Tipos de base de datos
export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          name: string;
          teacher: string;
          credits: number;
          semester: string;
          color: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          teacher: string;
          credits: number;
          semester: string;
          color: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          teacher?: string;
          credits?: number;
          semester?: string;
          color?: string;
          updated_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          name: string;
          type: string;
          size: number;
          content: string;
          course_id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          size: number;
          content: string;
          course_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          size?: number;
          content?: string;
          updated_at?: string;
        };
      };
      grades: {
        Row: {
          id: string;
          name: string;
          score: number;
          max_score: number;
          weight: number;
          type: string;
          course_id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          score: number;
          max_score: number;
          weight: number;
          type: string;
          course_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          score?: number;
          max_score?: number;
          weight?: number;
          type?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          date: string;
          time: string;
          type: string;
          priority: string;
          course_id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          date: string;
          time: string;
          type: string;
          priority: string;
          course_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          date?: string;
          time?: string;
          type?: string;
          priority?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          title: string;
          content: string;
          course_id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          course_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Tipos exportados
export type Course = Database['public']['Tables']['courses']['Row'];
export type FileRecord = Database['public']['Tables']['files']['Row'];
export type Grade = Database['public']['Tables']['grades']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type Note = Database['public']['Tables']['notes']['Row'];
