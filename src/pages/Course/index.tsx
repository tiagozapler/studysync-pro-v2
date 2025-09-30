import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Bot, Calculator, Calendar } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { MaterialsSection } from '../../features/courses/components/MaterialsSection';
import { CourseAIAssistant } from '../../features/courses/components/CourseAIAssistant';
import { GradesSection } from '../../features/courses/components/GradesSection';
import { CalendarSection } from '../../features/courses/components/CalendarSection';

export function Course() {
  const { courseId, section = 'materials' } = useParams();
  const { courses } = useAppStore();

  const course = courses.find(c => c.id === courseId);

  if (!course) {
    return (
      <div className="container-app py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-dark-text-primary mb-4">
            Curso no encontrado
          </h1>
          <Link to="/dashboard" className="btn btn-primary">
            <ArrowLeft size={16} />
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'materials', label: 'Materiales', icon: FileText },
    { id: 'ai', label: 'Asistente IA', icon: Bot },
    { id: 'grades', label: 'Notas', icon: Calculator },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
  ];

  return (
    <div className="container-app py-8">
      {/* Header banner Tron */}
      <div className="relative overflow-hidden rounded-lg border border-dark-border bg-dark-bg-secondary/60 shadow-card shadow-glow mb-6">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-neon-cyan/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-neon-purple/20 blur-3xl" />
        </div>
        <div className="relative z-10 p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="btn btn-ghost">
                <ArrowLeft size={16} />
                Volver
              </Link>
              <div
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: course.color }}
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-space-grotesk font-bold">
                  {course.name}
                </h1>
                <p className="text-dark-text-muted">{course.teacher}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-4 flex flex-wrap gap-2">
            {sections.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              return (
                <Link
                  key={id}
                  to={`/course/${courseId}/${id}`}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-200px)]">
        {section === 'materials' && <MaterialsSection courseId={courseId!} />}
        {section === 'ai' && <CourseAIAssistant courseId={courseId!} />}
        {section === 'grades' && <GradesSection courseId={courseId!} />}
        {section === 'calendar' && <CalendarSection courseId={courseId!} />}
      </div>
    </div>
  );
}
