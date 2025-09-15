import { supabase } from './client';

/**
 * Verifica la conexión a Supabase
 * @returns Promise<boolean> - true si la conexión es exitosa
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🔄 Probando conexión a Supabase...');
    
    // Verificar variables de entorno
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables de entorno de Supabase faltantes');
      return false;
    }
    
    console.log('✅ Variables de entorno encontradas');
    
    // Probar conexión con una consulta simple
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error en consulta a Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    console.log('📊 Datos de prueba:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando conexión a Supabase:', error);
    return false;
  }
}

/**
 * Verifica que todas las tablas existan
 * @returns Promise<boolean> - true si todas las tablas existen
 */
export async function testTables(): Promise<boolean> {
  try {
    console.log('🔄 Verificando existencia de tablas...');
    
    const tables = ['courses', 'files', 'grades', 'events', 'notes', 'todos', 'quick_notes'];
    const results = await Promise.allSettled(
      tables.map(table => 
        supabase
          .from(table)
          .select('*')
          .limit(1)
      )
    );
    
    const failed = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && result.value.error)
    );
    
    if (failed.length > 0) {
      console.error('❌ Algunas tablas no existen o tienen errores:', failed);
      return false;
    }
    
    console.log('✅ Todas las tablas existen y son accesibles');
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando tablas:', error);
    return false;
  }
}

/**
 * Verifica la autenticación
 * @returns Promise<boolean> - true si hay un usuario autenticado
 */
export async function testAuth(): Promise<boolean> {
  try {
    console.log('🔄 Verificando autenticación...');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Error obteniendo usuario:', error.message);
      return false;
    }
    
    if (!user) {
      console.log('⚠️ No hay usuario autenticado');
      return false;
    }
    
    console.log('✅ Usuario autenticado:', user.email);
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando autenticación:', error);
    return false;
  }
}

/**
 * Ejecuta todas las pruebas de Supabase
 * @returns Promise<{connection: boolean, tables: boolean, auth: boolean}>
 */
export async function runAllTests() {
  console.log('🚀 Iniciando pruebas de Supabase...');
  
  const connection = await testConnection();
  const tables = await testTables();
  const auth = await testAuth();
  
  const allPassed = connection && tables && auth;
  
  console.log('📊 Resultados de las pruebas:');
  console.log(`  Conexión: ${connection ? '✅' : '❌'}`);
  console.log(`  Tablas: ${tables ? '✅' : '❌'}`);
  console.log(`  Autenticación: ${auth ? '✅' : '❌'}`);
  console.log(`  Estado general: ${allPassed ? '✅' : '❌'}`);
  
  return { connection, tables, auth, allPassed };
}

// Exportar para uso en consola del navegador
if (typeof window !== 'undefined') {
  (window as any).testSupabase = {
    testConnection,
    testTables,
    testAuth,
    runAllTests
  };
}
