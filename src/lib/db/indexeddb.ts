import { openDB } from 'idb';
import { Course } from '../types';

const DB_NAME = 'StudySyncDB';
const STORE_NAME = 'courses';
const DB_VERSION = 10;

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

// 🔹 Guardar curso en IndexedDB
export async function saveCourseToIndexedDB(
  course: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'user_id'>
) {
  const db = await getDb();

  const newCourse: Course = {
    ...course,
    id: crypto.randomUUID(),
    user_id: 'offline-user', // identificador fake
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.put(STORE_NAME, newCourse);
  return newCourse;
}

// 🔹 Obtener cursos desde IndexedDB
export async function getCoursesFromIndexedDB(): Promise<Course[]> {
  const db = await getDb();
  return (await db.getAll(STORE_NAME)) as Course[];
}
