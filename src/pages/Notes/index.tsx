import React from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { dateUtils } from '../../lib/utils';

export function Notes() {
  const { quickNotes, toggleModal, deleteQuickNote } = useAppStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'general', label: 'General' },
    { id: 'estudio', label: 'Estudio' },
    { id: 'recordatorio', label: 'Recordatorio' },
    { id: 'idea', label: 'Idea' },
  ];

  const filteredNotes = React.useMemo(() => {
    if (!Array.isArray(quickNotes)) return [];
    
    return quickNotes.filter(note => {
      // Verificaciones de seguridad
      if (!note || typeof note !== 'object') return false;
      
      const title = note.title || '';
      const content = note.content || '';
      const category = note.category || 'general';
      
      const matchesSearch =
        !searchQuery ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [quickNotes, searchQuery, selectedCategory]);

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('¿Estás seguro de eliminar esta nota?')) {
      await deleteQuickNote(noteId);
    }
  };

  return (
    <div className="container-app py-8">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-dark-text-primary">
              Notas Rápidas
            </h1>
            <p className="text-dark-text-muted mt-2">
              Organiza tus ideas y recordatorios importantes
            </p>
          </div>
          <button
            onClick={() => toggleModal('quickNoteModal')}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Nueva Nota
          </button>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Búsqueda */}
        <div className="flex-1 relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar en notas..."
            className="input pl-10"
          />
        </div>

        {/* Filtro por categoría */}
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="input w-auto"
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de notas */}
      {filteredNotes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3 className="empty-state-title">
            {quickNotes.length === 0
              ? 'No tienes notas aún'
              : 'No se encontraron notas'}
          </h3>
          <p className="empty-state-description">
            {quickNotes.length === 0
              ? 'Crea tu primera nota rápida para organizar tus ideas'
              : 'Intenta con otros términos de búsqueda'}
          </p>
          {quickNotes.length === 0 && (
            <button
              onClick={() => toggleModal('quickNoteModal')}
              className="btn btn-primary"
            >
              <Plus size={20} />
              Nueva Nota
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => (
            <div key={note.id} className="card p-6 card-hover">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark-text-primary truncate">
                    {note.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-sm ${
                        {
                          general: 'bg-dark-bg-tertiary text-dark-text-muted',
                          estudio: 'bg-course-blue/20 text-course-blue',
                          recordatorio:
                            'bg-course-yellow/20 text-course-yellow',
                          idea: 'bg-course-purple/20 text-course-purple',
                        }[note.category]
                      }`}
                    >
                      {categories.find(c => c.id === note.category)?.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => {
                      /* TODO: Implementar edición */
                    }}
                    className="p-1 text-dark-text-muted hover:text-dark-text-primary"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-dark-text-muted hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <p className="text-dark-text-secondary text-sm line-clamp-4">
                  {note.content}
                </p>
              </div>

              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {note.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-dark-bg-tertiary text-dark-text-muted rounded-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="text-xs text-dark-text-muted border-t border-dark-border pt-3">
                {dateUtils.formatRelative(new Date(note.createdAt))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estadísticas */}
      {quickNotes.length > 0 && (
        <div className="mt-8 pt-8 border-t border-dark-border">
          <div className="text-center text-sm text-dark-text-muted">
            Total de notas: {quickNotes.length} • Mostrando:{' '}
            {filteredNotes.length}
          </div>
        </div>
      )}
    </div>
  );
}
