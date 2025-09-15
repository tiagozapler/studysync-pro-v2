import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { Course } from '../types';
import {
  getCoursesFromSupabase,
  saveCourseToSupabase,
} from '../supabase/database';
import {
  saveCourseToIndexedDB,
  getCoursesFromIndexedDB,
} from '../db/indexeddb';
import { supabase } from '../supabase/client';

interface AppState {
  courses: Course[];
  addCourse: (
    course: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'user_id'>
  ) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      courses: [],

      // 🔹 Guardar curso (Supabase → fallback IndexedDB)
      addCourse: async courseData => {
        try {
          const user = (await supabase.auth.getUser()).data.user;
          if (!user) throw new Error('No hay usuario autenticado');

          const newCourse = await saveCourseToSupabase(courseData, user.id);

          set(state => ({
            courses: [newCourse, ...state.courses],
          }));
        } catch (err) {
          console.warn(
            '⚠️ No se pudo guardar en Supabase, usando IndexedDB...',
            err
          );

          const newCourse = await saveCourseToIndexedDB(courseData);

          set(state => ({
            courses: [newCourse, ...state.courses],
          }));
        }
      },

      // 🔹 Inicializar cursos (Supabase → fallback IndexedDB)
      initialize: async () => {
        try {
          const user = (await supabase.auth.getUser()).data.user;
          if (!user) throw new Error('No hay usuario autenticado');

          const courses = await getCoursesFromSupabase(user.id);
          set({ courses });
        } catch (err) {
          console.warn(
            '⚠️ No se pudo leer de Supabase, usando IndexedDB...',
            err
          );
          const courses = await getCoursesFromIndexedDB();
          set({ courses });
        }
      },
    })),
    { name: 'app-storage' }
  )
);

// API para acceso directo al store (sin hooks)
export const appStoreAPI = {
  getState: () => useAppStore.getState(),
  setState: (patch: any) => useAppStore.setState(patch),
  subscribe: (listener: any) => useAppStore.subscribe(listener),
};

// Exponer en window para DEV (seguros de usar import.meta.env.DEV)
if (typeof window !== 'undefined') {
  (window as any).useAppStore = useAppStore; // el hook / función
  (window as any).appStoreAPI = appStoreAPI; // API (getState, setState)
  (window as any).appStore = useAppStore; // alias
  (window as any).getAppState = () => useAppStore.getState();
}

// HMR: cuando Vite recargue, reasignar referencias
if ((import.meta as any).hot) {
  (import.meta as any).hot.accept(() => {
    (window as any).useAppStore = useAppStore;
    (window as any).appStoreAPI = appStoreAPI;
    (window as any).appStore = useAppStore;
    (window as any).getAppState = () => useAppStore.getState();
    console.log('HMR: re-expuesto useAppStore en window');
  });
}

