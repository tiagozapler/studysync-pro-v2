import React, { useState } from 'react';
import { Plus, Calendar, Clock, Edit3, Trash2 } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

interface CalendarSectionProps {
  courseId: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: string;
  courseId: string;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({ courseId }) => {
  const { courseEvents, addCourseEvent, updateCourseEvent, deleteCourseEvent } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    type: 'clase'
  });

  const courseEventList = courseEvents[courseId] || [];

  // Obtener eventos del mes actual
  const getCurrentMonthEvents = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return courseEventList.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });
  };

  // Obtener eventos de la próxima semana
  const getNextWeekEvents = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return courseEventList.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= nextWeek;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Obtener eventos del día actual
  const getTodayEvents = () => {
    const today = new Date();
    const todayString = today.toDateString();
    
    return courseEventList.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === todayString;
    });
  };

  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case 'examen':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'trabajo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'entrega':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'clase':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'revisión':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'examen':
        return '📝';
      case 'trabajo':
        return '📊';
      case 'entrega':
        return '📅';
      case 'clase':
        return '🎓';
      case 'revisión':
        return '🔍';
      default:
        return '📋';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.date) {
      return;
    }

    const eventData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: new Date(formData.date),
      type: formData.type,
      courseId,
    };

    try {
      if (editingEvent) {
        await updateCourseEvent(courseId, editingEvent.id, eventData as any);
        setEditingEvent(null);
      } else {
        await addCourseEvent(courseId, eventData as any);
      }
      
      setFormData({ title: '', description: '', date: '', type: 'clase' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().split('T')[0],
      type: event.type
    });
    setShowAddModal(true);
  };

  const handleDelete = async (eventId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await deleteCourseEvent(courseId, eventId);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const todayEvents = getTodayEvents();
  const nextWeekEvents = getNextWeekEvents();
  const currentMonthEvents = getCurrentMonthEvents();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Calendario del Curso</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Evento
        </button>
      </div>

      {/* Eventos de hoy */}
      {todayEvents.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-green-600" />
            Eventos de Hoy
          </h4>
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <span className="text-lg mr-3">{getEventTypeIcon(event.type)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(new Date(event.date))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximos eventos */}
      {nextWeekEvents.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-blue-600" />
            Próximos Eventos (Esta Semana)
          </h4>
          <div className="space-y-2">
            {nextWeekEvents.map((event) => {
              const eventDate = new Date(event.date);
              const isToday = eventDate.toDateString() === new Date().toDateString();
              
              return (
                <div key={event.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  isToday ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{getEventTypeIcon(event.type)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(eventDate)}
                        {!isToday && (
                          <>
                            <Clock className="h-3 w-3 ml-2 mr-1" />
                            {formatTime(eventDate)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEventTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                    <button
                      onClick={() => handleEdit(event)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Todos los eventos del mes */}
      {currentMonthEvents.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-purple-600" />
            Todos los Eventos del Mes
          </h4>
          <div className="space-y-2">
            {currentMonthEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <span className="text-lg mr-3">{getEventTypeIcon(event.type)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(new Date(event.date))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {courseEventList.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay eventos programados</h3>
          <p className="mt-1 text-sm text-gray-500">
            Los eventos se agregarán automáticamente cuando subas archivos con fechas importantes.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Evento
            </button>
          </div>
        </div>
      )}

      {/* Modal para agregar/editar evento */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingEvent ? 'Editar Evento' : 'Agregar Nuevo Evento'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Título del Evento
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Examen Parcial 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Descripción del evento..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="clase">Clase</option>
                      <option value="examen">Examen</option>
                      <option value="trabajo">Trabajo</option>
                      <option value="entrega">Entrega</option>
                      <option value="revisión">Revisión</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {editingEvent ? 'Actualizar' : 'Agregar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingEvent(null);
                      setFormData({ title: '', description: '', date: '', type: 'clase' });
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
