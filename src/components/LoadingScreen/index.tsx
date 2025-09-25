import React from 'react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
      <div className="text-center">
        {/* Logo animado */}
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto bg-course-blue rounded-sm flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-dark-text-primary mb-2">
            StudySync Pro v2
          </h1>
          <p className="text-dark-text-muted">
            Inicializando asistente académico...
          </p>
        </div>

        {/* Spinner de carga */}
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-course-blue border-t-transparent"></div>
          <span className="text-dark-text-secondary">Cargando</span>
        </div>

        {/* Indicadores de progreso */}
        <div className="mt-8 space-y-2 max-w-xs mx-auto">
          <LoadingStep completed={true} text="Inicializando base de datos" />
          <LoadingStep completed={true} text="Cargando configuración" />
          <LoadingStep completed={false} text="Preparando interfaz" />
        </div>

        {/* Mensaje de primera vez */}
        <div className="mt-8 text-xs text-dark-text-muted max-w-md mx-auto">
          <p>
            🔒 Todos tus datos se almacenan localmente en tu dispositivo.
            <br />
            No se envía información a servidores externos.
          </p>
        </div>
      </div>
    </div>
  );
}

interface LoadingStepProps {
  completed: boolean;
  text: string;
}

function LoadingStep({ completed, text }: LoadingStepProps) {
  return (
    <div className="flex items-center space-x-3 text-sm">
      <div
        className={`w-4 h-4 rounded-full flex-shrink-0 ${
          completed
            ? 'bg-course-blue'
            : 'border-2 border-dark-border animate-pulse'
        }`}
      >
        {completed && (
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <span
        className={
          completed ? 'text-dark-text-secondary' : 'text-dark-text-muted'
        }
      >
        {text}
      </span>
    </div>
  );
}
