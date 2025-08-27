import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';
import { initDatabase } from './lib/db/database';
import { storage } from './lib/storage/localStorage';

// Persistencia aquí - Inicializar la aplicación
async function initApp() {
  try {
    // Inicializar base de datos IndexedDB
    const dbInitialized = await initDatabase();
    if (!dbInitialized) {
      console.error('❌ Error al inicializar la base de datos');
      return;
    }

    // Verificar y migrar localStorage si es necesario
    storage.migrate();

    // Aplicar configuraciones iniciales
    const settings = storage.getSettings();
    
    // Aplicar tema oscuro (siempre activo en esta app)
    document.documentElement.classList.add('dark');
    
    // Aplicar configuraciones de accesibilidad
    if (settings.highContrast) {
      document.documentElement.style.setProperty('--contrast-mode', 'high');
    }
    
    if (settings.fontSize !== 'normal') {
      document.documentElement.classList.add(`font-size-${settings.fontSize}`);
    }
    
    if (settings.density !== 'normal') {
      document.documentElement.classList.add(`density-${settings.density}`);
    }

    // Configurar service worker para PWA (si está soportado)
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado correctamente');
      } catch (error) {
        console.warn('⚠️ Error registrando Service Worker:', error);
      }
    }

    // Configurar notificaciones si están habilitadas
    if (settings.notifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // No pedimos permisos automáticamente, lo haremos cuando el usuario lo active
        console.log('📱 Notificaciones disponibles, esperando activación del usuario');
      }
    }

    console.log('🚀 StudySync Pro inicializado correctamente');
    
  } catch (error) {
    console.error('❌ Error crítico durante la inicialización:', error);
  }
}

// Inicializar y renderizar la aplicación
initApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

// Manejar errores globales
window.addEventListener('error', (event) => {
  console.error('❌ Error global:', event.error);
  // Aquí podríamos enviar el error a un servicio de logging si fuera necesario
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rechazado:', event.reason);
  event.preventDefault();
});

// Detectar si la app se está ejecutando como PWA
window.addEventListener('beforeinstallprompt', (event) => {
  // Prevenir el prompt automático
  event.preventDefault();
  
  // Guardar el evento para mostrarlo después cuando el usuario lo desee
  (window as any).deferredPrompt = event;
  
  // Mostrar indicador de que la app se puede instalar
  const settings = storage.getSettings();
  if (!settings.installPromptShown) {
    console.log('📱 PWA lista para instalar');
    // Aquí podríamos mostrar una notificación discreta
  }
});

// Detectar cuando la PWA se instala
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA instalada correctamente');
  storage.saveSettings({ installPromptShown: true });
});

// Detectar cambios en la conectividad
window.addEventListener('online', () => {
  console.log('🌐 Conexión restaurada');
  // Aquí podríamos sincronizar datos si tuviéramos backend
});

window.addEventListener('offline', () => {
  console.log('📡 Modo offline activado');
  // La app funciona completamente offline, solo informativo
});

// Accesibilidad - Skip link
document.addEventListener('DOMContentLoaded', () => {
  // Crear skip link para accesibilidad
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Saltar al contenido principal';
  skipLink.className = 'skip-link';
  skipLink.setAttribute('tabindex', '0');
  
  document.body.insertBefore(skipLink, document.body.firstChild);
});

// Detectar preferencias de usuario
const mediaQueries = {
  prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
  prefersHighContrast: window.matchMedia('(prefers-contrast: high)'),
  prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)')
};

// Aplicar preferencias automáticamente
Object.entries(mediaQueries).forEach(([key, mediaQuery]) => {
  const handler = (e: MediaQueryListEvent) => {
    switch (key) {
      case 'prefersReducedMotion':
        document.documentElement.classList.toggle('reduce-motion', e.matches);
        break;
      case 'prefersHighContrast':
        document.documentElement.classList.toggle('high-contrast', e.matches);
        break;
    }
  };
  
  // Aplicar estado inicial
  handler({ matches: mediaQuery.matches } as MediaQueryListEvent);
  
  // Escuchar cambios
  mediaQuery.addEventListener('change', handler);
});

// Debug en desarrollo
if (import.meta.env.DEV) {
  console.log('🔧 Modo desarrollo activo');
  
  // Herramientas de debug globales
  (window as any).studysyncDebug = {
    storage,
    clearAllData: () => {
      localStorage.clear();
      indexedDB.deleteDatabase('StudySyncDB');
      location.reload();
    },
    exportData: async () => {
      const { useAppStore } = await import('./lib/store');
      return useAppStore.getState().exportData();
    }
  };
}