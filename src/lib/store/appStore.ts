import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CourseMaterial {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  tags: string[];
  parentId?: string;
  fileUrl?: string;
  mimeType?: string;
  courseId: string;
  uploadedAt: Date;
  updatedAt: Date;
}

interface CourseGrade {
  id: string;
  name: string;
  type: 'exam' | 'quiz' | 'project' | 'homework' | 'participation' | 'other';
  weight: number;
  score: number;
  maxScore: number;
  date: Date;
  notes?: string;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CourseEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  location?: string;
  type: 'exam' | 'assignment' | 'class' | 'meeting' | 'other';
  priority: 'low' | 'medium' | 'high';
  courseId: string;
  source: 'manual' | 'auto-detected';
  sourceFile?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Course {
  id: string;
  name: string;
  teacher: string;
  semester: string;
  color: string;
  archived: boolean;
}

interface AppState {
  // Estado
  courses: Course[];
  files: { [courseId: string]: CourseMaterial[] };
  grades: { [courseId: string]: CourseGrade[] };
  courseEvents: { [courseId: string]: CourseEvent[] };
  notes: { [courseId: string]: any[] };
  events: any[];
  todos: { [courseId: string]: any[] };
  quickNotes: any[];
  isLoading: boolean;
  isInitialized: boolean;

  // Modales
  modals: {
    courseModal: boolean;
    settingsModal: boolean;
    profileModal: boolean;
    helpModal: boolean;
  };

  // Acciones básicas
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setModal: (modal: keyof AppState['modals'], isOpen: boolean) => void;
  
  // Cursos
  addCourse: (course: Omit<Course, 'id'>) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  // Materiales del curso
  addCourseMaterial: (courseId: string, material: {
    name: string;
    type: 'file' | 'folder';
    size?: number;
    tags: string[];
    parentId?: string;
    fileUrl?: string;
    mimeType?: string;
  }) => Promise<void>;
  updateCourseMaterial: (courseId: string, materialId: string, updates: {
    name?: string;
    tags?: string[];
    parentId?: string;
  }) => Promise<void>;
  deleteCourseMaterial: (courseId: string, materialId: string) => Promise<void>;
  moveCourseMaterial: (courseId: string, materialId: string, newParentId?: string) => Promise<void>;

  // Notas del curso
  addCourseGrade: (courseId: string, grade: {
    name: string;
    type: 'exam' | 'quiz' | 'project' | 'homework' | 'participation' | 'other';
    weight: number;
    score: number;
    maxScore: number;
    date: Date;
    notes?: string;
  }) => Promise<void>;
  updateCourseGrade: (courseId: string, gradeId: string, updates: Partial<CourseGrade>) => Promise<void>;
  deleteCourseGrade: (courseId: string, gradeId: string) => Promise<void>;

  // Eventos del curso
  addCourseEvent: (courseId: string, event: {
    title: string;
    description?: string;
    date: Date;
    time?: string;
    location?: string;
    type: 'exam' | 'assignment' | 'class' | 'meeting' | 'other';
    priority: 'low' | 'medium' | 'high';
    source: 'manual' | 'auto-detected';
    sourceFile?: string;
  }) => Promise<void>;
  updateCourseEvent: (courseId: string, eventId: string, updates: Partial<CourseEvent>) => Promise<void>;
  deleteCourseEvent: (courseId: string, eventId: string) => Promise<void>;
}

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      courses: [],
      files: {},
      grades: {},
      courseEvents: {},
      notes: {},
      events: [],
      todos: {},
      quickNotes: [],
      isLoading: false,
      isInitialized: false,

      // Modales
      modals: {
        courseModal: false,
        settingsModal: false,
        profileModal: false,
        helpModal: false,
      },

