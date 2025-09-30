import React from 'react';
import { Save } from 'lucide-react';
import { useAppStore } from '../../lib/store';

export function Settings() {
  const { settings, updateSettings } = useAppStore();
  const setAccent = (accent: 'cyan' | 'purple' | 'lime') => {
    updateSettings({ accentColor: accent });
    try {
      document.documentElement.setAttribute('data-accent', accent);
    } catch {}
  };
  return (
    <div className="container-app py-8">
      <div className="page-header">
        <h1 className="text-3xl font-display font-bold text-dark-text-primary">
          Configuración
        </h1>
        <p className="text-dark-text-muted mt-2">
          Personaliza tu experiencia en StudySync Pro
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuración principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Apariencia */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-dark-text-primary mb-4">
              Apariencia
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Color de acento (Tron)
                </label>
                <div className="flex gap-3">
                  {([
                    { id: 'cyan', className: 'bg-neon-cyan' },
                    { id: 'purple', className: 'bg-neon-purple' },
                    { id: 'lime', className: 'bg-neon-lime' },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setAccent(opt.id)}
                      className={`w-9 h-9 rounded-full border ${opt.className} ${
                        settings.accentColor === opt.id
                          ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-dark-bg-secondary'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      title={opt.id}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Densidad de la interfaz
                </label>
                <select className="input">
                  <option value="compact">Compacta</option>
                  <option value="normal" selected>
                    Normal
                  </option>
                  <option value="comfortable">Cómoda</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Tamaño de fuente
                </label>
                <select className="input">
                  <option value="small">Pequeña</option>
                  <option value="normal" selected>
                    Normal
                  </option>
                  <option value="large">Grande</option>
                </select>
              </div>
            </div>
          </div>

          {/* IA */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-dark-text-primary mb-4">
              Asistente IA
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Configuración de Groq
                </label>
                <p className="text-sm text-dark-text-muted mb-3">
                  El asistente utiliza Groq para proporcionar respuestas rápidas y precisas.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    Configura tu clave de Groq en la sección del asistente de cada curso para comenzar a usar la IA.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-dark-text-primary mb-4">
              Sistema de Notas
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Nota mínima para aprobar
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  defaultValue="11"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Escala de calificación
                </label>
                <select className="input">
                  <option value="20" selected>
                    Vigesimal (0-20)
                  </option>
                  <option value="100">Porcentual (0-100)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Acciones */}
          <div className="card p-6">
            <h3 className="font-semibold text-dark-text-primary mb-4">
              Acciones
            </h3>
            <div className="space-y-2">
              <button className="btn w-full justify-start">
                <Save size={16} />
                Exportar Datos
              </button>
              <button className="btn w-full justify-start">Importar Datos</button>
              <button className="btn btn-danger w-full justify-start">
                Limpiar Todos los Datos
              </button>
            </div>
          </div>

          {/* Información */}
          <div className="card p-6">
            <h3 className="font-semibold text-dark-text-primary mb-4">
              Información
            </h3>
            <div className="space-y-2 text-sm text-dark-text-muted">
              <div>Versión: 2.0.0</div>
              <div>Modo: Offline</div>
              <div>Almacenamiento: Local</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
