// Gestión de localStorage para configuraciones y datos ligeros

export interface AppSettings {
  // Apariencia
  density: 'compact' | 'normal' | 'comfortable';
  highContrast: boolean;
  fontSize: 'small' | 'normal' | 'large';

  // IA
  aiAdapter: 'mock' | 'webllm' | 'ollama';
  ragEnabled: boolean;
  contextSize: number;
  topK: number;

  // Notas
  passingGrade: number;
  gradeScale: 20 | 100;

  // Notificaciones
  notifications: boolean;
  reminderDefaults: {
    exams: number; // días antes
    assignments: number;
  };

  // PWA
  installPromptShown: boolean;
  offlineMode: boolean;

  // Base de datos
  useSupabase: boolean;
  useIndexedDB: boolean;

  // Onboarding
  onboardingCompleted: boolean;
  tourSteps: Record<string, boolean>;

  // Focus/Pomodoro
  pomodoroSettings: {
    workTime: number; // minutos
    shortBreak: number;
    longBreak: number;
    longBreakInterval: number; // cada X pomodoros
  };
}

export interface UserPreferences {
  favoriteColors: string[];
  recentSearches: string[];
  pinnedCourses: string[];
  hiddenFeatures: string[];
  customKeyboardShortcuts: Record<string, string>;
}

export interface CacheData {
  lastSync: Date;
  courseStats: Record<
    string,
    {
      avgGrade: number;
      totalFiles: number;
      totalNotes: number;
      pendingTodos: number;
      lastActivity: Date;
    }
  >;
  searchIndex: {
    version: string;
    lastBuild: Date;
  };
}

// Claves para localStorage
const STORAGE_KEYS = {
  SETTINGS: 'studysync_settings',
  PREFERENCES: 'studysync_preferences',
  CACHE: 'studysync_cache',
  BACKUP_DATA: 'studysync_backup',
  DEMO_LOADED: 'studysync_demo_loaded',
} as const;

// Configuración por defecto
const DEFAULT_SETTINGS: AppSettings = {
  // Apariencia
  density: 'normal',
  highContrast: false,
  fontSize: 'normal',

  // IA
  aiAdapter: 'webllm',
  ragEnabled: false,
  contextSize: 2048,
  topK: 5,

  // Notas
  passingGrade: 11,
  gradeScale: 20,

  // Notificaciones
  notifications: true,
  reminderDefaults: {
    exams: 7,
    assignments: 3,
  },

  // PWA
  installPromptShown: false,
  offlineMode: true,

  // Base de datos
  useSupabase: true, // Usar Supabase por defecto en producción
  useIndexedDB: false, // No usar IndexedDB por defecto

  // Onboarding
  onboardingCompleted: false,
  tourSteps: {},

  // Focus
  pomodoroSettings: {
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
  },
};

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteColors: ['#3B82F6', '#10B981', '#EF4444', '#FACC15', '#8B5CF6'],
  recentSearches: [],
  pinnedCourses: [],
  hiddenFeatures: [],
  customKeyboardShortcuts: {},
};

// Funciones de localStorage
class LocalStorageManager {
  // Configuraciones
  getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Error loading settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  }

  saveSettings(settings: Partial<AppSettings>): void {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }

  // Preferencias
  getPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.warn('Error loading preferences from localStorage:', error);
    }
    return DEFAULT_PREFERENCES;
  }

  savePreferences(preferences: Partial<UserPreferences>): void {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
    }
  }

  // Cache
  getCache(): CacheData | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CACHE);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir fechas de string a Date
        parsed.lastSync = new Date(parsed.lastSync);
        if (parsed.courseStats) {
          Object.values(parsed.courseStats).forEach((stats: any) => {
            stats.lastActivity = new Date(stats.lastActivity);
          });
        }
        if (parsed.searchIndex) {
          parsed.searchIndex.lastBuild = new Date(parsed.searchIndex.lastBuild);
        }
        return parsed;
      }
    } catch (error) {
      console.warn('Error loading cache from localStorage:', error);
    }
    return null;
  }

  saveCache(cache: CacheData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  }

  // Backup de emergencia
  saveBackup(data: any): void {
    try {
      const backup = {
        data,
        timestamp: new Date(),
        version: '1.0',
      };
      localStorage.setItem(STORAGE_KEYS.BACKUP_DATA, JSON.stringify(backup));
    } catch (error) {
      console.error('Error saving backup to localStorage:', error);
    }
  }

  getBackup(): any | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BACKUP_DATA);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.timestamp = new Date(parsed.timestamp);
        return parsed;
      }
    } catch (error) {
      console.warn('Error loading backup from localStorage:', error);
    }
    return null;
  }

  // Demo data flag
  isDemoLoaded(): boolean {
    return localStorage.getItem(STORAGE_KEYS.DEMO_LOADED) === 'true';
  }

  setDemoLoaded(loaded: boolean): void {
    localStorage.setItem(STORAGE_KEYS.DEMO_LOADED, loaded.toString());
  }

  // Utilidades
  clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  getUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          used += item.length;
        }
      });

      // Estimar el límite (generalmente 5-10MB)
      const total = 10 * 1024 * 1024; // 10MB estimado
      const percentage = (used / total) * 100;

      return { used, total, percentage };
    } catch (error) {
      console.error('Error calculating localStorage usage:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  // Migración de versiones
  migrate(): void {
    try {
      // Aquí iríamos agregando migraciones conforme evolucione la app
      console.log('🔄 Checking for localStorage migrations...');

      // Ejemplo de migración:
      // const version = localStorage.getItem('studysync_version');
      // if (!version || version < '2.0') {
      //   this.migrateToV2();
      // }
    } catch (error) {
      console.error('Error during localStorage migration:', error);
    }
  }
}

// Persistencia aquí - exportar instancia singleton
export const storage = new LocalStorageManager();

// Hook personalizado para React (será útil más tarde)
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [state, setState] = React.useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setValue = React.useCallback(
    (value: T) => {
      try {
        setState(value);
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  return [state, setValue];
}

// Importar React para el hook (se agregará después)
import React from 'react';
