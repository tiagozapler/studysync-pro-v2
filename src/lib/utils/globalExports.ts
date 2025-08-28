// Utilidades para exportación global
// Este archivo se encarga de exportar React y el store al scope global de manera robusta

import React from 'react';
import { useAppStore } from '../store';

// Función para exportar React al scope global
export const exportReactGlobally = () => {
  if (typeof window !== 'undefined') {
    try {
      // Exportar React al scope global
      (window as any).React = React;

      // Exportar también ReactDOM para debugging
      if (ReactDOM) {
        (window as any).ReactDOM = ReactDOM;
      }

      // Exportar hooks comunes de React para debugging
      (window as any).ReactHooks = {
        useState: React.useState,
        useEffect: React.useEffect,
        useContext: React.useContext,
        useReducer: React.useReducer,
        useCallback: React.useCallback,
        useMemo: React.useMemo,
        useRef: React.useRef,
      };

      console.log('✅ React exportado al scope global de manera robusta');
      return true;
    } catch (error) {
      console.error('❌ Error exportando React globalmente:', error);
      return false;
    }
  }
  return false;
};

// Función para exportar el store al scope global
export const exportStoreGlobally = () => {
  if (typeof window !== 'undefined') {
    try {
      // Verificar que useAppStore esté disponible
      if (typeof useAppStore === 'undefined') {
        console.warn('⚠️ useAppStore no está disponible aún');
        return false;
      }

      // Verificar que useAppStore sea una función
      if (typeof useAppStore !== 'function') {
        console.error('❌ useAppStore no es una función:', typeof useAppStore);
        return false;
      }

      // Exportar el store completo
      (window as any).appStore = useAppStore;

      // Exportar acciones específicas
      (window as any).appStoreActions = {
        addCourse: (courseData: any) =>
          useAppStore.getState().addCourse(courseData),
        switchToSupabase: () => useAppStore.getState().switchToSupabase(),
        switchToIndexedDB: () => useAppStore.getState().switchToIndexedDB(),
        checkSupabaseConnection: () =>
          useAppStore.getState().checkSupabaseConnection(),
        getState: () => useAppStore.getState(),
      };

      // Exportar también como store directo
      (window as any).store = useAppStore;
      (window as any).storeInstance = useAppStore.getState();

      console.log('✅ Store exportado globalmente de manera robusta');
      return true;
    } catch (error) {
      console.error('❌ Error exportando store globalmente:', error);
      return false;
    }
  }
  return false;
};

// Función para exportar todo globalmente
export const exportAllGlobally = () => {
  const reactExported = exportReactGlobally();
  const storeExported = exportStoreGlobally();

  if (reactExported && storeExported) {
    console.log('🎯 Todo exportado globalmente exitosamente');
    return true;
  } else {
    console.error('❌ Error exportando globalmente');
    return false;
  }
};

// Exportar automáticamente cuando se importe este módulo
if (typeof window !== 'undefined') {
  // Exportar React inmediatamente
  exportReactGlobally();

  // Exportar store después de un delay
  setTimeout(() => {
    exportStoreGlobally();
  }, 100);

  // También exportar después de más tiempo para asegurar que funcione
  setTimeout(() => {
    exportAllGlobally();
  }, 500);

  // Exportar también después de que la página esté completamente cargada
  window.addEventListener('load', () => {
    setTimeout(() => {
      exportAllGlobally();
    }, 1000);
  });

  // Exportar también cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        exportAllGlobally();
      }, 500);
    });
  } else {
    // DOM ya está listo
    setTimeout(() => {
      exportAllGlobally();
    }, 500);
  }
}
