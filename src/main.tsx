import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';
import { validateEnv } from './lib/config/env';
import { useAppStore } from './lib/store';
import { ConvexProvider } from 'convex/react';
import { convex } from './lib/convex/client';
import './lib/utils/globalExports'; // opcional

// Persistencia aquí - Inicializar la aplicación
async function initApp() {
  try {
    // Validar variables de entorno
    validateEnv();

    // 🔎 Debug: Convex está listo
    console.log('🔧 Convex cliente inicializado');

    // Inicializar el store global
    console.log('🔄 Inicializando store global...');
    await useAppStore.getState().initialize();
    console.log('✅ Store global inicializado correctamente');

    // Aplicar tema oscuro (siempre activo en esta app)
    document.documentElement.classList.add('dark');

    // Configurar service worker para PWA (si está soportado)
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado correctamente');
      } catch (error) {
        console.warn('⚠️ Error registrando Service Worker:', error);
      }
    }

    console.log('🚀 StudySync Pro v2 inicializado correctamente');
  } catch (error) {
    console.error('❌ Error crítico durante la inicialización:', error);
  }
}

// Inicializar y renderizar la aplicación
initApp().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </React.StrictMode>
  );

  // Exponer React y utilidades al window (DEV) - DESPUÉS del render
  if (typeof window !== 'undefined') {
    // React
    (window as any).React = React;
    (window as any).ReactDOM = ReactDOM;
    (window as any).ReactHooks = {
      useState: React.useState,
      useEffect: React.useEffect,
      useContext: React.useContext,
      useReducer: React.useReducer,
      useCallback: React.useCallback,
      useMemo: React.useMemo,
      useRef: React.useRef,
    };

    // Store (hook y acceso directo a estado/acciones)
    (window as any).appStore = useAppStore;
    (window as any).getAppState = () => useAppStore.getState();
    (window as any).appStoreActions = {
      addCourse: (courseData: any) =>
        useAppStore.getState().addCourse(courseData),
      initialize: () => useAppStore.getState().initialize(),
      getState: () => useAppStore.getState(),
    };

    console.log('✅ React y appStore expuestos en window (post-render)');
  }

  // HMR re-exposición
  if ((import.meta as any).hot) {
    (import.meta as any).hot.accept(() => {
      (window as any).appStore = useAppStore;
      (window as any).getAppState = () => useAppStore.getState();
      console.log('HMR: re-expuesto en main.tsx');
    });
  }
});

// Manejar errores globales
window.addEventListener('error', event => {
  console.error('❌ Error global:', event.error);
  // Aquí podríamos enviar el error a un servicio de logging si fuera necesario
});

window.addEventListener('unhandledrejection', event => {
  console.error('❌ Promise rechazado:', event.reason);
  event.preventDefault();
});

// Detectar si la app se está ejecutando como PWA
window.addEventListener('beforeinstallprompt', event => {
  // Prevenir el prompt automático
  event.preventDefault();

  // Guardar el evento para mostrarlo después cuando el usuario lo desee
  (window as any).deferredPrompt = event;

  // Mostrar indicador de que la app se puede instalar
  console.log('📱 PWA lista para instalar');
});

// Detectar cuando la PWA se instala
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA instalada correctamente');
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
  prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)'),
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
    clearAllData: () => {
      localStorage.clear();
      indexedDB.deleteDatabase('StudySyncDB');
      location.reload();
    },
  };
}
