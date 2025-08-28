import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log del error para debugging
    console.error('🔥 Error boundary caught:', error, errorInfo);

    // Aquí podríamos enviar el error a un servicio de logging
    // Por ahora solo lo guardamos en localStorage para debugging
    if (typeof window !== 'undefined') {
      try {
        const errorLog = {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          errorInfo,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        };

        const existingLogs = JSON.parse(
          localStorage.getItem('studysync_error_logs') || '[]'
        );
        existingLogs.push(errorLog);

        // Mantener solo los últimos 10 errores
        const recentLogs = existingLogs.slice(-10);
        localStorage.setItem(
          'studysync_error_logs',
          JSON.stringify(recentLogs)
        );
      } catch (e) {
        console.warn('No se pudo guardar el log de error:', e);
      }
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/dashboard';
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Icono de error */}
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-danger rounded-sm flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-white" />
              </div>
              <h1 className="font-display font-bold text-xl text-dark-text-primary mb-2">
                ¡Oops! Algo salió mal
              </h1>
              <p className="text-dark-text-muted">
                La aplicación encontró un error inesperado
              </p>
            </div>

            {/* Información del error (solo en desarrollo) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-dark-bg-secondary border border-dark-border rounded-sm text-left">
                <h3 className="font-semibold text-danger mb-2">
                  Error Details:
                </h3>
                <pre className="text-xs text-dark-text-muted overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            {/* Acciones */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="btn btn-primary w-full"
              >
                <RefreshCw size={16} />
                Recargar Aplicación
              </button>

              <button onClick={this.handleGoHome} className="btn w-full">
                <Home size={16} />
                Ir al Dashboard
              </button>

              <button
                onClick={this.handleReset}
                className="btn btn-ghost w-full"
              >
                Intentar Continuar
              </button>
            </div>

            {/* Consejos */}
            <div className="mt-8 p-4 bg-dark-bg-tertiary border border-dark-border rounded-sm">
              <h3 className="font-semibold text-dark-text-primary mb-2">
                💡 Consejos para resolver el problema:
              </h3>
              <ul className="text-sm text-dark-text-muted space-y-1 text-left">
                <li>• Recarga la página (Ctrl+R o Cmd+R)</li>
                <li>• Verifica tu conexión a internet</li>
                <li>• Cierra otras pestañas para liberar memoria</li>
                <li>• Si persiste, reinicia tu navegador</li>
              </ul>
            </div>

            {/* Información de soporte */}
            <div className="mt-6 text-xs text-dark-text-muted">
              <p>
                Si el problema persiste, puedes reportarlo con los detalles del
                error.
                <br />
                Todos los datos se mantienen seguros localmente.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para manejar errores en componentes funcionales
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('🔥 Error manejado por hook:', error);

    // Lanzar el error para que sea capturado por ErrorBoundary
    throw error;
  }, []);
}

// Componente para mostrar errores de forma controlada
interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className="bg-danger/10 border border-danger rounded-sm p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle size={20} className="text-danger flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-danger mb-1">Error</h3>
          <p className="text-sm text-dark-text-secondary mb-3">
            {errorMessage}
          </p>

          <div className="flex space-x-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="btn btn-ghost text-xs px-3 py-1"
              >
                <RefreshCw size={14} />
                Reintentar
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="btn btn-ghost text-xs px-3 py-1"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
