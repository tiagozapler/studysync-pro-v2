import React from 'react';
import { Search as SearchIcon, Filter } from 'lucide-react';

export function Search() {
  const [query, setQuery] = React.useState('');

  return (
    <div className="container-app py-8">
      <div className="page-header">
        <h1 className="text-3xl font-display font-bold text-dark-text-primary">
          Búsqueda Global
        </h1>
        <p className="text-dark-text-muted mt-2">
          Encuentra archivos, notas, eventos y más en todos tus cursos
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="card p-6 mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <SearchIcon
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-muted"
            />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar en todos los cursos..."
              className="input pl-10 text-lg"
              autoFocus
            />
          </div>
          <button className="btn">
            <Filter size={20} />
            Filtros
          </button>
        </div>
      </div>

      {/* Resultados placeholder */}
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <h3 className="empty-state-title">Búsqueda en desarrollo</h3>
        <p className="empty-state-description">
          La búsqueda global estará disponible próximamente
        </p>
      </div>
    </div>
  );
}
