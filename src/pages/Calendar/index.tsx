import React from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../lib/store';

export function Calendar() {
  const { toggleModal } = useAppStore();
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(
      prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  return (
    <div className="container-app py-8">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold text-dark-text-primary">
            Calendario Académico
          </h1>
          <button
            onClick={() => toggleModal('eventModal')}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Nuevo Evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendario principal */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* Header del calendario */}
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <h2 className="text-xl font-semibold text-dark-text-primary">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center space-x-2">
                <button onClick={handlePrevMonth} className="btn btn-ghost p-2">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextMonth} className="btn btn-ghost p-2">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Grid del calendario */}
            <div className="p-6">
              <div className="grid grid-cols-7 gap-px bg-dark-border rounded-sm overflow-hidden">
                {/* Headers de días */}
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div
                    key={day}
                    className="bg-dark-bg-tertiary p-3 text-center text-sm font-medium text-dark-text-muted"
                  >
                    {day}
                  </div>
                ))}

                {/* Placeholder para días del mes */}
                {Array.from({ length: 35 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-dark-bg-secondary p-3 min-h-[80px] text-sm"
                  >
                    <span className="text-dark-text-primary">
                      {(i % 31) + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Próximos eventos */}
          <div className="card p-6">
            <h3 className="font-semibold text-dark-text-primary mb-4">
              Próximos Eventos
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-dark-text-muted">
                No hay eventos próximos
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="card p-6">
            <h3 className="font-semibold text-dark-text-primary mb-4">
              Filtros
            </h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-dark-text-secondary">
                  Exámenes
                </span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-dark-text-secondary">
                  Entregas
                </span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-dark-text-secondary">Clases</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
