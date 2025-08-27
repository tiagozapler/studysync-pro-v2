import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Calculator, TrendingUp, Award } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

interface Grade {
  id: string;
  name: string;
  type: 'exam' | 'quiz' | 'project' | 'homework' | 'participation' | 'other';
  weight: number; // Porcentaje del total
  score: number; // Nota obtenida
  maxScore: number; // Nota máxima posible
  date: Date;
  notes?: string;
  courseId: string;
}

interface GradesSectionProps {
  courseId: string;
}

export function GradesSection({ courseId }: GradesSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [newGrade, setNewGrade] = useState({
    name: '',
    type: 'exam' as Grade['type'],
    weight: 0,
    score: 0,
    maxScore: 100,
    notes: ''
  });

  // Obtener datos del curso desde el store
  const course = useAppStore(state => state.courses.find(c => c.id === courseId));
  const grades = useAppStore(state => state.grades[courseId] || []);

  // Calcular estadísticas
  const calculateStats = () => {
    if (grades.length === 0) return null;

    const totalWeight = grades.reduce((sum, grade) => sum + grade.weight, 0);
    const weightedSum = grades.reduce((sum, grade) => {
      const percentage = (grade.score / grade.maxScore) * 100;
      return sum + (percentage * grade.weight);
    }, 0);

    const average = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
    const totalMaxScore = grades.reduce((sum, grade) => sum + grade.maxScore, 0);
    const simpleAverage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    return {
      weightedAverage: average,
      simpleAverage,
      totalWeight,
      totalGrades: grades.length,
      highestGrade: Math.max(...grades.map(g => (g.score / g.maxScore) * 100)),
      lowestGrade: Math.min(...grades.map(g => (g.score / g.maxScore) * 100))
    };
  };

  const stats = calculateStats();

  const handleAddGrade = async () => {
    if (!newGrade.name.trim() || newGrade.weight <= 0) return;

    await useAppStore.getState().addCourseGrade(courseId, {
      name: newGrade.name,
      type: newGrade.type,
      weight: newGrade.weight,
      score: newGrade.score,
      maxScore: newGrade.maxScore,
      notes: newGrade.notes
    });

    setNewGrade({
      name: '',
      type: 'exam',
      weight: 0,
      score: 0,
      maxScore: 100,
      notes: ''
    });
    setShowAddModal(false);
  };

  const handleEditGrade = async () => {
    if (!editingGrade || !newGrade.name.trim() || newGrade.weight <= 0) return;

    await useAppStore.getState().updateCourseGrade(courseId, editingGrade.id, {
      name: newGrade.name,
      type: newGrade.type,
      weight: newGrade.weight,
      score: newGrade.score,
      maxScore: newGrade.maxScore,
      notes: newGrade.notes
    });

    setEditingGrade(null);
    setNewGrade({
      name: '',
      type: 'exam',
      weight: 0,
      score: 0,
      maxScore: 100,
      notes: ''
    });
  };

  const handleDeleteGrade = async (gradeId: string) => {
    await useAppStore.getState().deleteCourseGrade(courseId, gradeId);
  };

  const startEdit = (grade: Grade) => {
    setEditingGrade(grade);
    setNewGrade({
      name: grade.name,
      type: grade.type,
      weight: grade.weight,
      score: grade.score,
      maxScore: grade.maxScore,
      notes: grade.notes || ''
    });
  };

  const getGradeTypeIcon = (type: Grade['type']) => {
    switch (type) {
      case 'exam': return '📝';
      case 'quiz': return '❓';
      case 'project': return '📊';
      case 'homework': return '📚';
      case 'participation': return '👥';
      case 'other': return '📋';
      default: return '📄';
    }
  };

  const getGradeTypeLabel = (type: Grade['type']) => {
    switch (type) {
      case 'exam': return 'Examen';
      case 'quiz': return 'Quiz';
      case 'project': return 'Proyecto';
      case 'homework': return 'Tarea';
      case 'participation': return 'Participación';
      case 'other': return 'Otro';
      default: return 'Otro';
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 80) return 'text-info';
    if (percentage >= 70) return 'text-warning';
    return 'text-danger';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg-primary">
      {/* Header */}
      <div className="p-4 border-b border-dark-border bg-dark-bg-secondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator size={24} className="text-course-blue" />
            <div>
              <h2 className="text-xl font-semibold text-dark-text-primary">
                Sistema de Notas - {course?.name}
              </h2>
              <p className="text-sm text-dark-text-muted">
                {grades.length} evaluaciones registradas
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Evaluación
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="p-4 bg-dark-bg-secondary border-b border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-dark-bg-primary p-4 rounded-lg border border-dark-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-course-blue" />
                <span className="text-sm text-dark-text-secondary">Promedio Ponderado</span>
              </div>
              <div className={`text-2xl font-bold ${getGradeColor(stats.weightedAverage)}`}>
                {stats.weightedAverage.toFixed(1)}%
              </div>
              <div className="text-xs text-dark-text-muted">
                {getGradeLetter(stats.weightedAverage)}
              </div>
            </div>

            <div className="bg-dark-bg-primary p-4 rounded-lg border border-dark-border">
              <div className="flex items-center gap-2 mb-2">
                <Calculator size={16} className="text-course-blue" />
                <span className="text-sm text-dark-text-secondary">Promedio Simple</span>
              </div>
              <div className={`text-2xl font-bold ${getGradeColor(stats.simpleAverage)}`}>
                {stats.simpleAverage.toFixed(1)}%
              </div>
              <div className="text-xs text-dark-text-muted">
                {getGradeLetter(stats.simpleAverage)}
              </div>
            </div>

            <div className="bg-dark-bg-primary p-4 rounded-lg border border-dark-border">
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-success" />
                <span className="text-sm text-dark-text-secondary">Mejor Nota</span>
              </div>
              <div className="text-2xl font-bold text-success">
                {stats.highestGrade.toFixed(1)}%
              </div>
              <div className="text-xs text-dark-text-muted">
                {getGradeLetter(stats.highestGrade)}
              </div>
            </div>

            <div className="bg-dark-bg-primary p-4 rounded-lg border border-dark-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-dark-text-secondary">Peso Total</span>
              </div>
              <div className="text-2xl font-bold text-course-blue">
                {stats.totalWeight}%
              </div>
              <div className="text-xs text-dark-text-muted">
                {stats.totalGrades} evaluaciones
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grades List */}
      <div className="flex-1 overflow-y-auto p-4">
        {grades.length === 0 ? (
          <div className="text-center py-8">
            <Calculator size={48} className="mx-auto text-dark-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-dark-text-primary mb-2">
              No hay evaluaciones registradas
            </h3>
            <p className="text-dark-text-muted mb-4">
              Agrega tu primera evaluación para comenzar a ver tu progreso.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Agregar Primera Evaluación
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {grades.map((grade) => {
              const percentage = (grade.score / grade.maxScore) * 100;
              return (
                <div
                  key={grade.id}
                  className="bg-dark-bg-secondary border border-dark-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getGradeTypeIcon(grade.type)}
                      </span>
                      <div>
                        <h4 className="font-medium text-dark-text-primary">
                          {grade.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-dark-text-muted">
                          <span>{getGradeTypeLabel(grade.type)}</span>
                          <span>{grade.weight}% del total</span>
                          <span>{grade.date.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getGradeColor(percentage)}`}>
                          {grade.score}/{grade.maxScore}
                        </div>
                        <div className="text-sm text-dark-text-muted">
                          {percentage.toFixed(1)}% ({getGradeLetter(percentage)})
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(grade)}
                          className="p-1 text-dark-text-muted hover:text-dark-text-primary"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteGrade(grade.id)}
                          className="p-1 text-dark-text-muted hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {grade.notes && (
                    <div className="mt-3 pt-3 border-t border-dark-border">
                      <p className="text-sm text-dark-text-muted">
                        {grade.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingGrade) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-bg-secondary p-6 rounded-lg shadow-modal max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
              {editingGrade ? 'Editar Evaluación' : 'Agregar Evaluación'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Nombre de la Evaluación
                </label>
                <input
                  type="text"
                  value={newGrade.name}
                  onChange={(e) => setNewGrade(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                  placeholder="Ex. Examen Parcial 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Tipo de Evaluación
                </label>
                <select
                  value={newGrade.type}
                  onChange={(e) => setNewGrade(prev => ({ ...prev, type: e.target.value as Grade['type'] }))}
                  className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                >
                  <option value="exam">Examen</option>
                  <option value="quiz">Quiz</option>
                  <option value="project">Proyecto</option>
                  <option value="homework">Tarea</option>
                  <option value="participation">Participación</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Peso (%)
                  </label>
                  <input
                    type="number"
                    value={newGrade.weight}
                    onChange={(e) => setNewGrade(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Nota Máxima
                  </label>
                  <input
                    type="number"
                    value={newGrade.maxScore}
                    onChange={(e) => setNewGrade(prev => ({ ...prev, maxScore: Number(e.target.value) }))}
                    className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Nota Obtenida
                </label>
                <input
                  type="number"
                  value={newGrade.score}
                  onChange={(e) => setNewGrade(prev => ({ ...prev, score: Number(e.target.value) }))}
                  className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                  min="0"
                  max={newGrade.maxScore}
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={newGrade.notes}
                  onChange={(e) => setNewGrade(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue"
                  rows={3}
                  placeholder="Comentarios sobre la evaluación..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingGrade(null);
                  setNewGrade({
                    name: '',
                    type: 'exam',
                    weight: 0,
                    score: 0,
                    maxScore: 100,
                    notes: ''
                  });
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={editingGrade ? handleEditGrade : handleAddGrade}
                disabled={!newGrade.name.trim() || newGrade.weight <= 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {editingGrade ? 'Guardar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
