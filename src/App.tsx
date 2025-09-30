import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Stores y hooks
import { useAppStore } from './lib/store';

// Componentes de layout
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

// Páginas (lazy loading para mejor rendimiento)
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() =>
  import('./pages/Dashboard').then(m => ({ default: m.Dashboard }))
);
const Course = React.lazy(() =>
  import('./pages/Course').then(m => ({ default: m.Course }))
);
const Calendar = React.lazy(() =>
  import('./pages/Calendar').then(m => ({ default: m.Calendar }))
);
const Notes = React.lazy(() =>
  import('./pages/Notes').then(m => ({ default: m.Notes }))
);
const Search = React.lazy(() =>
  import('./pages/Search').then(m => ({ default: m.Search }))
);
const Settings = React.lazy(() =>
  import('./pages/Settings').then(m => ({ default: m.Settings }))
);
const Help = React.lazy(() =>
  import('./pages/Help').then(m => ({ default: m.Help }))
);
const Focus = React.lazy(() =>
  import('./pages/Focus').then(m => ({ default: m.Focus }))
);
const Chat = React.lazy(() =>
  import('./features/ai/pages/Chat').then(m => ({ default: m.Chat }))
);

// Modales globales
import { CourseModal } from './features/courses/components/CourseModal';
import { FileModal } from './features/files/components/FileModal';
import { NoteModal } from './features/notes/components/NoteModal';
import { EventModal } from './features/calendar/components/EventModal';
import { TodoModal } from './features/todos/components/TodoModal';
import { QuickNoteModal } from './features/notes/components/QuickNoteModal';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingTour } from './components/OnboardingTour';

export function App() {
  const { isLoading, isInitialized, initialize, settings, modals, focusMode } =
    useAppStore();

  // Inicializar la aplicación
  useEffect(() => {
    const initTimeout = setTimeout(() => {
      console.warn('⚠️ Timeout de inicialización, forzando estado inicial');
      // @ts-ignore - setInitialized no existe en el store actual
      (useAppStore.getState() as any).setInitialized?.(true);
    }, 10000); // 10 segundos de timeout

    initialize().finally(() => {
      clearTimeout(initTimeout);
    });

    return () => clearTimeout(initTimeout);
  }, [initialize]);

  // Verificar autenticación y redirigir si es necesario
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getCurrentUser } = await import('./lib/auth/simple');
        const { user } = await getCurrentUser();
        
        if (!user && window.location.pathname !== '/login') {
          // Si no hay usuario autenticado y no está en login, redirigir
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        // En caso de error, redirigir a login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    };

    if (isInitialized) {
      checkAuth();
    }
  }, [isInitialized]);

  // Keyboard shortcuts globales
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command Palette (Ctrl/Cmd + K)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        useAppStore.getState().toggleModal('commandPalette');
        return;
      }

      // Navegación rápida
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            window.location.hash = '#/dashboard';
            break;
          case '2':
            event.preventDefault();
            window.location.hash = '#/calendar';
            break;
          case '3':
            event.preventDefault();
            window.location.hash = '#/notes';
            break;
          case '/':
            event.preventDefault();
            window.location.hash = '#/search';
            break;
        }
      }

      // Focus mode shortcuts (solo cuando está activo)
      if (focusMode.active) {
        switch (event.key) {
          case ' ':
            if (event.target === document.body) {
              event.preventDefault();
              if (focusMode.pomodoroActive) {
                useAppStore.getState().pausePomodoro();
              } else {
                useAppStore.getState().startPomodoro();
              }
            }
            break;
          case 'Escape':
            event.preventDefault();
            useAppStore.getState().exitFocusMode();
            break;
          case 'n':
            if (event.target === document.body) {
              event.preventDefault();
              useAppStore.getState().toggleModal('quickNoteModal');
            }
            break;
        }
      }

      // Escape para cerrar modales
      if (event.key === 'Escape') {
        const openModals = Object.entries(modals).filter(
          ([, isOpen]) => isOpen
        );
        if (openModals.length > 0) {
          const lastModal = openModals[openModals.length - 1]?.[0];
          useAppStore
            .getState()
            .setModal(lastModal as keyof typeof modals, false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modals, focusMode.active, focusMode.pomodoroActive]);

  // Mostrar pantalla de carga mientras se inicializa
  if (isLoading || !isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-dark-bg-primary text-dark-text-primary">
          {/* Skip link para accesibilidad */}
          <a href="#main-content" className="skip-link" tabIndex={0}>
            Saltar al contenido principal
          </a>

          {/* Layout principal */}
          <Layout>
            <RoutedContent />
          </Layout>

          {/* Modales globales */}
          {modals.courseModal && <CourseModal />}
          {modals.fileModal && <FileModal />}
          {modals.noteModal && <NoteModal />}
          {modals.eventModal && <EventModal />}
          {modals.todoModal && <TodoModal />}
          {modals.quickNoteModal && <QuickNoteModal />}
          {modals.settingsModal && <SettingsModal />}
          {modals.commandPalette && <CommandPalette />}

          {/* Onboarding tour */}
          {modals.onboarding && !settings.onboardingCompleted && (
            <OnboardingTour />
          )}

          {/* Toast notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              className: 'toast-custom',
              style: {
                background: '#1F2937',
                color: '#F9FAFB',
                border: '1px solid #2B3442',
                borderRadius: '4px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              },
              success: {
                className: 'toast-success',
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                className: 'toast-error',
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#3B82F6',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />

          {/* Indicador de modo focus */}
          {focusMode.active && (
            <div className="fixed top-4 right-4 z-50 bg-course-blue text-white px-4 py-2 rounded-sm shadow-modal">
              <div className="flex items-center gap-2">
                <span className="animate-pulse">🎯</span>
                <span className="font-semibold">Modo Focus</span>
                {focusMode.pomodoroActive && (
                  <span className="text-sm">
                    {Math.floor(focusMode.pomodoroTime / 60)}:
                    {(focusMode.pomodoroTime % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Indicador de estado offline (solo en producción) */}
          {import.meta.env.PROD && <OfflineIndicator />}
        </div>
      </Router>
    </ErrorBoundary>
  );
}

// Componente para mostrar estado offline
function OfflineIndicator() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-warning text-dark-bg-primary px-4 py-2 rounded-sm shadow-modal">
      <div className="flex items-center gap-2">
        <span>📡</span>
        <span className="font-semibold">Modo Offline</span>
      </div>
    </div>
  );
}

function RoutedContent() {
  const location = useLocation();
  return (
    <main id="main-content" tabIndex={-1} className="relative">
      <React.Suspense fallback={<LoadingScreen />}>
        <div key={location.pathname} className="animate-fade-in">
          <Routes location={location}>
            {/* Ruta de login (pública) */}
            <Route path="/login" element={<Login />} />

            {/* Ruta principal - redirigir a login si no está autenticado */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Rutas protegidas - requieren autenticación */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Curso específico */}
            <Route path="/course/:courseId" element={<Course />} />
            <Route path="/course/:courseId/:section" element={<Course />} />

            {/* Páginas principales */}
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />

            {/* Focus mode */}
            <Route path="/focus" element={<Focus />} />
            <Route path="/focus/:courseId" element={<Focus />} />

            {/* Chat con IA */}
            <Route path="/chat" element={<Chat />} />

            {/* 404 - Redirigir al dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </React.Suspense>
    </main>
  );
}

export default App;