      // Acciones básicas
      setLoading: (loading) => set({ isLoading: loading }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      setModal: (modal, isOpen) => set(state => ({
        modals: { ...state.modals, [modal]: isOpen }
      })),

      // Gestión de cursos
      addCourse: async (courseData) => {
        const newCourse = {
          ...courseData,
          id: generateId()
        };

        set(state => ({
          courses: [...state.courses, newCourse]
        }));
      },
      updateCourse: async (id, updates) => {
        set(state => ({
          courses: state.courses.map(course =>
            course.id === id ? { ...course, ...updates } : course
          )
        }));
      },
      deleteCourse: async (id) => {
        set(state => ({
          courses: state.courses.filter(course => course.id !== id)
        }));
      },

      // Gestión de materiales
      addCourseMaterial: async (courseId, materialData) => {
        const newMaterial: CourseMaterial = {
          ...materialData,
          id: generateId(),
          courseId,
          uploadedAt: new Date(),
          updatedAt: new Date()
        };

        set(state => ({
          files: {
            ...state.files,
            [courseId]: [...(state.files[courseId] || []), newMaterial]
          }
        }));
      },
      updateCourseMaterial: async (courseId, materialId, updates) => {
        set(state => ({
          files: {
            ...state.files,
            [courseId]: (state.files[courseId] || []).map(material =>
              material.id === materialId 
                ? { ...material, ...updates, updatedAt: new Date() }
                : material
            )
          }
        }));
      },
      deleteCourseMaterial: async (courseId, materialId) => {
        set(state => ({
          files: {
            ...state.files,
            [courseId]: (state.files[courseId] || []).filter(material => material.id !== materialId)
          }
        }));
      },
      moveCourseMaterial: async (courseId, materialId, newParentId) => {
        set(state => ({
          files: {
            ...state.files,
            [courseId]: (state.files[courseId] || []).map(material =>
              material.id === materialId 
                ? { ...material, parentId: newParentId, updatedAt: new Date() }
                : material
            )
          }
        }));
      },

      // Gestión de calificaciones
      addCourseGrade: async (courseId, gradeData) => {
        const newGrade: CourseGrade = {
          ...gradeData,
          id: generateId(),
          courseId,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set(state => ({
          grades: {
            ...state.grades,
            [courseId]: [...(state.grades[courseId] || []), newGrade]
          }
        }));
      },
      updateCourseGrade: async (courseId, gradeId, updates) => {
        set(state => ({
          grades: {
            ...state.grades,
            [courseId]: (state.grades[courseId] || []).map(grade =>
              grade.id === gradeId 
                ? { ...grade, ...updates, updatedAt: new Date() }
                : grade
            )
          }
        }));
      },
      deleteCourseGrade: async (courseId, gradeId) => {
        set(state => ({
          grades: {
            ...state.grades,
            [courseId]: (state.grades[courseId] || []).filter(grade => grade.id !== gradeId)
          }
        }));
      },

      // Gestión de eventos
      addCourseEvent: async (courseId, eventData) => {
        const newEvent: CourseEvent = {
          ...eventData,
          id: generateId(),
          courseId,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set(state => ({
          courseEvents: {
            ...state.courseEvents,
            [courseId]: [...(state.courseEvents[courseId] || []), newEvent]
          }
        }));
      },
      updateCourseEvent: async (courseId, eventId, updates) => {
        set(state => ({
          courseEvents: {
            ...state.courseEvents,
            [courseId]: (state.courseEvents[courseId] || []).map(event =>
              event.id === eventId 
                ? { ...event, ...updates, updatedAt: new Date() }
                : event
            )
          }
        }));
      },
      deleteCourseEvent: async (courseId, eventId) => {
        set(state => ({
          courseEvents: {
            ...state.courseEvents,
            [courseId]: (state.courseEvents[courseId] || []).filter(event => event.id !== eventId)
          }
        }));
      },
    }),
    {
      name: 'studysync-app-storage',
      partialize: (state) => ({
        courses: state.courses,
        files: state.files,
        grades: state.grades,
        courseEvents: state.courseEvents,
        notes: state.notes,
        todos: state.todos,
        quickNotes: state.quickNotes,
      }),
    }
  )
);

// Exportar useStore como alias de useAppStore para compatibilidad
export const useStore = useAppStore;
