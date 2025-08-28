import React from 'react';
import {
  Search,
  Command,
  Plus,
  Calendar,
  FileText,
  Settings,
  Home,
  Focus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { cn } from '../../lib/utils';

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  action: () => void;
  keywords: string[];
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { toggleModal, courses } = useAppStore();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Generar comandos disponibles
  const commands: Command[] = React.useMemo(() => {
    const baseCommands: Command[] = [
      // Navegación
      {
        id: 'nav-dashboard',
        title: 'Ir al Dashboard',
        icon: Home,
        action: () => {
          navigate('/dashboard');
          toggleModal('commandPalette');
        },
        keywords: ['dashboard', 'inicio', 'home', 'principal'],
      },
      {
        id: 'nav-calendar',
        title: 'Ir al Calendario',
        icon: Calendar,
        action: () => {
          navigate('/calendar');
          toggleModal('commandPalette');
        },
        keywords: ['calendario', 'calendar', 'eventos', 'fechas'],
      },
      {
        id: 'nav-notes',
        title: 'Ir a Notas Rápidas',
        icon: FileText,
        action: () => {
          navigate('/notes');
          toggleModal('commandPalette');
        },
        keywords: ['notas', 'notes', 'rapidas', 'apuntes'],
      },
      {
        id: 'nav-search',
        title: 'Ir a Búsqueda',
        icon: Search,
        action: () => {
          navigate('/search');
          toggleModal('commandPalette');
        },
        keywords: ['buscar', 'search', 'encontrar'],
      },
      {
        id: 'nav-focus',
        title: 'Ir a Modo Focus',
        icon: Focus,
        action: () => {
          navigate('/focus');
          toggleModal('commandPalette');
        },
        keywords: ['focus', 'concentración', 'pomodoro', 'estudiar'],
      },
      {
        id: 'nav-settings',
        title: 'Ir a Configuración',
        icon: Settings,
        action: () => {
          navigate('/settings');
          toggleModal('commandPalette');
        },
        keywords: ['configuración', 'settings', 'ajustes', 'config'],
      },

      // Acciones
      {
        id: 'action-new-course',
        title: 'Agregar Nuevo Curso',
        icon: Plus,
        action: () => {
          toggleModal('commandPalette');
          toggleModal('courseModal');
        },
        keywords: ['curso', 'nuevo', 'agregar', 'crear', 'course'],
      },
      {
        id: 'action-new-note',
        title: 'Nueva Nota Rápida',
        icon: FileText,
        action: () => {
          toggleModal('commandPalette');
          toggleModal('quickNoteModal');
        },
        keywords: ['nota', 'rápida', 'nueva', 'apunte', 'note'],
      },
      {
        id: 'action-new-event',
        title: 'Agregar Evento',
        icon: Calendar,
        action: () => {
          toggleModal('commandPalette');
          toggleModal('eventModal');
        },
        keywords: ['evento', 'calendar', 'fecha', 'recordatorio'],
      },
    ];

    // Agregar comandos para cada curso
    const courseCommands: Command[] = courses.map(course => ({
      id: `course-${course.id}`,
      title: `Ir a ${course.name}`,
      subtitle: course.teacher,
      icon: () => (
        <div
          className="w-4 h-4 rounded-sm"
          style={{ backgroundColor: course.color }}
        />
      ),
      action: () => {
        navigate(`/course/${course.id}`);
        toggleModal('commandPalette');
      },
      keywords: [
        course.name.toLowerCase(),
        course.teacher?.toLowerCase() || '',
        'curso',
        'course',
      ],
    }));

    return [...baseCommands, ...courseCommands];
  }, [navigate, toggleModal, courses]);

  // Filtrar comandos por query
  const filteredCommands = React.useMemo(() => {
    if (!query.trim()) return commands.slice(0, 8); // Mostrar solo los primeros 8 por defecto

    const queryLower = query.toLowerCase();
    return commands.filter(
      command =>
        command.title.toLowerCase().includes(queryLower) ||
        command.subtitle?.toLowerCase().includes(queryLower) ||
        command.keywords.some(keyword => keyword.includes(queryLower))
    );
  }, [commands, query]);

  // Manejar navegación con teclado
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          toggleModal('commandPalette');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, toggleModal]);

  // Reset selected index cuando cambia la query
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus en el input al abrir
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="modal-backdrop"
      onClick={() => toggleModal('commandPalette')}
    >
      <div
        className="max-w-lg w-full mx-auto mt-20"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-dark-bg-secondary border border-dark-border rounded-sm shadow-modal overflow-hidden">
          {/* Search input */}
          <div className="flex items-center px-4 py-3 border-b border-dark-border">
            <Search size={20} className="text-dark-text-muted mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar comandos..."
              className="flex-1 bg-transparent text-dark-text-primary placeholder-dark-text-muted outline-none"
            />
            <div className="flex items-center space-x-1 text-xs text-dark-text-muted">
              <kbd className="px-1.5 py-0.5 bg-dark-bg-tertiary rounded text-xs">
                ↑↓
              </kbd>
              <span>navegar</span>
              <kbd className="px-1.5 py-0.5 bg-dark-bg-tertiary rounded text-xs">
                ↵
              </kbd>
              <span>seleccionar</span>
            </div>
          </div>

          {/* Commands list */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-dark-text-muted">
                <Search size={32} className="mx-auto mb-2 opacity-50" />
                <p>No se encontraron comandos</p>
                <p className="text-sm mt-1">Intenta con otros términos</p>
              </div>
            ) : (
              filteredCommands.map((command, index) => {
                const Icon = command.icon;
                return (
                  <button
                    key={command.id}
                    onClick={command.action}
                    className={cn(
                      'w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors',
                      index === selectedIndex
                        ? 'bg-course-blue/20 border-r-2 border-course-blue'
                        : 'hover:bg-dark-bg-tertiary'
                    )}
                  >
                    <Icon
                      size={20}
                      className="text-dark-text-muted flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-dark-text-primary">
                        {command.title}
                      </div>
                      {command.subtitle && (
                        <div className="text-sm text-dark-text-muted truncate">
                          {command.subtitle}
                        </div>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <Command size={16} className="text-dark-text-muted" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-dark-border bg-dark-bg-tertiary">
            <div className="flex items-center justify-between text-xs text-dark-text-muted">
              <span>Comando Rápido</span>
              <div className="flex items-center space-x-2">
                <span>Presiona</span>
                <kbd className="px-1.5 py-0.5 bg-dark-bg-secondary rounded">
                  Esc
                </kbd>
                <span>para cerrar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
