import React from 'react';
import { X, Save } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import toast from 'react-hot-toast';

export function QuickNoteModal() {
  const { toggleModal, addQuickNote } = useAppStore();
  const [formData, setFormData] = React.useState({
    title: '',
    content: '',
    category: 'general' as const,
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('El título y contenido son obligatorios');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await addQuickNote({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags
      });
      
      toast.success('Nota rápida guardada');
      toggleModal('quickNoteModal');
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        category: 'general',
        tags: ''
      });
    } catch (error) {
      console.error('Error adding quick note:', error);
      toast.error('Error al guardar la nota');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => toggleModal('quickNoteModal')}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-display font-bold text-dark-text-primary">
            Nueva Nota Rápida
          </h2>
          <button
            onClick={() => toggleModal('quickNoteModal')}
            className="p-2 rounded-sm text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-bg-tertiary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="noteTitle" className="block text-sm font-medium text-dark-text-primary mb-2">
              Título *
            </label>
            <input
              id="noteTitle"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Recordatorio importante"
              className="input"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="noteCategory" className="block text-sm font-medium text-dark-text-primary mb-2">
              Categoría
            </label>
            <select
              id="noteCategory"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              className="input"
            >
              <option value="general">General</option>
              <option value="estudio">Estudio</option>
              <option value="recordatorio">Recordatorio</option>
              <option value="idea">Idea</option>
            </select>
          </div>

          <div>
            <label htmlFor="noteContent" className="block text-sm font-medium text-dark-text-primary mb-2">
              Contenido *
            </label>
            <textarea
              id="noteContent"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Escribe tu nota aquí..."
              rows={6}
              className="input resize-none"
              required
            />
          </div>

          <div>
            <label htmlFor="noteTags" className="block text-sm font-medium text-dark-text-primary mb-2">
              Etiquetas (separadas por comas)
            </label>
            <input
              id="noteTags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Ej: importante, examen, proyecto"
              className="input"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border">
            <button
              type="button"
              onClick={() => toggleModal('quickNoteModal')}
              className="btn"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Guardar Nota
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
