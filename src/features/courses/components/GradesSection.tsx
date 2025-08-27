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
  const { grades, addCourseGrade, updateCourseGrade, deleteCourseGrade } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    score: '',
    maxScore: '',
    weight: '',
    type: 'tarea'
  });

  const courseGrades = grades[courseId] || [];

  // Calcular estadísticas del curso
  const calculateStats = () => {
    if (courseGrades.length === 0) {
      return {
        totalWeight: 0,
        currentWeight: 0,
        average: 0,
        percentage: 0,
        remainingWeight: 100,
        projectedGrade: 0,
        letterGrade: 'N/A'
      };
    }

    const totalWeight = courseGrades.reduce((sum, grade) => sum + grade.weight, 0);
    const currentWeight = courseGrades.reduce((sum, grade) => sum + grade.weight, 0);
    const weightedSum = courseGrades.reduce((sum, grade) => {
      const percentage = (grade.score / grade.maxScore) * 100;
      return sum + (percentage * grade.weight);
    }, 0);
    
    const average = weightedSum / totalWeight;
    const percentage = (weightedSum / totalWeight);
    const remainingWeight = Math.max(0, 100 - totalWeight);
    
    // Calcular nota proyectada si hay peso restante
    let projectedGrade = average;
    if (remainingWeight > 0) {
      // Asumir que las evaluaciones restantes tendrán la misma nota promedio
      projectedGrade = average;
    }

    // Convertir a letra
    const letterGrade = getLetterGrade(projectedGrade);

    return {
      totalWeight,
      currentWeight,
      average: Math.round(average * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      remainingWeight,
      projectedGrade: Math.round(projectedGrade * 100) / 100,
      letterGrade
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
      type: formData.type as 'exam' | 'quiz' | 'project' | 'homework' | 'participation' | 'other',
      date: new Date()
    };

    try {
      if (editingGrade) {
        await updateCourseGrade(courseId, editingGrade.id, gradeData);
        setEditingGrade(null);
      } else {
        await addCourseGrade(courseId, gradeData);
      }
      
      setFormData({ name: '', score: '', maxScore: '', weight: '', type: 'tarea' });
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
      type: grade.type
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
        <h3 className="text-lg font-semibold text-gray-900">Notas del Curso</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Nota
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Promedio Actual</p>
              <p className={`text-2xl font-bold ${getGradeColor(stats.average)}`}>
                {stats.average}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Nota Letra</p>
              <p className={`text-2xl font-bold ${getGradeColor(stats.average)}`}>
                {stats.letterGrade}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Peso Evaluado</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalWeight}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Peso Restante</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.remainingWeight}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso del peso */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">Progreso del Curso</h4>
          <span className="text-sm text-gray-500">
            {stats.totalWeight}% de 100% evaluado
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.totalWeight}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {stats.remainingWeight > 0 
            ? `Faltan ${stats.remainingWeight}% de evaluaciones para completar el curso`
            : 'Curso completamente evaluado'
          }
        </p>
      </div>

      {/* Lista de notas */}
      {courseGrades.length > 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">
              Evaluaciones ({courseGrades.length})
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evaluación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseGrades.map((grade) => {
                  const percentage = (grade.score / grade.maxScore) * 100;
                  return (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {grade.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-semibold ${getGradeColor(percentage)}`}>
                            {grade.score}/{grade.maxScore}
                          </span>
                          <span className={`ml-2 text-xs ${getGradeColor(percentage)}`}>
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{grade.weight}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {grade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(grade.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(grade)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(grade.id)}
                            className="text-red-600 hover:text-red-900"
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
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay notas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza agregando la primera evaluación del curso.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primera Nota
            </button>
          </div>
        </div>
      )}

      {/* Modal para agregar/editar nota */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingGrade ? 'Editar Nota' : 'Agregar Nueva Nota'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre de la Evaluación
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Examen Parcial 1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nota Obtenida
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="85"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nota Máxima
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxScore}
                      onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Peso (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="25"
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {editingGrade ? 'Actualizar' : 'Agregar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingGrade(null);
                      setFormData({ name: '', score: '', maxScore: '', weight: '', type: 'tarea' });
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
