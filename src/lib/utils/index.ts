import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
} from 'date-fns';
import { es } from 'date-fns/locale';

// Función para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utilidades de fechas
export const dateUtils = {
  format: (date: Date, formatStr: string = 'dd/MM/yyyy') => {
    return format(date, formatStr, { locale: es });
  },

  formatRelative: (date: Date) => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    if (isYesterday(date)) return 'Ayer';

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: es,
    });
  },

  formatTime: (date: Date) => {
    return format(date, 'HH:mm', { locale: es });
  },

  formatDateTime: (date: Date) => {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  },

  isUpcoming: (date: Date, days: number = 7) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= days;
  },

  daysBetween: (date1: Date, date2: Date) => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
};

// Utilidades de archivos
export const fileUtils = {
  formatBytes: (bytes: number, decimals: number = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  getFileIcon: (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
      return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation'))
      return '📋';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
  },

  getFileExtension: (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  },

  isImageFile: (mimeType: string) => {
    return mimeType.startsWith('image/');
  },

  isPDFFile: (mimeType: string) => {
    return mimeType === 'application/pdf';
  },

  isTextFile: (mimeType: string) => {
    return (
      mimeType.startsWith('text/') ||
      mimeType.includes('word') ||
      mimeType.includes('document')
    );
  },
};

// Utilidades de colores
export const colorUtils = {
  courseColors: [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#EF4444', // Rojo
    '#FACC15', // Amarillo
    '#8B5CF6', // Púrpura
    '#EC4899', // Rosa
    '#F97316', // Naranja
    '#06B6D4', // Cian
    '#84CC16', // Lima
    '#F59E0B', // Ámbar
  ],

  getRandomColor: () => {
    return colorUtils.courseColors[
      Math.floor(Math.random() * colorUtils.courseColors.length)
    ];
  },

  getContrastColor: (hexColor: string) => {
    // Remover el # si existe
    const hex = hexColor.replace('#', '');

    // Convertir a RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calcular luminancia
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  },

  hexToRgba: (hex: string, alpha: number = 1) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'rgba(0, 0, 0, 1)';

    const r = parseInt(result[1] || '0', 16);
    const g = parseInt(result[2] || '0', 16);
    const b = parseInt(result[3] || '0', 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
};

// Utilidades de texto
export const textUtils = {
  truncate: (text: string, length: number = 100) => {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  },

  capitalize: (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  slugify: (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  highlightText: (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },

  extractKeywords: (text: string, maxWords: number = 10) => {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxWords)
      .map(([word]) => word);
  },
};

// Utilidades de validación
export const validation = {
  isEmail: (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  isURL: (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidGrade: (grade: number, scale: 20 | 100 = 20) => {
    return grade >= 0 && grade <= scale;
  },

  isValidWeight: (weight: number) => {
    return weight >= 0 && weight <= 100;
  },

  sanitizeFilename: (filename: string) => {
    return filename.replace(/[^a-z0-9\.\-_]/gi, '_');
  },
};

// Utilidades de rendimiento
export const performance = {
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

// Utilidades de ID
export const idUtils = {
  generate: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  nanoid: (size: number = 10) => {
    const alphabet =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let id = '';
    for (let i = 0; i < size; i++) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
  },

  uuid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  },
};

// Utilidades de localStorage
export const storageUtils = {
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },

  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
};

// Utilidades de desarrollo
export const dev = {
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`🔧 ${message}`, data);
    }
  },

  warn: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ ${message}`, data);
    }
  },

  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error);
  },

  time: (label: string) => {
    if (import.meta.env.DEV) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (import.meta.env.DEV) {
      console.timeEnd(label);
    }
  },
};

// Exportar todo
export * from './constants';
export { default as constants } from './constants';
