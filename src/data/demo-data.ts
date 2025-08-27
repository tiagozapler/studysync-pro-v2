import { type Course } from '../lib/db/database';
import { colorUtils, idUtils } from '../lib/utils';

// Conectar IA real aquí - datos de demostración para testing
export const demoCourses: Omit<Course, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'calc1',
    name: 'CÁLCULO DIFERENCIAL',
    teacher: 'Dr. María González',
    color: '#3B82F6',
    credits: 4,
    semester: '2024-I',
    archived: false
  },
  {
    id: 'physics',
    name: 'FÍSICA GENERAL',
    teacher: 'Prof. Carlos Mendoza',
    color: '#10B981',
    credits: 5,
    semester: '2024-I',
    archived: false
  },
  {
    id: 'programming',
    name: 'PROGRAMACIÓN ORIENTADA A OBJETOS',
    teacher: 'Ing. Ana Torres',
    color: '#EF4444',
    credits: 3,
    semester: '2024-I',
    archived: false
  },
  {
    id: 'statistics',
    name: 'ESTADÍSTICA APLICADA',
    teacher: 'Dr. Luis Ramírez',
    color: '#FACC15',
    credits: 3,
    semester: '2024-I',
    archived: false
  },
  {
    id: 'databases',
    name: 'BASES DE DATOS',
    teacher: 'Ing. Patricia Silva',
    color: '#8B5CF6',
    credits: 4,
    semester: '2024-I',
    archived: false
  }
];

// Persistencia aquí - función para cargar datos de demo
export async function loadDemoData() {
  try {
    const { db } = await import('../lib/db/database');
    const { storage } = await import('../lib/storage/localStorage');
    
    // Verificar si ya se cargaron datos demo
    if (storage.isDemoLoaded()) {
      console.log('📋 Datos demo ya cargados previamente');
      return;
    }
    
    // Cargar cursos demo
    const coursesToAdd = demoCourses.map(course => ({
      ...course,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    await db.courses.bulkAdd(coursesToAdd);
    
    // Marcar como cargados
    storage.setDemoLoaded(true);
    
    console.log('✅ Datos demo cargados correctamente');
    
  } catch (error) {
    console.error('❌ Error cargando datos demo:', error);
  }
}

// Función para limpiar datos demo
export async function clearDemoData() {
  try {
    const { db } = await import('../lib/db/database');
    const { storage } = await import('../lib/storage/localStorage');
    
    await db.transaction('rw', [db.courses, db.files, db.notes, db.events, db.todos, db.quickNotes], async () => {
      await db.courses.clear();
      await db.files.clear();
      await db.notes.clear();
      await db.events.clear();
      await db.todos.clear();
      await db.quickNotes.clear();
    });
    
    storage.setDemoLoaded(false);
    
    console.log('🗑️ Datos demo eliminados');
    
  } catch (error) {
    console.error('❌ Error eliminando datos demo:', error);
  }
}
