// Configuración de variables de entorno
export const env = {
  // Supabase Configuration
  SUPABASE_URL:
    import.meta.env.VITE_SUPABASE_URL ||
    'https://igpczyvkmdxfzpfojmip.supabase.co',
  SUPABASE_ANON_KEY:
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlncGN6eXZrbWR4ZnpwZm9qbWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTYzNTcsImV4cCI6MjA3MTg5MjM1N30.oqXRA7tABI897C7Jo6SEGGlr_QeZpVg1IW-6t7J_24k',

  // AI Configuration
  HUGGING_FACE_TOKEN:
    import.meta.env.VITE_HUGGING_FACE_TOKEN ||
    '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',

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
