import React, { useState, useRef } from 'react'
import { Upload, Folder, File, Trash2, Edit3, Plus, Tag } from 'lucide-react'
import { useAppStore } from '../../../lib/store'
import { FileRecord } from '../../../lib/db/database'

interface MaterialsSectionProps {
  courseId: string
}

export function MaterialsSection({ courseId }: MaterialsSectionProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingMaterial, setEditingMaterial] = useState<FileRecord | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Obtener materiales del curso desde el store
  const courseMaterials = useAppStore(state => state.files[courseId] || [])

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Agregar material al store
        await useAppStore.getState().addCourseMaterial(courseId, {
          name: file.name,
          type: 'file',
          size: file.size,
          tags: [],
          parentId: selectedFolder || undefined,
          mimeType: file.type,
          fileUrl: URL.createObjectURL(file), // Temporal, en producción se subiría al servidor
        })

        // TODO: Subir archivo al servidor (Supabase Storage)
        // const { data, error } = await supabase.storage
        //   .from('course-materials')
        //   .upload(`${courseId}/${file.name}`, file);
      }
    } catch (error) {
      console.error('Error subiendo archivos:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    await useAppStore.getState().addCourseMaterial(courseId, {
      name: newFolderName,
      type: 'folder',
      tags: [],
      parentId: selectedFolder || undefined,
    })

    setNewFolderName('')
    setShowNewFolderModal(false)
  }

  const handleDeleteMaterial = async (materialId: string) => {
    await useAppStore.getState().deleteCourseMaterial(courseId, materialId)
  }

  const handleEditMaterial = (material: FileRecord) => {
    setEditingMaterial(material)
  }

  const getCurrentMaterials = () => {
    const allMaterials = courseMaterials.filter(m => m.type === 'file')
    if (selectedFolder) {
      return allMaterials.filter(m => m.parentId === selectedFolder)
    }
    return allMaterials.filter(m => !m.parentId)
  }

  const getCurrentFolders = () => {
    const allFolders = courseMaterials.filter(m => m.type === 'folder')
    if (selectedFolder) {
      return allFolders.filter(f => f.parentId === selectedFolder)
    }
    return allFolders.filter(f => !f.parentId)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation'))
      return '📊'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('text')) return '📄'
    return '📎'
  }

  return (
    <div className='h-full flex flex-col bg-dark-bg-primary'>
      {/* Header */}
      <div className='p-4 border-b border-dark-border bg-dark-bg-secondary'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold text-dark-text-primary'>
            Materiales del Curso
          </h2>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className='btn-secondary flex items-center gap-2'
            >
              <Folder size={16} />
              Nueva Carpeta
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className='btn-primary flex items-center gap-2'
            >
              <Upload size={16} />
              {isUploading ? 'Subiendo...' : 'Subir Archivos'}
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        {selectedFolder && (
          <div className='flex items-center gap-2 mt-2 text-sm text-dark-text-muted'>
            <button
              onClick={() => setSelectedFolder(null)}
              className='hover:text-dark-text-primary'
            >
              Materiales
            </button>
            <span>/</span>
            <span className='text-dark-text-primary'>
              {getCurrentFolders().find(f => f.id === selectedFolder)?.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-4'>
        {/* Folders */}
        {getCurrentFolders().length > 0 && (
          <div className='mb-6'>
            <h3 className='text-sm font-medium text-dark-text-secondary mb-3'>
              Carpetas
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
              {getCurrentFolders().map(folder => (
                <div
                  key={folder.id}
                  className='bg-dark-bg-secondary border border-dark-border rounded-lg p-3 hover:border-course-blue transition-colors cursor-pointer'
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <div className='flex items-center gap-3'>
                    <Folder size={24} className='text-course-blue' />
                    <div className='flex-1 min-w-0'>
                      <h4 className='font-medium text-dark-text-primary truncate'>
                        {folder.name}
                      </h4>
                      <p className='text-xs text-dark-text-muted'>
                        {
                          courseMaterials.filter(
                            m => m.type === 'file' && m.parentId === folder.id
                          ).length
                        }{' '}
                        archivos
                      </p>
                    </div>
                    <div className='flex gap-1'>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleEditMaterial(folder)
                        }}
                        className='p-1 text-dark-text-muted hover:text-dark-text-primary'
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleDeleteMaterial(folder.id)
                        }}
                        className='p-1 text-dark-text-muted hover:text-danger'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        <div>
          <h3 className='text-sm font-medium text-dark-text-secondary mb-3'>
            Archivos
          </h3>
          {getCurrentMaterials().length === 0 ? (
            <div className='text-center py-8'>
              <File size={48} className='mx-auto text-dark-text-muted mb-4' />
              <p className='text-dark-text-muted'>
                No hay archivos en esta carpeta
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className='btn-primary mt-4'
              >
                Subir archivos
              </button>
            </div>
          ) : (
            <div className='space-y-2'>
              {getCurrentMaterials().map(material => (
                <div
                  key={material.id}
                  className='bg-dark-bg-secondary border border-dark-border rounded-lg p-3 hover:border-course-blue transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <span className='text-2xl'>
                      {getFileIcon(material.mimeType || '')}
                    </span>
                    <div className='flex-1 min-w-0'>
                      <h4 className='font-medium text-dark-text-primary truncate'>
                        {material.name}
                      </h4>
                      <div className='flex items-center gap-4 text-xs text-dark-text-muted'>
                        <span>{formatFileSize(material.size || 0)}</span>
                        <span>{material.createdAt.toLocaleDateString()}</span>
                        {material.tags.length > 0 && (
                          <div className='flex gap-1'>
                            {material.tags.map(tag => (
                              <span
                                key={tag}
                                className='px-2 py-1 bg-dark-bg-tertiary rounded text-xs'
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='flex gap-1'>
                      <button
                        onClick={() => handleEditMaterial(material)}
                        className='p-1 text-dark-text-muted hover:text-dark-text-primary'
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
                        className='p-1 text-dark-text-muted hover:text-danger'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        multiple
        accept='.pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif'
        onChange={handleFileUpload}
        className='hidden'
      />

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-dark-bg-secondary p-6 rounded-lg shadow-modal max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold text-dark-text-primary mb-4'>
              Crear Nueva Carpeta
            </h3>
            <input
              type='text'
              placeholder='Nombre de la carpeta'
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className='w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-course-blue'
              autoFocus
            />
            <div className='flex gap-2 mt-4'>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className='btn-secondary flex-1'
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className='btn-primary flex-1 disabled:opacity-50'
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {editingMaterial && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-dark-bg-secondary p-6 rounded-lg shadow-modal max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold text-dark-text-primary mb-4'>
              Editar {editingMaterial.type === 'folder' ? 'Carpeta' : 'Archivo'}
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-dark-text-secondary mb-2'>
                  Nombre
                </label>
                <input
                  type='text'
                  value={editingMaterial.name}
                  onChange={e =>
                    setEditingMaterial(prev =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  className='w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-dark-text-secondary mb-2'>
                  Etiquetas (separadas por comas)
                </label>
                <input
                  type='text'
                  value={editingMaterial.tags.join(', ')}
                  onChange={e =>
                    setEditingMaterial(prev =>
                      prev
                        ? {
                            ...prev,
                            tags: e.target.value
                              .split(',')
                              .map(t => t.trim())
                              .filter(t => t),
                          }
                        : null
                    )
                  }
                  className='w-full bg-dark-bg-primary border border-dark-border rounded-lg px-3 py-2 text-dark-text-primary focus:outline-none focus:border-course-blue'
                  placeholder='Semana 1, Examen, Importante'
                />
              </div>
            </div>
            <div className='flex gap-2 mt-6'>
              <button
                onClick={() => setEditingMaterial(null)}
                className='btn-secondary flex-1'
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (editingMaterial) {
                    await useAppStore
                      .getState()
                      .updateCourseMaterial(courseId, editingMaterial.id, {
                        name: editingMaterial.name,
                        tags: editingMaterial.tags,
                      })
                  }
                  setEditingMaterial(null)
                }}
                className='btn-primary flex-1'
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
