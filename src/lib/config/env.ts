// Configuración de variables de entorno
export const env = {
  // Supabase Configuration
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,

  // AI Configuration
  HUGGING_FACE_TOKEN: import.meta.env.VITE_HUGGING_FACE_TOKEN || '',

  // Environment
  NODE_ENV: import.meta.env.MODE || 'development',
  IS_DEVELOPMENT: import.meta.env.DEV || false,
  IS_PRODUCTION: import.meta.env.PROD || false,
} as const;

// Verificar configuración
export const validateEnv = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !env[key as keyof typeof env]);

  if (missing.length > 0) {
    console.warn('⚠️ Variables de entorno faltantes:', missing);
    return false;
  }

  console.log('✅ Variables de entorno cargadas correctamente');
  return true;
};

// Exportar configuración validada
export default env;
