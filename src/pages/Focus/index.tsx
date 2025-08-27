import React from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../lib/store';

export function Focus() {
  const { focusMode, startFocusMode, exitFocusMode, startPomodoro, pausePomodoro, resetPomodoro } = useAppStore();

  React.useEffect(() => {
    if (!focusMode.active) {
      startFocusMode();
    }
  }, [focusMode.active, startFocusMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-dark-bg-primary text-dark-text-primary">
      {/* Header mínimo */}
      <header className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-xl">Modo Focus</h1>
          <Link to="/dashboard" onClick={exitFocusMode} className="btn btn-ghost">
            <X size={16} />
            Salir
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="container-app py-12">
        <div className="max-w-md mx-auto text-center">
          {/* Timer */}
          <div className="mb-12">
            <div className="text-6xl font-bold font-display mb-4">
              {formatTime(focusMode.pomodoroTime)}
            </div>
            <div className="text-dark-text-muted">
              Sesión de concentración
            </div>
          </div>

          {/* Controles */}
          <div className="flex justify-center space-x-4 mb-12">
            <button
              onClick={focusMode.pomodoroActive ? pausePomodoro : startPomodoro}
              className="btn btn-primary w-16 h-16 rounded-full"
            >
              {focusMode.pomodoroActive ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={resetPomodoro}
              className="btn w-16 h-16 rounded-full"
            >
              <RotateCcw size={24} />
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="card p-4">
              <div className="text-2xl font-bold text-dark-text-primary">
                {focusMode.sessions}
              </div>
              <div className="text-sm text-dark-text-muted">Sesiones hoy</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-dark-text-primary">
                25
              </div>
              <div className="text-sm text-dark-text-muted">Minutos por sesión</div>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="text-sm text-dark-text-muted space-y-2">
            <p><kbd className="px-2 py-1 bg-dark-bg-tertiary rounded">Espacio</kbd> - Iniciar/Pausar</p>
            <p><kbd className="px-2 py-1 bg-dark-bg-tertiary rounded">N</kbd> - Nueva nota rápida</p>
            <p><kbd className="px-2 py-1 bg-dark-bg-tertiary rounded">Esc</kbd> - Salir del modo focus</p>
          </div>
        </div>
      </div>
    </div>
  );
}
