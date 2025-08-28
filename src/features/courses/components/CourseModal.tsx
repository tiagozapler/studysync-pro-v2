import React, { useState } from 'react';
import { useAppStore } from '../../../lib/store';
import toast from 'react-hot-toast';

interface FormData {
  name: string;
  teacher: string;
  color: string;
  credits: number;
  semester: string;
}

export const CourseModal: React.FC = () => {
  const addCourse = useAppStore(state => state.addCourse);
  const toggleModal = useAppStore(state => state.toggleModal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    teacher: '',
    color: '#3B82F6',
    credits: 3,
    semester: '',
  });

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('El nombre del curso es obligatorio');
      return false;
    }
    if (!formData.teacher.trim()) {
      toast.error('El instructor es obligatorio');
      return false;
    }
    if (formData.credits < 1 || formData.credits > 10) {
      toast.error('Los créditos deben estar entre 1 y 10');
      return false;
    }
    if (!formData.semester.trim()) {
      toast.error('El semestre es obligatorio');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addCourse({
        name: formData.name.trim(),
        teacher: formData.teacher.trim(),
        color: formData.color,
        credits: formData.credits,
        semester: formData.semester.trim(),
        archived: false,
      });

      toast.success(`Curso "${formData.name}" creado exitosamente`);
      toggleModal('courseModal');

      // Resetear formulario
      setFormData({
        name: '',
        teacher: '',
        color: '#3B82F6',
        credits: 3,
        semester: '',
      });
    } catch (error) {
      console.error('Error adding course:', error);
      toast.error('Error al crear el curso. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Agregar Curso</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre del Curso
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Instructor
            </label>
            <input
              type="text"
              value={formData.teacher}
              onChange={e =>
                setFormData({ ...formData, teacher: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Color
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={e =>
                setFormData({ ...formData, color: e.target.value })
              }
              className="w-full h-10 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Créditos
            </label>
            <input
              type="number"
              value={formData.credits}
              onChange={e =>
                setFormData({
                  ...formData,
                  credits: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Semestre
            </label>
            <input
              type="text"
              value={formData.semester}
              onChange={e =>
                setFormData({ ...formData, semester: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2024-1"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando...' : 'Agregar Curso'}
            </button>
            <button
              type="button"
              onClick={() => toggleModal('courseModal')}
              disabled={isSubmitting}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
