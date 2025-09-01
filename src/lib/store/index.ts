import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import {
  db,
  initDatabase,
  type FileRecord,
  type Note,
  type Event,
  type Todo,
  type QuickNote,
} from '../db/database';
import { type Course } from '../types';
import {
  storage,
  type AppSettings,
  type UserPreferences,
} from '../storage/localStorage';
import { idUtils } from '../utils';
import { supabase } from '../supabase/config';
import { env } from '../config/env';
import {
  getCoursesFromSupabase,
  saveCourseToSupabase,
} from '../supabase/database';
import {
  saveCourseToIndexedDB,
  getCoursesFromIndexedDB,
} from '../db/indexeddb';

// Tipos para el estado global
interface AppState {
  // Estado de la aplicación
  isLoading: boolean;
  isInitialized: boolean;
  currentView: string;
  currentCourse: Course | null;

  // Datos principales
  courses: Course[];
  files: Record<string, FileRecord[]>; // Por courseId
  notes: Record<string, Note[]>; // Por courseId
  events: Event[];
  todos: Record<string, Todo[]>; // Por courseId
  quickNotes: QuickNote[];
  grades: Record<string, any[]>; // Por courseId
  courseEvents: Record<string, any[]>; // Por courseId

  // Configuración
  settings: AppSettings;
  preferences: UserPreferences;

  // UI
  modals: {
    courseModal: boolean;
    fileModal: boolean;
    noteModal: boolean;
    eventModal: boolean;
    todoModal: boolean;
    quickNoteModal: boolean;
    settingsModal: boolean;
    commandPalette: boolean;
    onboarding: boolean;
  };

  // Búsqueda
  searchQuery: string;
  searchResults: any[];

  // Focus mode
  focusMode: {
    active: boolean;
    currentTodo: Todo | null;
    pomodoroTime: number;
    pomodoroActive: boolean;
    sessions: number;
  };
}

// Acciones del store
interface AppActions {
  // Inicialización
  initialize: () => Promise<void>;
  initializeRobust: () => Promise<void>;

  // Verificar Supabase
  checkSupabaseConnection: () => Promise<boolean>;

  // Cambiar base de datos
  switchToSupabase: () => Promise<void>;
  switchToIndexedDB: () => Promise<void>;

  // Cursos
  addCourse: (
    courseData: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'user_id'>
  ) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  archiveCourse: (id: string) => Promise<void>;
  setCurrentCourse: (course: Course | null) => void;

  // Archivos
  addFile: (courseId: string, file: File, tags: string[]) => Promise<void>;
  deleteFile: (courseId: string, fileId: string) => Promise<void>;
  updateFileTags: (
    courseId: string,
    fileId: string,
    tags: string[]
  ) => Promise<void>;

  // Materiales del curso
  addCourseMaterial: (
    courseId: string,
    material: {
      name: string;
      type: 'file' | 'folder';
      size?: number;
      tags: string[];
      parentId?: string;
      fileUrl?: string;
      mimeType?: string;
    }
  ) => Promise<void>;
  updateCourseMaterial: (
    courseId: string,
    materialId: string,
    updates: {
      name?: string;
      tags?: string[];
      parentId?: string;
    }
  ) => Promise<void>;
  deleteCourseMaterial: (courseId: string, materialId: string) => Promise<void>;
  moveCourseMaterial: (
    courseId: string,
    materialId: string,
    newParentId?: string
  ) => Promise<void>;

  // Notas del curso
  addCourseGrade: (
    courseId: string,
    grade: {
      name: string;
      type:
        | 'exam'
        | 'quiz'
        | 'project'
        | 'homework'
        | 'participation'
        | 'other';
      weight: number;
      score: number;
      maxScore: number;
      notes?: string;
    }
  ) => Promise<void>;
  updateCourseGrade: (
    courseId: string,
    gradeId: string,
    updates: {
      name?: string;
      type?:
        | 'exam'
        | 'quiz'
        | 'project'
        | 'homework'
        | 'participation'
        | 'other';
      weight?: number;
      score?: number;
      maxScore?: number;
      notes?: string;
    }
  ) => Promise<void>;
  deleteCourseGrade: (courseId: string, gradeId: string) => Promise<void>;

  // Eventos del calendario del curso
  addCourseEvent: (
    courseId: string,
    event: {
      title: string;
      description?: string;
      date: Date;
      time?: string;
      location?: string;
      type: 'exam' | 'assignment' | 'class' | 'meeting' | 'other';
      priority: 'low' | 'medium' | 'high';
      source: 'manual' | 'auto-detected';
      sourceFile?: string;
    }
  ) => Promise<void>;
  updateCourseEvent: (
    courseId: string,
    eventId: string,
    updates: {
      title?: string;
      description?: string;
      date?: Date;
      time?: string;
      location?: string;
      type?: 'exam' | 'assignment' | 'class' | 'meeting' | 'other';
      priority?: 'low' | 'medium' | 'high';
    }
  ) => Promise<void>;
  deleteCourseEvent: (courseId: string, eventId: string) => Promise<void>;

