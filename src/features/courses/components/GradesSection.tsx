import React, { useState } from 'react';
import { Plus, Edit3, Trash2, TrendingUp, Target, Award } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

interface GradesSectionProps {
  courseId: string;
}

interface Grade {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  type: string;
  date: Date;
}

export const GradesSection: React.FC<GradesSectionProps> = ({ courseId }) => {
  const { grades, addCourseGrade, updateCourseGrade, deleteCourseGrade } =
    useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    score: '',
    maxScore: '',
    weight: '',
    type: 'tarea',
  });

  // Verificación segura de grades
  const safeGrades = grades && typeof grades === 'object' ? grades : {};
  const courseGrades = Array.isArray(safeGrades[courseId]) ? safeGrades[courseId] : [];

  // Calcular estadísticas del curso (escala 0-20)
  const calculateStats = () => {
    if (!Array.isArray(courseGrades) || courseGrades.length === 0) {
      return {
        totalWeight: 0,
        currentWeight: 0,
        average: 0,
        remainingWeight: 100,
        projectedGrade: 0,
        needToPass: null as number | null,
        status: 'incomplete' as 'passing' | 'failing' | 'incomplete',
      };
    }

    const totalWeight = courseGrades.reduce(
      (sum, grade) => sum + grade.weight,
      0
    );
    
    // Calcular promedio ponderado en escala 0-20
    const weightedSum = courseGrades.reduce((sum, grade) => {
      const gradeIn20Scale = (grade.score / grade.maxScore) * 20; // Convertir a escala 0-20
      return sum + (gradeIn20Scale * grade.weight) / 100;
    }, 0);

    const average = weightedSum; // Ya está en escala 0-20
    const remainingWeight = Math.max(0, 100 - totalWeight);

    // Calcular qué nota se necesita para aprobar (11/20 = aprobado)
    let needToPass: number | null = null;
    let status: 'passing' | 'failing' | 'incomplete' = 'incomplete';
    
    const passingGrade = 11; // Nota mínima para aprobar en escala 0-20
    
    if (remainingWeight > 0) {
      // Calcular qué nota se necesita en el peso restante para llegar a 11
      const currentContribution = average; // Lo que ya contribuye
      const neededTotal = passingGrade; // Necesitamos llegar a 11
      const neededFromRemaining = neededTotal - currentContribution;
      needToPass = (neededFromRemaining * 100) / remainingWeight;
      
      // Limitar entre 0 y 20
      needToPass = Math.max(0, Math.min(20, needToPass));
      
      // Determinar estado
      if (needToPass <= 0) {
        status = 'passing'; // Ya aprobó
      } else if (needToPass > 20) {
        status = 'failing'; // Imposible aprobar
      } else {
        status = 'incomplete'; // Aún puede aprobar
      }
    } else {
      // No hay más evaluaciones, el promedio final es el actual
      status = average >= passingGrade ? 'passing' : 'failing';
    }

    return {
      totalWeight,
      currentWeight: totalWeight,
      average: Math.round(average * 100) / 100,
      remainingWeight,
      projectedGrade: Math.round(average * 100) / 100,
      needToPass: needToPass !== null ? Math.round(needToPass * 100) / 100 : null,
      status,
    };
  };

  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.score || !formData.maxScore) {
      return;
    }

    const gradeData = {
      name: formData.name.trim(),
      score: parseFloat(formData.score),
      maxScore: parseFloat(formData.maxScore),
      weight: parseFloat(formData.weight) || 100,
      type: formData.type as
        | 'exam'
        | 'quiz'
        | 'project'
        | 'homework'
        | 'participation'
        | 'other',
      date: new Date(),
    };

    try {
      if (editingGrade) {
        await updateCourseGrade(courseId, editingGrade.id, gradeData);
        setEditingGrade(null);
      } else {
        await addCourseGrade(courseId, gradeData);
      }

      setFormData({
        name: '',
        score: '',
        maxScore: '',
        weight: '',
        type: 'tarea',
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving grade:', error);
    }
  };

  const handleEdit = (grade: Grade) => {
    setEditingGrade(grade);
    setFormData({
      name: grade.name,
      score: grade.score.toString(),
      maxScore: grade.maxScore.toString(),
      weight: grade.weight.toString(),
      type: grade.type,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (gradeId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      try {
        await deleteCourseGrade(courseId, gradeId);
      } catch (error) {
        console.error('Error deleting grade:', error);
      }
    }
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header y estadísticas */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notas del Curso</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Nota
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full border border-neon-cyan/40 bg-neon-cyan/10">
              <TrendingUp className="h-6 w-6 text-neon-cyan" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-dark-text-secondary">
                Promedio Actual
              </p>
              <p className={`text-2xl font-bold ${stats.average >= 11 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.average}/20
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-full border ${
              stats.status === 'passing' ? 'border-green-500/40 bg-green-500/10' :
              stats.status === 'failing' ? 'border-red-500/40 bg-red-500/10' : 'border-yellow-500/40 bg-yellow-500/10'
            }`}>
              <Award className={`h-6 w-6 ${
                stats.status === 'passing' ? 'text-green-400' :
                stats.status === 'failing' ? 'text-red-400' : 'text-yellow-400'
              }`} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-dark-text-secondary">Estado</p>
              <p className={`text-lg font-bold ${
                stats.status === 'passing' ? 'text-green-400' :
                stats.status === 'failing' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {stats.status === 'passing' ? 'Aprobando' :
                 stats.status === 'failing' ? 'Desaprobado' : 'En curso'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full border border-yellow-500/40 bg-yellow-500/10">
              <Target className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-dark-text-secondary">Peso Evaluado</p>
              <p className="text-2xl font-bold">
                {stats.totalWeight}%
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full border border-neon-purple/40 bg-neon-purple/10">
              <Target className="h-6 w-6 text-neon-purple" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-dark-text-secondary">
                {stats.needToPass !== null && stats.remainingWeight > 0 ? 'Necesitas para aprobar' : 'Peso Restante'}
              </p>
              <p className="text-2xl font-bold">
                {stats.needToPass !== null && stats.remainingWeight > 0 
                  ? `${stats.needToPass}/20`
                  : `${stats.remainingWeight}%`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso del peso */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">
            Progreso del Curso
          </h4>
          <span className="text-sm text-dark-text-muted">
            {stats.totalWeight}% de 100% evaluado
          </span>
        </div>
        <div className="w-full bg-dark-bg-tertiary rounded-full h-2">
          <div
            className="bg-neon-cyan h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.totalWeight}%` }}
          />
        </div>
        <p className="text-xs text-dark-text-muted mt-1">
          {stats.remainingWeight > 0
            ? `Faltan ${stats.remainingWeight}% de evaluaciones para completar el curso`
            : 'Curso completamente evaluado'}
        </p>
      </div>

      {/* Lista de notas */}
      {courseGrades.length > 0 ? (
        <div className="card">
          <div className="px-6 py-4 border-b border-dark-border">
            <h4 className="text-sm font-medium">
              Evaluaciones ({courseGrades.length})
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-border/60">
              <thead className="bg-dark-bg-secondary/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Evaluación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Nota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Peso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {courseGrades.map(grade => {
                  const percentage = (grade.score / grade.maxScore) * 100;
                  return (
                    <tr key={grade.id} className="hover:bg-dark-bg-secondary/40">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {grade.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`text-sm font-semibold`}
                          >
                            {grade.score}/{grade.maxScore}
                          </span>
                          <span
                            className={`ml-2 text-xs`}
                          >
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm">
                          {grade.weight}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40">
                          {grade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text-muted">
                        {new Date(grade.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(grade)}
                            className="btn btn-ghost px-2"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(grade.id)}
                            className="btn btn-ghost px-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Award className="mx-auto h-12 w-12 text-dark-text-secondary" />
          <h3 className="mt-2 text-sm font-medium">
            No hay notas
          </h3>
          <p className="mt-1 text-sm text-dark-text-muted">
            Comienza agregando la primera evaluación del curso.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primera Nota
            </button>
          </div>
        </div>
      )}

      {/* Modal para agregar/editar nota */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-96 card">
            <div className="mt-3">
              <h3 className="text-lg font-medium mb-4">
                {editingGrade ? 'Editar Nota' : 'Agregar Nueva Nota'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">
                    Nombre de la Evaluación
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 block w-full input"
                    placeholder="Examen Parcial 1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Nota Obtenida
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.score}
                      onChange={e =>
                        setFormData({ ...formData, score: e.target.value })
                      }
                      className="mt-1 block w-full input"
                      placeholder="85"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Nota Máxima
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxScore}
                      onChange={e =>
                        setFormData({ ...formData, maxScore: e.target.value })
                      }
                      className="mt-1 block w-full input"
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Peso (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.weight}
                      onChange={e =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      className="mt-1 block w-full input"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={e =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="mt-1 block w-full input"
                    >
                      <option value="tarea">Tarea</option>
                      <option value="examen">Examen</option>
                      <option value="trabajo">Trabajo</option>
                      <option value="quiz">Quiz</option>
                      <option value="participación">Participación</option>
                      <option value="proyecto">Proyecto</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 btn btn-primary"
                  >
                    {editingGrade ? 'Actualizar' : 'Agregar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingGrade(null);
                      setFormData({
                        name: '',
                        score: '',
                        maxScore: '',
                        weight: '',
                        type: 'tarea',
                      });
                    }}
                    className="flex-1 btn btn-ghost"
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
