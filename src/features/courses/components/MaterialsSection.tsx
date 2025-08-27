import React, { useState, useRef } from 'react';
import { Upload, File, Folder, Trash2, Download, Eye, Brain, Settings } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import { FileContentExtractor } from '../../../lib/services/FileContentExtractor';
import { AIService, AIAnalysisResult } from '../../../lib/services/AIService';

interface MaterialsSectionProps {
  courseId: string;
}

export const MaterialsSection: React.FC<MaterialsSectionProps> = ({ courseId }) => {
  const { files, addFile, deleteFile, addCourseEvent, addCourseGrade } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [huggingFaceToken, setHuggingFaceToken] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const courseFiles = files[courseId] || [];
  const aiService = AIService.getInstance();

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);
    setAiAnalysis(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Actualizar progreso
        setUploadProgress((i / files.length) * 100);

        // Extraer contenido del archivo
        const content = await FileContentExtractor.extractContent(file);
        
        // Analizar contenido con IA
        const analysis = await aiService.analyzeFileContent(content, file.name);
        setAiAnalysis(analysis);
        
        // Agregar archivo al store
        await addFile(courseId, file, []);
        
        // Si se encontraron fechas, agregar eventos al calendario
        if (analysis.dates.length > 0) {
          for (const dateInfo of analysis.dates) {
            await addCourseEvent(courseId, {
              title: `${file.name} - ${dateInfo.type}`,
              description: `Fecha importante encontrada en ${file.name}: ${dateInfo.context}`,
              date: dateInfo.date,
              type: 'assignment',
              priority: 'medium',
              source: 'auto-detected',
              sourceFile: file.name
            });
          }
        }
        
        // Si se encontraron calificaciones, agregar notas
        if (analysis.grades.length > 0) {
          for (const gradeInfo of analysis.grades) {
            await addCourseGrade(courseId, {
              name: gradeInfo.name,
              score: gradeInfo.score,
              maxScore: gradeInfo.maxScore,
              weight: gradeInfo.weight,
              type: gradeInfo.type as 'exam' | 'quiz' | 'project' | 'homework' | 'participation' | 'other',
            });
          }
        }
      }
      
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error('Error uploading files:', error);
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

  const handleSaveHuggingFaceToken = () => {
    aiService.setHuggingFaceToken(huggingFaceToken);
    setShowAISettings(false);
    setHuggingFaceToken('');
  };

  const getSystemInfo = () => {
    return aiService.getSystemInfo();
  };

  const systemInfo = getSystemInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Materiales del Curso</h3>
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
            <h4 className="text-sm font-medium text-gray-900">Estado de la IA</h4>
          </div>
          <div className="flex space-x-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              systemInfo.ollama ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              Ollama: {systemInfo.ollama ? 'Disponible' : 'No disponible'}
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              systemInfo.hasToken ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              Hugging Face: {systemInfo.hasToken ? 'Configurado' : 'Sin token'}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          La IA analizará automáticamente el contenido de los archivos para extraer fechas, calificaciones y información importante.
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
            <h4 className="text-sm font-medium text-gray-900">Análisis de IA</h4>
          </div>
          
          {/* Resumen */}
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-700 mb-1">Resumen</h5>
            <p className="text-sm text-gray-600">{aiAnalysis.summary}</p>
          </div>

          {/* Temas */}
          {aiAnalysis.topics.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 mb-1">Temas Identificados</h5>
              <div className="flex flex-wrap gap-2">
                {aiAnalysis.topics.map((topic, index) => (
                  <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fechas */}
          {aiAnalysis.dates.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 mb-1">Fechas Importantes</h5>
              <div className="space-y-2">
                {aiAnalysis.dates.map((dateInfo, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {dateInfo.date.toLocaleDateString()}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {dateInfo.type} • {Math.round(dateInfo.confidence * 100)}% confianza
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">{dateInfo.context}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calificaciones */}
          {aiAnalysis.grades.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 mb-1">Calificaciones Detectadas</h5>
              <div className="space-y-2">
                {aiAnalysis.grades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{grade.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {grade.score}/{grade.maxScore} • {grade.weight}% peso • {Math.round(grade.confidence * 100)}% confianza
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">{grade.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información importante */}
          {aiAnalysis.importantInfo.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-1">Información Importante</h5>
              <div className="space-y-2">
                {aiAnalysis.importantInfo.map((info, index) => (
                  <div key={index} className="p-2 bg-yellow-50 border-l-4 border-yellow-400">
                    <p className="text-sm text-gray-700">{info}</p>
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
            {courseFiles.map((file) => (
              <li key={file.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Tamaño desconocido'}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Brain className="h-5 w-5 text-purple-600 mr-2" />
                Configurar IA
              </h3>
              
              <div className="space-y-4">
                {/* Ollama */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Ollama (Local - Gratuito)</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Instala Ollama en tu computadora para usar IA local gratuita.
                  </p>
                  <a
                    href="https://ollama.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-500"
                  >
                    Descargar Ollama →
                  </a>
                </div>

                {/* Hugging Face */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Hugging Face (API Gratuita)</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Obtén un token gratuito de Hugging Face para usar IA en la nube.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Token de Hugging Face"
                      value={huggingFaceToken}
                      onChange={(e) => setHuggingFaceToken(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <a
                      href="https://huggingface.co/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-500 block"
                    >
                      Obtener Token →
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSaveHuggingFaceToken}
                  disabled={!huggingFaceToken.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar Token
                </button>
                <button
                  onClick={() => setShowAISettings(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