  // Notas
  addNote: (
    courseId: string,
    noteData: Omit<Note, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateNote: (
    courseId: string,
    noteId: string,
    updates: Partial<Note>
  ) => Promise<void>;
  deleteNote: (courseId: string, noteId: string) => Promise<void>;

  // Eventos
  addEvent: (
    eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;

  // Todos
  addTodo: (
    courseId: string,
    todoData: Omit<Todo, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateTodo: (
    courseId: string,
    todoId: string,
    updates: Partial<Todo>
  ) => Promise<void>;
  deleteTodo: (courseId: string, todoId: string) => Promise<void>;
  toggleTodo: (courseId: string, todoId: string) => Promise<void>;

  // Notas rápidas
  addQuickNote: (
    noteData: Omit<QuickNote, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateQuickNote: (
    noteId: string,
    updates: Partial<QuickNote>
  ) => Promise<void>;
  deleteQuickNote: (noteId: string) => Promise<void>;

  // Configuración
  updateSettings: (updates: Partial<AppSettings>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;

  // UI
  setCurrentView: (view: string) => void;
  toggleModal: (modal: keyof AppState['modals']) => void;
  setModal: (modal: keyof AppState['modals'], open: boolean) => void;

  // Búsqueda
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;

  // Focus mode
  startFocusMode: (todo?: Todo) => void;
  exitFocusMode: () => void;
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;

  // Utilidades
  loadCourseData: (courseId: string) => Promise<void>;
  loadCourses: () => Promise<void>;
  exportData: () => Promise<any>;
  importData: (data: any) => Promise<void>;
  clearAllData: () => Promise<void>;
}

// Store principal con Zustand
export const useAppStore = create<AppState & AppActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Estado inicial
        isLoading: false,
        isInitialized: false,
        currentView: 'dashboard',
        currentCourse: null,

        courses: [],
        files: {},
        notes: {},
        events: [],
        todos: {},
        quickNotes: [],
        grades: {},
        courseEvents: {},

        settings: storage.getSettings(),
        preferences: storage.getPreferences(),

        modals: {
          courseModal: false,
          fileModal: false,
          noteModal: false,
          eventModal: false,
          todoModal: false,
          quickNoteModal: false,
          settingsModal: false,
          commandPalette: false,
          onboarding: false,
        },

        searchQuery: '',
        searchResults: [],

        focusMode: {
          active: false,
          currentTodo: null,
          pomodoroTime: 25 * 60, // 25 minutos en segundos
          pomodoroActive: false,
          sessions: 0,
        },

        // Inicialización
        initialize: async () => {
          // Usar la función robusta de inicialización
          await get().initializeRobust();
        },

        // Inicialización robusta con fallback
        initializeRobust: async () => {
          set({ isLoading: true });

          try {
            // Inicializar la base de datos
            console.log('🔄 Inicializando base de datos...');
            await initDatabase();

            // Verificar si la base de datos está disponible
            if (!db.isOpen()) {
              console.warn(
                '⚠️ Base de datos no está abierta, intentando abrir...'
              );
              try {
                await db.open();
                console.log('✅ Base de datos abierta correctamente');
              } catch (openError) {
                console.warn(
                  '⚠️ No se pudo abrir la base de datos:',
                  openError
                );
              }
            }

            // Inicializar con datos mínimos
            const initialState: Partial<AppState> = {
              courses: [],
              files: {},
              notes: {},
              events: [],
              todos: {},
              quickNotes: [],
              grades: {},
              courseEvents: {},
              isInitialized: true,
              isLoading: false,
            };

            // Cargar cursos usando la función loadCourses
            await get().loadCourses();

            // Cargar otros datos (eventos y notas rápidas)
            try {
              if (get().settings.useSupabase) {
                // Cargar desde Supabase
                console.log(
                  '🔄 Cargando eventos y notas rápidas desde Supabase...'
                );
                const [eventsResult, quickNotesResult] =
                  await Promise.allSettled([
                    supabase.from('events').select('*'),
                    supabase.from('quick_notes').select('*'),
                  ]);

                // Procesar resultados de Supabase
                if (
                  eventsResult.status === 'fulfilled' &&
                  !eventsResult.value.error
                ) {
                  initialState.events = eventsResult.value.data || [];
                  console.log(
                    '✅ Eventos cargados desde Supabase:',
                    initialState.events.length
                  );
                } else {
                  console.warn(
                    '⚠️ Error cargando eventos desde Supabase, fallback a IndexedDB'
                  );
                  const localEvents = await db.events.toArray();
                  initialState.events = localEvents;
                }

                if (
                  quickNotesResult.status === 'fulfilled' &&
                  !quickNotesResult.value.error
                ) {
                  initialState.quickNotes = quickNotesResult.value.data || [];
                  console.log(
                    '✅ Notas rápidas cargadas desde Supabase:',
                    initialState.quickNotes.length
                  );
                } else {
                  console.warn(
                    '⚠️ Error cargando notas rápidas desde Supabase, fallback a IndexedDB'
                  );
                  const localQuickNotes = await db.quickNotes.toArray();
                  initialState.quickNotes = localQuickNotes;
                }
              } else {
                // Cargar desde IndexedDB
                console.log(
                  '🔄 Cargando eventos y notas rápidas desde IndexedDB...'
                );
                const [events, quickNotes] = await Promise.allSettled([
                  db.events.toArray(),
                  db.quickNotes.toArray(),
                ]);

                // Procesar resultados exitosos
                if (events.status === 'fulfilled') {
                  initialState.events = events.value;
                  console.log(
                    '✅ Eventos cargados desde IndexedDB:',
                    initialState.events.length
                  );
                }
                if (quickNotes.status === 'fulfilled') {
                  initialState.quickNotes = quickNotes.value;
                  console.log(
                    '✅ Notas rápidas cargadas desde IndexedDB:',
                    initialState.quickNotes.length
                  );
                }
              }

              // Cargar datos relacionados de cursos
              for (const course of initialState.courses || []) {
                try {
                  const [courseFiles, courseNotes, courseTodos] =
                    await Promise.allSettled([
                      db.files.where('courseId').equals(course.id).toArray(),
                      db.notes.where('courseId').equals(course.id).toArray(),
                      db.todos.where('courseId').equals(course.id).toArray(),
                    ]);

                  if (courseFiles.status === 'fulfilled') {
                    (initialState.files || {})[course.id] = courseFiles.value;
                  } else {
                    (initialState.files || {})[course.id] = [];
                  }

                  if (courseNotes.status === 'fulfilled') {
                    (initialState.notes || {})[course.id] = courseNotes.value;
                  } else {
                    (initialState.notes || {})[course.id] = [];
                  }

                  if (courseTodos.status === 'fulfilled') {
                    (initialState.todos || {})[course.id] = courseTodos.value;
                  } else {
                    (initialState.todos || {})[course.id] = [];
                  }
                } catch (courseError) {
                  console.warn(
                    `⚠️ Error cargando datos del curso ${course.id}:`,
                    courseError
                  );
                  (initialState.files || {})[course.id] = [];
                  (initialState.notes || {})[course.id] = [];
                  (initialState.todos || {})[course.id] = [];
                }
              }

              console.log('✅ Datos cargados de la base de datos');
            } catch (dbError) {
              console.warn(
                '⚠️ Error cargando datos de la base de datos, usando estado vacío:',
                dbError
              );
            }

            // Establecer el estado
            set(initialState as any);
            console.log('✅ App state initialized successfully');
          } catch (error) {
            console.error('❌ Error critical initializing app state:', error);
            // Establecer estado mínimo para que la app funcione
            set({
              courses: [],
              files: {},
              notes: {},
              events: [],
              todos: {},
              quickNotes: [],
              grades: {},
              courseEvents: {},
              isInitialized: true,
              isLoading: false,
            } as Partial<AppState>);
          }
        },

        // Gestión de cursos
        addCourse: async courseData => {
          try {
            // Verificar si hay usuario autenticado
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user && get().settings.useSupabase) {
              console.log('🔄 Guardando curso en Supabase...');

              // Preparar datos para Supabase (sin archived)
              const supabaseCourseData = {
                name: courseData.name,
                color: courseData.color,
                teacher: courseData.teacher || 'Sin profesor',
                credits: courseData.credits || 0,
                semester: courseData.semester || 'Sin semestre',
              };

              const newCourse = await saveCourseToSupabase(
                supabaseCourseData,
                user.id
              );

              // Convertir el curso de Supabase al formato local
              const localCourse: Course = {
                id: newCourse.id,
                name: newCourse.name,
                color: newCourse.color,
                teacher: newCourse.teacher,
                credits: newCourse.credits,
                semester: newCourse.semester,
                archived: false, // Valor por defecto local
                user_id: newCourse.user_id,
                created_at: newCourse.created_at,
                updated_at: newCourse.updated_at,
              };

              set(state => ({
                courses: [...state.courses, localCourse],
                files: { ...state.files, [localCourse.id]: [] },
                notes: { ...state.notes, [localCourse.id]: [] },
                todos: { ...state.todos, [localCourse.id]: [] },
              }));
              console.log('✅ Curso guardado en Supabase:', localCourse);
            } else {
              // No hay usuario autenticado o Supabase deshabilitado → usar IndexedDB
              console.log(
                '🔄 Guardando curso en IndexedDB (sin usuario autenticado)...'
              );
              const newCourse = await saveCourseToIndexedDB({
                name: courseData.name,
                color: courseData.color,
                teacher: courseData.teacher || 'Sin profesor',
                credits: courseData.credits || 0,
                semester: courseData.semester || 'Sin semestre',
                archived: false,
              });

              // Convertir el curso de IndexedDB al formato local
              const localCourse: Course = {
                id: newCourse.id,
                name: newCourse.name,
                color: newCourse.color,
                teacher: newCourse.teacher,
                credits: newCourse.credits,
                semester: newCourse.semester,
                archived: newCourse.archived,
                user_id: newCourse.user_id,
                created_at: newCourse.created_at,
                updated_at: newCourse.updated_at,
              };

              set(state => ({
                courses: [...state.courses, localCourse],
                files: { ...state.files, [localCourse.id]: [] },
                notes: { ...state.notes, [localCourse.id]: [] },
                todos: { ...state.todos, [localCourse.id]: [] },
              }));
              console.log('✅ Curso guardado en IndexedDB:', localCourse);
            }
          } catch (err) {
            console.error('❌ addCourse error:', err);
            // Fallback a IndexedDB en caso de error
            try {
              console.log('🔄 Fallback a IndexedDB...');
              const newCourse = await saveCourseToIndexedDB({
                name: courseData.name,
                color: courseData.color,
                teacher: courseData.teacher || 'Sin profesor',
                credits: courseData.credits || 0,
                semester: courseData.semester || 'Sin semestre',
                archived: false,
              });

              // Convertir el curso de IndexedDB al formato local
              const localCourse: Course = {
                id: newCourse.id,
                name: newCourse.name,
                color: newCourse.color,
                teacher: newCourse.teacher,
                credits: newCourse.credits,
                semester: newCourse.semester,
                archived: newCourse.archived,
                user_id: newCourse.user_id,
                created_at: newCourse.created_at,
                updated_at: newCourse.updated_at,
              };

              set(state => ({
                courses: [...state.courses, localCourse],
                files: { ...state.files, [localCourse.id]: [] },
                notes: { ...state.notes, [localCourse.id]: [] },
                todos: { ...state.todos, [localCourse.id]: [] },
              }));
              console.log(
                '✅ Curso guardado en IndexedDB (fallback):',
                localCourse
              );
            } catch (fallbackError) {
              console.error(
                '❌ Error crítico en fallback a IndexedDB:',
                fallbackError
              );
            }
          }
        },

        updateCourse: async (id, updates) => {
          await db.courses.update(id, { ...updates, updatedAt: new Date() });

          set(state => ({
            courses: state.courses.map(course =>
              course.id === id
                ? { ...course, ...updates, updatedAt: new Date() }
                : course
            ),
          }));
        },

        deleteCourse: async id => {
          // Eliminar todos los datos relacionados
          await db.transaction(
            'rw',
            [db.courses, db.files, db.notes, db.events, db.todos],
            async () => {
              await db.courses.delete(id);
              await db.files.where('courseId').equals(id).delete();
              await db.notes.where('courseId').equals(id).delete();
              await db.events.where('courseId').equals(id).delete();
              await db.todos.where('courseId').equals(id).delete();
            }
          );

          set(state => {
            const { [id]: deletedFiles, ...restFiles } = state.files;
            const { [id]: deletedNotes, ...restNotes } = state.notes;
            const { [id]: deletedTodos, ...restTodos } = state.todos;

            return {
              courses: state.courses.filter(course => course.id !== id),
              files: restFiles,
              notes: restNotes,
              todos: restTodos,
              events: state.events.filter(event => event.courseId !== id),
              currentCourse:
                state.currentCourse?.id === id ? null : state.currentCourse,
            };
          });
        },

        archiveCourse: async id => {
          await db.courses.update(id, {
            archived: true,
            updatedAt: new Date(),
          });

          set(state => ({
            courses: state.courses.filter(course => course.id !== id),
            currentCourse:
              state.currentCourse?.id === id ? null : state.currentCourse,
          }));
        },

        setCurrentCourse: course => {
          set({ currentCourse: course });
        },

        // Gestión de archivos
        addFile: async (courseId, file, tags) => {
          const fileRecord: FileRecord = {
            id: idUtils.generate(),
            courseId,
            name: file.name,
            type: file.type as 'file' | 'folder',
            size: file.size,
            tags,
            blob: file,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.files.add(fileRecord);

          set(state => ({
            files: {
              ...state.files,
              [courseId]: [...(state.files[courseId] || []), fileRecord],
            },
          }));
        },

        deleteFile: async (courseId, fileId) => {
          await db.files.delete(fileId);

          set(state => ({
            files: {
              ...state.files,
              [courseId]:
                state.files[courseId]?.filter(file => file.id !== fileId) || [],
            },
          }));
        },

        updateFileTags: async (courseId, fileId, tags) => {
          await db.files.update(fileId, { tags, updatedAt: new Date() });

          set(state => ({
            files: {
              ...state.files,
              [courseId]:
                state.files[courseId]?.map(file =>
                  file.id === fileId
                    ? { ...file, tags, updatedAt: new Date() }
                    : file
                ) || [],
            },
          }));
        },

        // Gestión de materiales del curso
        addCourseMaterial: async (courseId, materialData) => {
          const newMaterial = {
            ...materialData,
            id: idUtils.generate(),
            courseId,
            uploadedAt: new Date(),
            updatedAt: new Date(),
          };

          // TODO: Agregar a la base de datos cuando se implemente la tabla de materiales
          // await db.materials.add(newMaterial);

          set((state: any) => ({
            files: {
              ...state.files,
              [courseId]: [
                ...(state.files[courseId] || []),
                newMaterial as any,
              ],
            },
          }));
        },

        updateCourseMaterial: async (courseId, materialId, updates) => {
          // TODO: Actualizar en la base de datos cuando se implemente la tabla de materiales
          // await db.materials.update(materialId, { ...updates, updatedAt: new Date() });

          set(state => ({
            files: {
              ...state.files,
              [courseId]:
                state.files[courseId]?.map(material =>
                  material.id === materialId
                    ? { ...material, ...updates, updatedAt: new Date() }
                    : material
                ) || [],
            },
          }));
        },

        deleteCourseMaterial: async (courseId, materialId) => {
          // TODO: Eliminar de la base de datos cuando se implemente la tabla de materiales
          // await db.materials.delete(materialId);

          set(state => ({
            files: {
              ...state.files,
              [courseId]:
                state.files[courseId]?.filter(
                  material => material.id !== materialId
                ) || [],
            },
          }));
        },

        moveCourseMaterial: async (courseId, materialId, newParentId) => {
          // TODO: Actualizar en la base de datos cuando se implemente la tabla de materiales
          // await db.materials.update(materialId, { parentId: newParentId, updatedAt: new Date() });

          set(state => ({
            files: {
              ...state.files,
              [courseId]:
                state.files[courseId]?.map(material =>
                  material.id === materialId
                    ? {
                        ...material,
                        parentId: newParentId,
                        updatedAt: new Date(),
                      }
                    : material
                ) || [],
            },
          }));
        },

        // Gestión de notas del curso
        addCourseGrade: async (courseId, gradeData) => {
          const newGrade = {
            ...gradeData,
            id: idUtils.generate(),
            courseId,
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // TODO: Agregar a la base de datos cuando se implemente la tabla de notas
          // await db.grades.add(newGrade);

          set((state: any) => ({
            grades: {
              ...state.grades,
              [courseId]: [...(state.grades[courseId] || []), newGrade],
            },
          }));
        },

        updateCourseGrade: async (courseId, gradeId, updates) => {
          // TODO: Actualizar en la base de datos cuando se implemente la tabla de notas
          // await db.grades.update(gradeId, { ...updates, updatedAt: new Date() });

          set((state: any) => ({
            grades: {
              ...state.grades,
              [courseId]:
                state.grades[courseId]?.map((grade: any) =>
                  grade.id === gradeId
                    ? { ...grade, ...updates, updatedAt: new Date() }
                    : grade
                ) || [],
            },
          }));
        },

        deleteCourseGrade: async (courseId, gradeId) => {
          // TODO: Eliminar de la base de datos cuando se implemente la tabla de notas
          // await db.grades.delete(gradeId);

          set((state: any) => ({
            grades: {
              ...state.grades,
              [courseId]:
                state.grades[courseId]?.filter(
                  (grade: any) => grade.id !== gradeId
                ) || [],
            },
          }));
        },

        // Gestión de eventos del calendario del curso
        addCourseEvent: async (courseId, eventData) => {
          const newEvent = {
            ...eventData,
            id: idUtils.generate(),
            courseId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // TODO: Agregar a la base de datos cuando se implemente la tabla de eventos
          // await db.courseEvents.add(newEvent);

          set((state: any) => ({
            courseEvents: {
              ...state.courseEvents,
              [courseId]: [...(state.courseEvents[courseId] || []), newEvent],
            },
          }));
        },

        updateCourseEvent: async (courseId, eventId, updates) => {
          // TODO: Actualizar en la base de datos cuando se implemente la tabla de eventos
          // await db.courseEvents.update(eventId, { ...updates, updatedAt: new Date() });

          set((state: any) => ({
            courseEvents: {
              ...state.courseEvents,
              [courseId]:
                state.courseEvents[courseId]?.map((event: any) =>
                  event.id === eventId
                    ? { ...event, ...updates, updatedAt: new Date() }
                    : event
                ) || [],
            },
          }));
        },

        deleteCourseEvent: async (courseId, eventId) => {
          // TODO: Eliminar de la base de datos cuando se implemente la tabla de eventos
          // await db.courseEvents.delete(eventId);

          set((state: any) => ({
            courseEvents: {
              ...state.courseEvents,
              [courseId]:
                state.courseEvents[courseId]?.filter(
                  (event: any) => event.id !== eventId
                ) || [],
            },
          }));
        },

        // Gestión de notas
        addNote: async (courseId, noteData) => {
          const newNote: Note = {
            ...noteData,
            id: idUtils.generate(),
            courseId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.notes.add(newNote);

          set(state => ({
            notes: {
              ...state.notes,
              [courseId]: [...(state.notes[courseId] || []), newNote],
            },
          }));
        },

        updateNote: async (courseId, noteId, updates) => {
          await db.notes.update(noteId, { ...updates, updatedAt: new Date() });

          set(state => ({
            notes: {
              ...state.notes,
              [courseId]:
                state.notes[courseId]?.map(note =>
                  note.id === noteId
                    ? { ...note, ...updates, updatedAt: new Date() }
                    : note
                ) || [],
            },
          }));
        },

        deleteNote: async (courseId, noteId) => {
          await db.notes.delete(noteId);

          set(state => ({
            notes: {
              ...state.notes,
              [courseId]:
                state.notes[courseId]?.filter(note => note.id !== noteId) || [],
            },
          }));
        },

        // Gestión de eventos
        addEvent: async eventData => {
          const newEvent: Event = {
            ...eventData,
            id: idUtils.generate(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.events.add(newEvent);

          set(state => ({
            events: [...state.events, newEvent],
          }));
        },

        updateEvent: async (eventId, updates) => {
          await db.events.update(eventId, {
            ...updates,
            updatedAt: new Date(),
          });

          set(state => ({
            events: state.events.map(event =>
              event.id === eventId
                ? { ...event, ...updates, updatedAt: new Date() }
                : event
            ),
          }));
        },

        deleteEvent: async eventId => {
          await db.events.delete(eventId);

          set(state => ({
            events: state.events.filter(event => event.id !== eventId),
          }));
        },

        // Gestión de todos
        addTodo: async (courseId, todoData) => {
          const newTodo: Todo = {
            ...todoData,
            id: idUtils.generate(),
            courseId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.todos.add(newTodo);

          set(state => ({
            todos: {
              ...state.todos,
              [courseId]: [...(state.todos[courseId] || []), newTodo],
            },
          }));
        },

        updateTodo: async (courseId, todoId, updates) => {
          await db.todos.update(todoId, { ...updates, updatedAt: new Date() });

          set(state => ({
            todos: {
              ...state.todos,
              [courseId]:
                state.todos[courseId]?.map(todo =>
                  todo.id === todoId
                    ? { ...todo, ...updates, updatedAt: new Date() }
                    : todo
                ) || [],
            },
          }));
        },

        deleteTodo: async (courseId, todoId) => {
          await db.todos.delete(todoId);

          set(state => ({
            todos: {
              ...state.todos,
              [courseId]:
                state.todos[courseId]?.filter(todo => todo.id !== todoId) || [],
            },
          }));
        },

        toggleTodo: async (courseId, todoId) => {
          const currentTodos = get().todos[courseId] || [];
          const todo = currentTodos.find(t => t.id === todoId);

          if (todo) {
            await get().updateTodo(courseId, todoId, { done: !todo.done });
          }
        },

        // Gestión de notas rápidas
        addQuickNote: async noteData => {
          const newNote: QuickNote = {
            ...noteData,
            id: idUtils.generate(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.quickNotes.add(newNote);

          set(state => ({
            quickNotes: [...state.quickNotes, newNote],
          }));
        },

        updateQuickNote: async (noteId, updates) => {
          await db.quickNotes.update(noteId, {
            ...updates,
            updatedAt: new Date(),
          });

          set(state => ({
            quickNotes: state.quickNotes.map(note =>
              note.id === noteId
                ? { ...note, ...updates, updatedAt: new Date() }
                : note
            ),
          }));
        },

        deleteQuickNote: async noteId => {
          await db.quickNotes.delete(noteId);

          set(state => ({
            quickNotes: state.quickNotes.filter(note => note.id !== noteId),
          }));
        },

        // Configuración
        updateSettings: updates => {
          const newSettings = { ...get().settings, ...updates };
          storage.saveSettings(updates);
          set({ settings: newSettings });
        },

        updatePreferences: updates => {
          const newPreferences = { ...get().preferences, ...updates };
          storage.savePreferences(updates);
          set({ preferences: newPreferences });
        },

        // UI
        setCurrentView: view => {
          set({ currentView: view });
        },

        toggleModal: modal => {
          set(state => ({
            modals: {
              ...state.modals,
              [modal]: !state.modals[modal],
            },
          }));
        },

        setModal: (modal, open) => {
          set(state => ({
            modals: {
              ...state.modals,
              [modal]: open,
            },
          }));
        },

        // Búsqueda
        setSearchQuery: query => {
          set({ searchQuery: query });
        },

        performSearch: async (_query: string) => {
          // Búsqueda global aquí - implementar con FlexSearch más tarde
          set({ searchResults: [] });
        },

        // Focus mode
        startFocusMode: todo => {
          set({
            focusMode: {
              active: true,
              currentTodo: todo || null,
              pomodoroTime: get().settings.pomodoroSettings.workTime * 60,
              pomodoroActive: false,
              sessions: 0,
            },
          });
        },

        exitFocusMode: () => {
          set({
            focusMode: {
              active: false,
              currentTodo: null,
              pomodoroTime: get().settings.pomodoroSettings.workTime * 60,
              pomodoroActive: false,
              sessions: 0,
            },
          });
        },

        startPomodoro: () => {
          set(state => ({
            focusMode: {
              ...state.focusMode,
              pomodoroActive: true,
            },
          }));
        },

        pausePomodoro: () => {
          set(state => ({
            focusMode: {
              ...state.focusMode,
              pomodoroActive: false,
            },
          }));
        },

        resetPomodoro: () => {
          set(state => ({
            focusMode: {
              ...state.focusMode,
              pomodoroTime: get().settings.pomodoroSettings.workTime * 60,
              pomodoroActive: false,
            },
          }));
        },

        // Utilidades
        loadCourseData: async courseId => {
          // Cargar datos específicos de un curso si no están en memoria
          const state = get();
          if (
            !state.files[courseId] ||
            !state.notes[courseId] ||
            !state.todos[courseId]
          ) {
            const [courseFiles, courseNotes, courseTodos] = await Promise.all([
              db.files.where('courseId').equals(courseId).toArray(),
              db.notes.where('courseId').equals(courseId).toArray(),
              db.todos.where('courseId').equals(courseId).toArray(),
            ]);

            set(state => ({
              files: { ...state.files, [courseId]: courseFiles },
              notes: { ...state.notes, [courseId]: courseNotes },
              todos: { ...state.todos, [courseId]: courseTodos },
            }));
          }
        },

        // Cargar cursos desde la fuente de datos configurada
        loadCourses: async () => {
          try {
            // Verificar si hay usuario autenticado
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user && get().settings.useSupabase) {
              console.log('🔄 Cargando cursos desde Supabase...');
              const supabaseCourses = await getCoursesFromSupabase(user.id);

              // Convertir cursos de Supabase al formato local
              const localCourses: Course[] = supabaseCourses.map(
                supabaseCourse => ({
                  id: supabaseCourse.id,
                  name: supabaseCourse.name,
                  color: supabaseCourse.color,
                  teacher: supabaseCourse.teacher,
                  credits: supabaseCourse.credits,
                  semester: supabaseCourse.semester,
                  archived: false, // Valor por defecto local
                  user_id: supabaseCourse.user_id,
                  created_at: supabaseCourse.created_at,
                  updated_at: supabaseCourse.updated_at,
                })
              );

              set({ courses: localCourses });
              console.log(
                '✅ Cursos cargados desde Supabase:',
                localCourses.length
              );
            } else {
              // No hay usuario autenticado o Supabase deshabilitado → usar IndexedDB
              console.log(
                '🔄 Cargando cursos desde IndexedDB (sin usuario autenticado)...'
              );
              const indexedDBCourses = await getCoursesFromIndexedDB();

              // Convertir cursos de IndexedDB al formato local
              const localCourses: Course[] = indexedDBCourses.map(
                indexedDBCourse => ({
                  id: indexedDBCourse.id,
                  name: indexedDBCourse.name,
                  color: indexedDBCourse.color,
                  teacher: indexedDBCourse.teacher,
                  credits: indexedDBCourse.credits,
                  semester: indexedDBCourse.semester,
                  archived: indexedDBCourse.archived,
                  user_id: indexedDBCourse.user_id,
                  created_at: indexedDBCourse.created_at,
                  updated_at: indexedDBCourse.updated_at,
                })
              );

              set({ courses: localCourses });
              console.log(
                '✅ Cursos cargados desde IndexedDB:',
                localCourses.length
              );
            }
          } catch (err) {
            console.error('❌ Error cargando cursos:', err);
            // Fallback a IndexedDB
            try {
              console.log('🔄 Fallback a IndexedDB...');
              const indexedDBCourses = await getCoursesFromIndexedDB();

              // Convertir cursos de IndexedDB al formato local
              const localCourses: Course[] = indexedDBCourses.map(
                indexedDBCourse => ({
                  id: indexedDBCourse.id,
                  name: indexedDBCourse.name,
                  color: indexedDBCourse.color,
                  teacher: indexedDBCourse.teacher,
                  credits: indexedDBCourse.credits,
                  semester: indexedDBCourse.semester,
                  archived: indexedDBCourse.archived,
                  user_id: indexedDBCourse.user_id,
                  created_at: indexedDBCourse.created_at,
                  updated_at: indexedDBCourse.updated_at,
                })
              );

              set({ courses: localCourses });
              console.log(
                '✅ Cursos cargados desde IndexedDB (fallback):',
                localCourses.length
              );
            } catch (fallbackError) {
              console.error(
                '❌ Error crítico en fallback a IndexedDB:',
                fallbackError
              );
              set({ courses: [] });
            }
          }
        },

        exportData: async () => {
          // Conectar IA real aquí - exportar datos para backup
          const state = get();
          return {
            courses: state.courses,
            notes: state.notes,
            events: state.events,
            todos: state.todos,
            quickNotes: state.quickNotes,
            settings: state.settings,
            preferences: state.preferences,
            exportedAt: new Date(),
            version: '2.0',
          };
        },

        importData: async data => {
          // Conectar IA real aquí - importar datos desde backup
          if (data.courses) set({ courses: data.courses });
          if (data.notes) set({ notes: data.notes });
          if (data.events) set({ events: data.events });
          if (data.todos) set({ todos: data.todos });
          if (data.quickNotes) set({ quickNotes: data.quickNotes });
          if (data.settings) {
            storage.saveSettings(data.settings);
            set({ settings: data.settings });
          }
          if (data.preferences) {
            storage.savePreferences(data.preferences);
            set({ preferences: data.preferences });
          }
        },

        checkSupabaseConnection: async () => {
          try {
            // Verificar si Supabase está configurado
            if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
              console.log('❌ Supabase no configurado');
              return false;
            }

            // Verificar conexión a Supabase con una consulta simple
            const { data, error } = await supabase
              .from('courses')
              .select('id')
              .limit(1);

            if (error) {
              console.log('❌ Error conectando a Supabase:', error);
              return false;
            }

            console.log('✅ Conexión a Supabase exitosa');
            return true;
          } catch (error) {
            console.log('❌ Error verificando Supabase:', error);
            return false;
          }
        },

        switchToSupabase: async () => {
          try {
            console.log('🔄 Cambiando a Supabase...');

            // Verificar conexión a Supabase
            const isConnected = await get().checkSupabaseConnection();
            if (!isConnected) {
              throw new Error('No se puede conectar a Supabase');
            }

            // Sincronizar datos existentes de IndexedDB a Supabase
            const currentState = get();
            if (currentState.courses.length > 0) {
              console.log('🔄 Sincronizando cursos existentes a Supabase...');
              for (const course of currentState.courses) {
                try {
                  const { error } = await supabase
                    .from('courses')
                    .upsert([course], { onConflict: 'id' });

                  if (error) {
                    console.warn(
                      `⚠️ Error sincronizando curso ${course.id}:`,
                      error
                    );
                  }
                } catch (error) {
                  console.warn(
                    `⚠️ Error crítico sincronizando curso ${course.id}:`,
                    error
                  );
                }
              }
              console.log('✅ Sincronización de cursos completada');
            }

            // Actualizar configuración
            const newSettings = {
              ...get().settings,
              useSupabase: true,
              useIndexedDB: false,
            };

            storage.saveSettings(newSettings);
            set({ settings: newSettings });

            console.log('✅ Cambiado a Supabase exitosamente');
          } catch (error) {
            console.error('❌ Error cambiando a Supabase:', error);
            throw error;
          }
        },

        switchToIndexedDB: async () => {
          try {
            console.log('🔄 Cambiando a IndexedDB...');

            // Actualizar configuración
            const newSettings = {
              ...get().settings,
              useSupabase: false,
              useIndexedDB: true,
            };

            storage.saveSettings(newSettings);
            set({ settings: newSettings });

            console.log('✅ Cambiado a IndexedDB exitosamente');
          } catch (error) {
            console.error('❌ Error cambiando a IndexedDB:', error);
            throw error;
          }
        },

        clearAllData: async () => {
          // Persistencia aquí - limpiar todos los datos
          await db.transaction(
            'rw',
            [
              db.courses,
              db.files,
              db.notes,
              db.events,
              db.todos,
              db.quickNotes,
            ],
            async () => {
              await db.courses.clear();
              await db.files.clear();
              await db.notes.clear();
              await db.events.clear();
              await db.todos.clear();
              await db.quickNotes.clear();
            }
          );

          storage.clear();

          set({
            courses: [],
            files: {},
            notes: {},
            events: [],
            todos: {},
            quickNotes: [],
            grades: {},
            courseEvents: {},
            settings: storage.getSettings(),
            preferences: storage.getPreferences(),
          } as any);
        },
      }),
      {
        name: 'app-storage', // required: unique name
      }
    )
  )
);

// Hooks específicos para facilitar el uso
export const useCurrentCourse = () => useAppStore(state => state.currentCourse);
export const useCourses = () => useAppStore(state => state.courses);
export const useSettings = () => useAppStore(state => state.settings);
export const useModals = () => useAppStore(state => state.modals);
export const useFocusMode = () => useAppStore(state => state.focusMode);

// Exportar helpers no-hook (API utilitaria)
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
