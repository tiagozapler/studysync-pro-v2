import React from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

export function EventModal() {
  const { toggleModal } = useAppStore();

  return (
    <div className="modal-backdrop" onClick={() => toggleModal('eventModal')}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-display font-bold text-dark-text-primary">
            Nuevo Evento
          </h2>
          <button
            onClick={() => toggleModal('eventModal')}
            className="p-2 rounded-sm text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-bg-tertiary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-dark-text-muted">
            Placeholder - Implementar creación de eventos
          </p>
        </div>
      </div>
    </div>
  );
}
