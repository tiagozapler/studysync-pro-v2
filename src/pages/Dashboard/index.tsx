import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  Target,
  Users,
  Award,
} from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { cn, dateUtils } from '../../lib/utils';

export function Dashboard() {
  const { courses, files, notes, events, todos, toggleModal, settings } =
    useAppStore();

  // Calcular estadísticas
  const stats = React.useMemo(() => {
    const activeCourses = courses.filter(c => !c.archived);
    const totalFiles = Object.values(files).reduce(
      (acc, courseFiles) => acc + courseFiles.length,
      0
    );
    const allNotes = Object.values(notes).flat();
    const pendingTodos = Object.values(todos)
      .flat()
      .filter(todo => !todo.done);

    // Calcular promedio general
    const courseAverages = activeCourses
      .map(course => {
        const courseNotes = notes[course.id] || [];
        if (courseNotes.length === 0) return null;

        const totalWeighted = courseNotes.reduce(
          (sum, note) => sum + note.value * note.weight,
          0
        );
        const totalWeight = courseNotes.reduce(
          (sum, note) => sum + note.weight,
          0
        );

        return totalWeight > 0 ? totalWeighted / totalWeight : 0;
      })
      .filter(avg => avg !== null);

    const overallAverage =
      courseAverages.length > 0
        ? courseAverages.reduce((sum, avg) => sum + avg, 0) /
          courseAverages.length
        : 0;

    // Próximos eventos
    const upcomingEvents = events
      .filter(event => new Date(event.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    return {
      activeCourses: activeCourses.length,
      totalFiles,
      totalNotes: allNotes.length,
      pendingTodos: pendingTodos.length,
      overallAverage,
      upcomingEvents,
    };
  }, [courses, files, notes, events, todos]);

  return (
    <div className="container-app py-8">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-dark-text-primary">
              Dashboard Académico
            </h1>
            <p className="text-dark-text-muted mt-2">
              Gestiona tus cursos y mantén el control de tu progreso académico
            </p>
          </div>

          <button
            onClick={() => toggleModal('courseModal')}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Agregar Curso
          </button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Cursos Activos"
          value={stats.activeCourses}
          icon={BookOpen}
          color="text-course-blue"
          bgColor="bg-course-blue/10"
        />
        <StatCard
          title="Archivos Subidos"
          value={stats.totalFiles}
          icon={FileText}
          color="text-course-green"
          bgColor="bg-course-green/10"
        />
        <StatCard
          title="Promedio General"
          value={stats.overallAverage.toFixed(1)}
          icon={TrendingUp}
          color={
            stats.overallAverage >= settings.passingGrade
              ? 'text-course-green'
              : 'text-course-red'
          }
          bgColor={
            stats.overallAverage >= settings.passingGrade
              ? 'bg-course-green/10'
              : 'bg-course-red/10'
          }
          suffix="/20"
        />
        <StatCard
          title="Tareas Pendientes"
          value={stats.pendingTodos}
          icon={Target}
          color="text-course-yellow"
          bgColor="bg-course-yellow/10"
        />
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cursos */}
        <div className="lg:col-span-2">
          <div className="section-header">
            <h2 className="text-xl font-display font-bold text-dark-text-primary">
              Mis Cursos
            </h2>
            <Link to="/calendar" className="btn btn-ghost text-sm">
              <Calendar size={16} />
              Ver Calendario
            </Link>
          </div>

          {courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No tienes cursos aún"
              description="Comienza agregando tu primer curso para organizar tus materiales de estudio"
              actionLabel="Agregar Curso"
              onAction={() => toggleModal('courseModal')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses
                .filter(c => !c.archived)
                .map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Próximos eventos */}
          <div className="card p-6">
            <h3 className="font-semibold text-dark-text-primary mb-4 flex items-center">
              <Clock size={20} className="mr-2" />
              Próximos Eventos
            </h3>

            {stats.upcomingEvents.length === 0 ? (
              <p className="text-dark-text-muted text-sm">
                No hay eventos próximos
              </p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    className="flex items-center space-x-3 p-2 rounded-sm hover:bg-dark-bg-tertiary"
                  >
                    <div className="w-2 h-2 rounded-full bg-course-blue"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-text-primary truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-dark-text-muted">
                        {dateUtils.formatRelative(new Date(event.date))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link to="/calendar" className="btn btn-ghost w-full mt-4 text-sm">
              Ver todos los eventos
            </Link>
          </div>

          {/* Progreso semanal */}
          <div className="card p-6">
            <h3 className="font-semibold text-dark-text-primary mb-4 flex items-center">
              <Award size={20} className="mr-2" />
              Progreso Semanal
            </h3>

            <div className="space-y-4">
              <ProgressItem
                label="Archivos subidos"
                current={5}
                target={10}
                color="bg-course-blue"
              />
              <ProgressItem
                label="Tareas completadas"
                current={3}
                target={8}
                color="bg-course-green"
              />
              <ProgressItem
                label="Sesiones de estudio"
                current={7}
                target={15}
                color="bg-course-purple"
              />
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="card p-6">
            <h3 className="font-semibold text-dark-text-primary mb-4">
              Acciones Rápidas
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => toggleModal('quickNoteModal')}
                className="btn btn-ghost w-full justify-start text-sm"
              >
                <Plus size={16} />
                Nueva Nota Rápida
              </button>
              <Link
                to="/focus"
                className="btn btn-ghost w-full justify-start text-sm"
              >
                <Target size={16} />
                Modo Focus
              </Link>
              <button
                onClick={() => toggleModal('eventModal')}
                className="btn btn-ghost w-full justify-start text-sm"
              >
                <Calendar size={16} />
                Agregar Evento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  suffix?: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  suffix,
}: StatCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={cn('p-3 rounded-sm', bgColor)}>
          <Icon size={24} className={color} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-dark-text-muted">{title}</p>
          <p className="text-2xl font-bold text-dark-text-primary">
            {value}
            {suffix}
          </p>
        </div>
      </div>
    </div>
  );
}

interface CourseCardProps {
  course: any;
}

function CourseCard({ course }: CourseCardProps) {
  const { files, notes, todos } = useAppStore();

  const courseFiles = files[course.id] || [];
  const courseNotes = notes[course.id] || [];
  const courseTodos = todos[course.id] || [];

  // Calcular promedio del curso
  const average = React.useMemo(() => {
    if (courseNotes.length === 0) return 0;

    const totalWeighted = courseNotes.reduce(
      (sum, note) => sum + note.value * note.weight,
      0
    );
    const totalWeight = courseNotes.reduce((sum, note) => sum + note.weight, 0);

    return totalWeight > 0 ? totalWeighted / totalWeight : 0;
  }, [courseNotes]);

  return (
    <Link
      to={`/course/${course.id}`}
      className="card card-hover p-6 block"
      style={{ borderLeftColor: course.color, borderLeftWidth: '4px' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-dark-text-primary mb-1">
            {course.name}
          </h3>
          <p className="text-sm text-dark-text-muted">{course.teacher}</p>
        </div>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: course.color }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-dark-text-primary">
            {courseFiles.length}
          </div>
          <div className="text-xs text-dark-text-muted">Archivos</div>
        </div>
        <div>
          <div className="text-lg font-bold text-dark-text-primary">
            {courseNotes.length}
          </div>
          <div className="text-xs text-dark-text-muted">Notas</div>
        </div>
        <div>
          <div
            className={cn(
              'text-lg font-bold',
              average >= 11 ? 'text-course-green' : 'text-course-red'
            )}
          >
            {average.toFixed(1)}
          </div>
          <div className="text-xs text-dark-text-muted">Promedio</div>
        </div>
      </div>

      {/* Tareas pendientes */}
      {courseTodos.filter(t => !t.done).length > 0 && (
        <div className="mt-3 pt-3 border-t border-dark-border">
          <p className="text-xs text-dark-text-muted">
            {courseTodos.filter(t => !t.done).length} tareas pendientes
          </p>
        </div>
      )}
    </Link>
  );
}

interface ProgressItemProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

function ProgressItem({ label, current, target, color }: ProgressItemProps) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-dark-text-secondary">{label}</span>
        <span className="text-dark-text-muted">
          {current}/{target}
        </span>
      </div>
      <div className="w-full bg-dark-bg-tertiary rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={48} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      <button onClick={onAction} className="btn btn-primary">
        <Plus size={20} />
        {actionLabel}
      </button>
    </div>
  );
}
