import React, { useState, useRef } from 'react';
import {
  Upload,
  File,
  Folder,
  Trash2,
  Download,
  Eye,
  Brain,
  Settings,
  X,
  Calendar,
  Calculator,
} from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import { FileContentExtractor } from '../../../lib/services/FileContentExtractor';
import { AIFileAnalyzer, type FileAnalysisResult } from '../../../lib/ai/fileAnalyzer';
import env from '../../../lib/config/env';
import toast from 'react-hot-toast';

interface MaterialsSectionProps {
  courseId: string;
}

export const MaterialsSection: React.FC<MaterialsSectionProps> = ({
  courseId,
}) => {
  const { files, addFile, deleteFile, addCourseEvent, addCourseGrade } =
    useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<FileAnalysisResult | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState(
    localStorage.getItem('groqApiKey') || env.GROQ_API_KEY || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Verificación segura de files
  const safeFiles = files && typeof files === 'object' ? files : {};
  const courseFiles = Array.isArray(safeFiles[courseId]) ? safeFiles[courseId] : [];

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);
    setAiAnalysis(null);

    try {
      const analyzer = new AIFileAnalyzer(groqApiKey);
      let totalDatesFound = 0;
      let totalGradesFound = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Actualizar progreso
        setUploadProgress((i / files.length) * 90); // 90% para procesar archivos

        // Extraer contenido del archivo
        const content = await FileContentExtractor.extractContent(file);

        // Agregar archivo al store primero
        await addFile(courseId, file, []);

        // Analizar contenido con IA (Groq)
        toast.loading(`Analizando ${file.name} con IA...`, { id: `analyze-${i}` });
        const analysis = await analyzer.analyzeFile(file.name, content);
        toast.dismiss(`analyze-${i}`);
        
        setAiAnalysis(analysis);

        // Si se encontraron fechas, agregar eventos al calendario
        if (analysis.dates.length > 0) {
          totalDatesFound += analysis.dates.length;
          
          for (const dateInfo of analysis.dates) {
            // Solo agregar si la confianza es > 0.5
            if (dateInfo.confidence > 0.5) {
              // Mapear tipos del AI a tipos del sistema
              const typeMap: Record<string, 'exam' | 'assignment' | 'class' | 'meeting' | 'other'> = {
                'examen': 'exam',
                'entrega': 'assignment',
                'clase': 'class',
                'otro': 'other',
              };
              
              await addCourseEvent(courseId, {
                title: dateInfo.context || `Evento - ${file.name}`,
                description: `Detectado automáticamente en ${file.name}`,
                date: dateInfo.date,
                type: typeMap[dateInfo.type] || 'other',
              });
            }
          }
        }

        // Si se encontraron calificaciones, agregar notas
        if (analysis.grades.length > 0) {
          totalGradesFound += analysis.grades.length;
          
          for (const gradeInfo of analysis.grades) {
            await addCourseGrade(courseId, {
              name: gradeInfo.name,
              score: gradeInfo.score,
              maxScore: gradeInfo.maxScore,
              weight: gradeInfo.weight,
              type: gradeInfo.type,
            });
          }
        }
      }

      setUploadProgress(100);
      
      // Mostrar resumen de lo detectado
      const messages = [];
      if (totalDatesFound > 0) {
        messages.push(`📅 ${totalDatesFound} fecha(s) detectada(s)`);
      }
      if (totalGradesFound > 0) {
        messages.push(`📊 ${totalGradesFound} calificación(es) detectada(s)`);
      }
      
      if (messages.length > 0) {
        toast.success(`✅ Análisis completado:\n${messages.join('\n')}`, {
          duration: 5000,
        });
      } else {
        toast.success('Archivo(s) subido(s) correctamente');
      }
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Error al subir archivos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile(courseId, fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleDownloadFile = (file: any) => {
    if (file.blob) {
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSaveGroqKey = () => {
    if (!groqApiKey) {
      toast.error('Ingresa una clave válida de Groq.');
      return;
    }

    localStorage.setItem('groqApiKey', groqApiKey);
    setShowAISettings(false);
    toast.success('Clave de Groq guardada');
  };


  const systemInfo = {
    groq: Boolean(groqApiKey),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Materiales del Curso
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAISettings(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Brain className="w-4 h-4 mr-2" />
            Configurar IA
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir Archivos
          </button>
        </div>
      </div>

      {/* Estado de IA */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="h-5 w-5 text-purple-600 mr-2" />
            <h4 className="text-sm font-medium text-gray-900">
              Estado de Groq
            </h4>
          </div>
          <div className="flex space-x-2">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                systemInfo.groq
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              Groq: {systemInfo.groq ? 'Activo' : 'Sin clave'}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Configura tu clave de Groq en el asistente de cada curso para obtener respuestas rápidas y precisas.
        </p>
      </div>

      {/* Área de drag & drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Arrastra archivos aquí o{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              selecciona archivos
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, Word, Excel, PowerPoint, imágenes y más
          </p>
        </div>
      </div>

      {/* Barra de progreso */}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Resultados del análisis de IA */}
      {aiAnalysis && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center mb-3">
            <Brain className="h-5 w-5 text-purple-600 mr-2" />
            <h4 className="text-sm font-medium text-gray-900">
              Análisis de IA
            </h4>
          </div>

          {/* Resumen */}
          {aiAnalysis.summary && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 mb-1">Resumen</h5>
              <p className="text-sm text-gray-600">{aiAnalysis.summary}</p>
            </div>
          )}

          {/* Fechas */}
          {aiAnalysis.dates.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                <h5 className="text-xs font-medium text-gray-700">
                  📅 {aiAnalysis.dates.length} Fecha(s) Detectada(s) y Agregada(s) al Calendario
                </h5>
              </div>
              <div className="space-y-2">
                {aiAnalysis.dates.map((dateInfo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {dateInfo.date.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="ml-3 inline-flex px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {dateInfo.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {dateInfo.context}
                      </p>
                      <span className="text-xs text-gray-500 mt-1">
                        Confianza: {Math.round(dateInfo.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calificaciones */}
          {aiAnalysis.grades.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Calculator className="h-4 w-4 text-green-600 mr-2" />
                <h5 className="text-xs font-medium text-gray-700">
                  📊 {aiAnalysis.grades.length} Calificación(es) Detectada(s) y Agregada(s)
                </h5>
              </div>
              <div className="space-y-2">
                {aiAnalysis.grades.map((grade, index) => (
                  <div
                    key={index}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {grade.name}
                      </span>
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {grade.type}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                      <span>
                        Puntuación: <strong>{grade.score}/{grade.maxScore}</strong>
                      </span>
                      <span>
                        Peso: <strong>{grade.weight}%</strong>
                      </span>
                      <span>
                        {Math.round((grade.score / grade.maxScore) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de archivos */}
      {courseFiles.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">
              Archivos ({courseFiles.length})
            </h4>
          </div>
          <ul className="divide-y divide-gray-200">
            {courseFiles.map(file => (
              <li key={file.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {file.size
                          ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                          : 'Tamaño desconocido'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadFile(file)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Descargar"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
      />

      {/* Modal de configuración de IA */}
      {showAISettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4 border border-purple-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" /> Configuración de Groq
              </h3>
              <button
                onClick={() => setShowAISettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  API Key de Groq
                </label>
                <input
                  type="password"
                  value={groqApiKey}
                  onChange={e => setGroqApiKey(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  placeholder="gsk_..."
                />
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-sm text-purple-900">
                <h4 className="font-semibold mb-2">¿Dónde obtengo la clave?</h4>
                <p>
                  Consigue tu API key gratuita en
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:text-purple-800 ml-1"
                  >
                    console.groq.com
                  </a>
                </p>
              </div>

              <button
                onClick={handleSaveGroqKey}
                disabled={!groqApiKey.trim()}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar clave
              </button>

              <div className="text-xs text-gray-500">
                La clave se guarda localmente en tu navegador y puedes cambiarla o borrarla cuando quieras.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
