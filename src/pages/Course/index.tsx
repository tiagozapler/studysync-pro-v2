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
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center space-x-4 mb-4">
          <Link to="/dashboard" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Volver
          </Link>
          <div
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: course.color }}
          />
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-text-primary">
              {course.name}
            </h1>
            <p className="text-dark-text-muted">{course.teacher}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex space-x-2">
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
