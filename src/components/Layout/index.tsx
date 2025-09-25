import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Home,
  Calendar,
  FileText,
  Search,
  Settings,
  HelpCircle,
  Focus,
  Menu,
  X,
  MessageSquare,
} from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { cn } from '../../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { focusMode, toggleModal } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // No mostrar sidebar en modo focus
  if (focusMode.active) {
    return <div className="min-h-screen bg-dark-bg-primary">{children}</div>;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Calendario', href: '/calendar', icon: Calendar },
    { name: 'Notas Rápidas', href: '/notes', icon: FileText },
    { name: 'Chat IA', href: '/chat', icon: MessageSquare },
    { name: 'Buscar', href: '/search', icon: Search },
    { name: 'Focus', href: '/focus', icon: Focus },
  ];

  const secondaryNavigation = [
    { name: 'Configuración', href: '/settings', icon: Settings },
    { name: 'Ayuda', href: '/help', icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen bg-dark-bg-primary">
      {/* Sidebar para móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-dark-bg-secondary border-r border-dark-border">
            <SidebarContent
              navigation={navigation}
              secondaryNavigation={secondaryNavigation}
              currentPath={location.pathname}
              onItemClick={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 bg-dark-bg-secondary border-r border-dark-border">
          <SidebarContent
            navigation={navigation}
            secondaryNavigation={secondaryNavigation}
            currentPath={location.pathname}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header móvil */}
        <header className="lg:hidden bg-dark-bg-secondary border-b border-dark-border px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-sm text-dark-text-secondary hover:bg-dark-bg-tertiary hover:text-dark-text-primary transition-colors"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>

            <h1 className="font-display font-bold text-lg text-dark-text-primary">
              StudySync Pro v2
            </h1>

            <button
              onClick={() => toggleModal('commandPalette')}
              className="p-2 rounded-sm text-dark-text-secondary hover:bg-dark-bg-tertiary hover:text-dark-text-primary transition-colors"
              aria-label="Abrir comando rápido"
            >
              <Search size={20} />
            </button>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto bg-dark-bg-primary">
          {children}
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  navigation: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<any>;
  }>;
  secondaryNavigation: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<any>;
  }>;
  currentPath: string;
  onItemClick?: () => void;
}

function SidebarContent({
  navigation,
  secondaryNavigation,
  currentPath,
  onItemClick,
}: SidebarContentProps) {
  const { toggleModal } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-dark-border">
        <h1 className="font-display font-bold text-xl text-dark-text-primary">
          StudySync Pro
        </h1>
        <p className="text-sm text-dark-text-muted mt-1">Asistente Académico</p>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map(item => {
          const Icon = item.icon;
          const isActive =
            currentPath === item.href ||
            (item.href === '/course' && currentPath.startsWith('/course'));

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={cn('nav-item', isActive && 'active')}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}

        {/* Separador */}
        <div className="border-t border-dark-border my-4" />

        {/* Acciones rápidas */}
        <div className="space-y-2">
          <button
            onClick={() => {
              toggleModal('commandPalette');
              onItemClick?.();
            }}
            className="nav-item w-full text-left"
          >
            <Search size={20} />
            Comando Rápido
            <span className="ml-auto text-xs text-dark-text-muted">⌘K</span>
          </button>
        </div>
      </nav>

      {/* Navegación secundaria */}
      <nav className="px-4 py-4 border-t border-dark-border space-y-2">
        {secondaryNavigation.map(item => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={cn('nav-item', isActive && 'active')}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Información del usuario/versión */}
      <div className="px-4 py-3 border-t border-dark-border">
        <div className="text-xs text-dark-text-muted">
          <div>Versión 2.0.0</div>
          <div className="mt-1">Funcionando offline</div>
        </div>
      </div>
    </div>
  );
}
