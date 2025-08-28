import React from 'react';
import { Book, MessageCircle, Video, Download } from 'lucide-react';

export function Help() {
  return (
    <div className="container-app py-8">
      <div className="page-header">
        <h1 className="text-3xl font-display font-bold text-dark-text-primary">
          Ayuda y Soporte
        </h1>
        <p className="text-dark-text-muted mt-2">
          Aprende a usar StudySync Pro al máximo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Guía de inicio */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Book size={24} className="text-course-blue mr-3" />
            <h3 className="font-semibold text-dark-text-primary">
              Guía de Inicio
            </h3>
          </div>
          <p className="text-dark-text-muted text-sm mb-4">
            Aprende los conceptos básicos para comenzar a usar la aplicación
          </p>
          <ul className="space-y-2 text-sm text-dark-text-secondary">
            <li>• Crear tu primer curso</li>
            <li>• Subir materiales de estudio</li>
            <li>• Configurar el sistema de notas</li>
            <li>• Usar el calendario académico</li>
          </ul>
        </div>

        {/* Preguntas frecuentes */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <MessageCircle size={24} className="text-course-green mr-3" />
            <h3 className="font-semibold text-dark-text-primary">
              Preguntas Frecuentes
            </h3>
          </div>
          <div className="space-y-3 text-sm">
            <details className="group">
              <summary className="cursor-pointer text-dark-text-primary font-medium">
                ¿Los datos están seguros?
              </summary>
              <p className="text-dark-text-muted mt-2 pl-4">
                Sí, todos tus datos se almacenan localmente en tu dispositivo.
                No se envía información a servidores externos.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer text-dark-text-primary font-medium">
                ¿Funciona sin internet?
              </summary>
              <p className="text-dark-text-muted mt-2 pl-4">
                Completamente. StudySync Pro está diseñado para funcionar
                offline.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer text-dark-text-primary font-medium">
                ¿Cómo funciona la IA?
              </summary>
              <p className="text-dark-text-muted mt-2 pl-4">
                Ofrecemos opciones gratuitas de IA local que funcionan en tu
                navegador.
              </p>
            </details>
          </div>
        </div>

        {/* Tutoriales */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Video size={24} className="text-course-purple mr-3" />
            <h3 className="font-semibold text-dark-text-primary">
              Tutoriales en Video
            </h3>
          </div>
          <p className="text-dark-text-muted text-sm mb-4">
            Próximamente disponibles tutoriales paso a paso
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-dark-bg-tertiary rounded-sm">
              <div className="text-sm font-medium text-dark-text-primary">
                Configuración Inicial
              </div>
              <div className="text-xs text-dark-text-muted">5 min</div>
            </div>
            <div className="p-3 bg-dark-bg-tertiary rounded-sm">
              <div className="text-sm font-medium text-dark-text-primary">
                Gestión de Archivos
              </div>
              <div className="text-xs text-dark-text-muted">8 min</div>
            </div>
          </div>
        </div>
      </div>

      {/* Atajos de teclado */}
      <div className="card p-6 mt-8">
        <h2 className="text-xl font-semibold text-dark-text-primary mb-6">
          Atajos de Teclado
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-dark-text-primary mb-3">
              Navegación
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Comando rápido</span>
                <kbd className="px-2 py-1 bg-dark-bg-tertiary rounded text-xs">
                  Ctrl+K
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Dashboard</span>
                <kbd className="px-2 py-1 bg-dark-bg-tertiary rounded text-xs">
                  Ctrl+1
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Calendario</span>
                <kbd className="px-2 py-1 bg-dark-bg-tertiary rounded text-xs">
                  Ctrl+2
                </kbd>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-dark-text-primary mb-3">
              Acciones
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Nuevo curso</span>
                <kbd className="px-2 py-1 bg-dark-bg-tertiary rounded text-xs">
                  Ctrl+Shift+C
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Nueva nota</span>
                <kbd className="px-2 py-1 bg-dark-bg-tertiary rounded text-xs">
                  Ctrl+Shift+N
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Subir archivo</span>
                <kbd className="px-2 py-1 bg-dark-bg-tertiary rounded text-xs">
                  Ctrl+U
                </kbd>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-dark-text-primary mb-3">
              Modo Focus
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Iniciar/Pausar</span>
                <kbd className="px-2 py-1 bg-dark-bg-tertiary rounded text-xs">
                  Espacio
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">
                  Nueva nota rápida
                </span>
                <kbd className="px-2 py-1 bg-dark-bg-tertiary rounded text-xs">
                  N
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Salir</span>
                <kbd className="px-2 py-1 bg-dark-bg-tertiary rounded text-xs">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
