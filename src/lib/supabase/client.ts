import { createClient } from '@supabase/supabase-js'

// Variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Validar variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Variables de entorno de Supabase faltantes. Verifica .env.local')
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Log de configuración (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase configurado:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
  })
}

// Exportar globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase
}
