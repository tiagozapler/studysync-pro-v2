import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, Edit3, Trash2, Search, Filter } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  location?: string;
  type: 'exam' | 'assignment' | 'class' | 'meeting' | 'other';
  priority: 'low' | 'medium' | 'high';
  courseId: string;
  source: 'manual' | 'auto-detected';
  sourceFile?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarSectionProps {
  courseId: string;
}

export function CalendarSection({ courseId }: CalendarSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date(),
    time: '',
    location: '',
    type: 'other' as CalendarEvent['type'],
    priority: 'medium' as CalendarEvent['priority']
  });

  // Obtener datos del curso desde el store
  const course = useAppStore(state => state.courses.find(c => c.id === courseId));
  const courseMaterials = useAppStore(state => state.files[courseId] || []);
  const events = useAppStore(state => state.courseEvents[courseId] || []);

  // Detectar fechas automáticamente de los materiales
  useEffect(() => {
    detectDatesFromMaterials();
  }, [courseMaterials]);

  const detectDatesFromMaterials = () => {
    const detectedEvents: CalendarEvent[] = [];
    
    courseMaterials.forEach(material => {
      if (material.type === 'file') {
        // Patrones de fechas comunes en documentos académicos
        const datePatterns = [
          // Patrones españoles
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // DD/MM/YYYY
          /(\d{1,2})-(\d{1,2})-(\d{4})/g,   // DD-MM-YYYY
          /(\d{1,2})\/(\d{1,2})\/(\d{2})/g, // DD/MM/YY
          
          // Patrones con texto
          /entrega\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/gi,
          /examen\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/gi,
          /fecha\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/gi,
          /hasta\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/gi,
          
          // Patrones en inglés
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // MM/DD/YYYY
          /due\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/gi,
          /exam\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/gi,
        ];

        // Simular contenido del archivo (en producción sería el contenido real)
        const fileContent = `[Contenido simulado de ${material.name}]
        Este es un contenido simulado que podría contener fechas como:
        - Entrega del proyecto: 25/09/2024
        - Examen parcial: 15/10/2024
        - Fecha límite: 30/11/2024
        - Due date: 12/15/2024`;

        datePatterns.forEach(pattern => {
          const matches = fileContent.matchAll(pattern);
          for (const match of matches) {
            const day = parseInt(match[1] || '1');
            const month = parseInt(match[2] || '1') - 1; // Meses en JS van de 0-11
            const year = parseInt(match[3] || '2024');
            
            // Validar que la fecha sea válida
            const date = new Date(year, month, day);
            if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
              // Verificar si ya existe un evento para esta fecha
              const existingEvent = detectedEvents.find(e => 
                e.date.toDateString() === date.toDateString() && 
                e.sourceFile === material.name
              );
              
              if (!existingEvent) {
                const eventType = determineEventType(fileContent, match[0]);
                const priority = determinePriority(fileContent, match[0]);
                
                detectedEvents.push({
                  id: `auto-${Date.now()}-${Math.random()}`,
                  title: `Evento detectado - ${material.name}`,
                  description: `Fecha detectada automáticamente: ${match[0]}`,
                  date,
                  type: eventType,
                  priority,
                  courseId,
                  source: 'auto-detected',
                  sourceFile: material.name,
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
              }
            }
          }
        });
      }
    });

    // Agregar eventos detectados al store
    detectedEvents.forEach(event => {
      useAppStore.getState().addCourseEvent(courseId, {
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        type: event.type,
        priority: event.priority,
        source: event.source,
        sourceFile: event.sourceFile
      });
    });
  };

  const determineEventType = (content: string, dateMatch: string): CalendarEvent['type'] => {
    const lowerContent = content.toLowerCase();
    const lowerMatch = dateMatch.toLowerCase();
    
    if (lowerContent.includes('examen') || lowerMatch.includes('exam')) return 'exam';
    if (lowerContent.includes('entrega') || lowerContent.includes('tarea') || lowerMatch.includes('due')) return 'assignment';
    if (lowerContent.includes('clase') || lowerContent.includes('class')) return 'class';
    if (lowerContent.includes('reunión') || lowerContent.includes('meeting')) return 'meeting';
    return 'other';
  };

  const determinePriority = (content: string, dateMatch: string): CalendarEvent['priority'] => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('importante') || lowerContent.includes('urgente')) return 'high';
    if (lowerContent.includes('examen') || lowerContent.includes('final')) return 'high';
    if (lowerContent.includes('parcial') || lowerContent.includes('midterm')) return 'medium';
    return 'low';
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) return;

    await useAppStore.getState().addCourseEvent(courseId, {
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      type: newEvent.type,
      priority: newEvent.priority,
      source: 'manual'
    });

    setNewEvent({
      title: '',
      description: '',
      date: new Date(),
      time: '',
      location: '',
      type: 'other',
      priority: 'medium'
    });
    setShowAddModal(false);
  };

  const handleEditEvent = async () => {
    if (!editingEvent || !newEvent.title.trim()) return;

    await useAppStore.getState().updateCourseEvent(courseId, editingEvent.id, {
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      type: newEvent.type,
      priority: newEvent.priority
    });

    setEditingEvent(null);
    setNewEvent({
      title: '',
      description: '',
      date: new Date(),
      time: '',
      location: '',
      type: 'other',
      priority: 'medium'
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    await useAppStore.getState().deleteCourseEvent(courseId, eventId);
  };

  const startEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      location: event.location || '',
      type: event.type,
      priority: event.priority
    });
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'exam': return '📝';
      case 'assignment': return '📚';
      case 'class': return '🎓';
      case 'meeting': return '👥';
      case 'other': return '📅';
      default: return '📅';
    }
  };

  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'exam': return 'Examen';
      case 'assignment': return 'Tarea';
      case 'class': return 'Clase';
      case 'meeting': return 'Reunión';
      case 'other': return 'Otro';
      default: return 'Otro';
    }
  };

  const getPriorityColor = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-dark-text-muted';
    }
  };

  const getPriorityLabel = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Media';
    }
  };

  // Filtrar eventos
  const filteredEvents = events.filter(event => {
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Ordenar eventos por fecha
  const sortedEvents = filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Obtener eventos del mes actual
  const getCurrentMonthEvents = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    return sortedEvents.filter(event => 
      event.date.getMonth() === currentMonth && 
      event.date.getFullYear() === currentYear
    );
  };

  const currentMonthEvents = getCurrentMonthEvents();

  return (
    <div className="h-full flex flex-col bg-dark-bg-primary">
      {/* Header */}
      <div className="p-4 border-b border-dark-border bg-dark-bg-secondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={24} className="text-course-blue" />
            <div>
              <h2 className="text-xl font-semibold text-dark-text-primary">
                Calendario - {course?.name}
              </h2>
              <p className="text-sm text-dark-text-muted">
                {events.length} eventos • {events.filter(e => e.source === 'auto-detected').length} detectados automáticamente
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Evento
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-dark-bg-secondary border-b border-dark-border">
        <div className="flex flex-wrap gap-4 items-center">
          {/* View Mode */}
          <div className="flex gap-1 bg-dark-bg-primary rounded-lg p-1">
            {(['month', 'week', 'list'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  viewMode === mode 
                    ? 'bg-course-blue text-white' 
                    : 'text-dark-text-muted hover:text-dark-text-primary'
                }`}
              >
                {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Lista'}
              </button>
            ))}
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
          >
            <option value="all">Todos los tipos</option>
            <option value="exam">Exámenes</option>
            <option value="assignment">Tareas</option>
            <option value="class">Clases</option>
            <option value="meeting">Reuniones</option>
            <option value="other">Otros</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar eventos..."
              className="bg-dark-bg-primary border border-dark-border rounded-lg pl-10 pr-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
            />
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'list' ? (
          // List View
          <div className="space-y-3">
            {sortedEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={48} className="mx-auto text-dark-text-muted mb-4" />
                <h3 className="text-lg font-semibold text-dark-text-primary mb-2">
                  No hay eventos programados
                </h3>
                <p className="text-dark-text-muted mb-4">
                  Agrega eventos manualmente o sube materiales para detección automática.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary"
                >
                  Agregar Primer Evento
                </button>
              </div>
            ) : (
              sortedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-dark-bg-secondary border border-dark-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getEventTypeIcon(event.type)}
                      </span>
                      <div>
                        <h4 className="font-medium text-dark-text-primary">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-dark-text-muted">
                          <span>{getEventTypeLabel(event.type)}</span>
                          <span className={getPriorityColor(event.priority)}>
                            {getPriorityLabel(event.priority)}
                          </span>
                          <span>{event.date.toLocaleDateString()}</span>
                          {event.time && <span>{event.time}</span>}
                          {event.location && <span>{event.location}</span>}
                          {event.source === 'auto-detected' && (
                            <span className="text-xs bg-course-blue text-white px-2 py-1 rounded">
                              Auto
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(event)}
                        className="p-1 text-dark-text-muted hover:text-dark-text-primary"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 text-dark-text-muted hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {event.description && (
                    <div className="mt-3 pt-3 border-t border-dark-border">
                      <p className="text-sm text-dark-text-muted">
                        {event.description}
                      </p>
                    </div>
                  )}
                  
                  {event.source === 'auto-detected' && event.sourceFile && (
                    <div className="mt-2 text-xs text-dark-text-muted">
                      Detectado de: {event.sourceFile}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          // Month/Week View (simplified)
          <div className="text-center py-8">
            <Calendar size={48} className="mx-auto text-dark-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-dark-text-primary mb-2">
              Vista de Calendario
            </h3>
            <p className="text-dark-text-muted mb-4">
              La vista de calendario mensual/semanal estará disponible próximamente.
            </p>
            <p className="text-sm text-dark-text-muted">
              Usa la vista de lista para ver todos los eventos.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingEvent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-bg-secondary p-6 rounded-lg shadow-modal max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
              {editingEvent ? 'Editar Evento' : 'Agregar Evento'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Título del Evento
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                  placeholder="Ex. Examen Parcial 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                  rows={3}
                  placeholder="Detalles del evento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={newEvent.date.toISOString().split('T')[0]}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: new Date(e.target.value) }))}
                    className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Hora (opcional)
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Ubicación (opcional)
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                  placeholder="Aula, sala, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Tipo
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
                    className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                  >
                    <option value="exam">Examen</option>
                    <option value="assignment">Tarea</option>
                    <option value="class">Clase</option>
                    <option value="meeting">Reunión</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Prioridad
                  </label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value as CalendarEvent['priority'] }))}
                    className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEvent(null);
                  setNewEvent({
                    title: '',
                    description: '',
                    date: new Date(),
                    time: '',
                    location: '',
                    type: 'other',
                    priority: 'medium'
                  });
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={editingEvent ? handleEditEvent : handleAddEvent}
                disabled={!newEvent.title.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {editingEvent ? 'Guardar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
