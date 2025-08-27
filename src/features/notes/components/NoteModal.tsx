import React from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

// Placeholder modal
export function NoteModal() {
  const { toggleModal } = useAppStore();

  return (
    <div className="modal-backdrop" onClick={() => toggleModal('noteModal')}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-display font-bold text-dark-text-primary">
            Gestión de Notas Académicas
          </h2>
          <button
            onClick={() => toggleModal('noteModal')}
            className="p-2 rounded-sm text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-bg-tertiary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-dark-text-muted">Placeholder - Implementar gestión de notas académicas</p>
        </div>
      </div>
    </div>
  );
}
