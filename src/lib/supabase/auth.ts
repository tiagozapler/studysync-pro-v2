import { supabase } from './config'
import { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

export class AuthService {
  private static instance: AuthService
  private authState: AuthState = {
    user: null,
    session: null,
    loading: true,
    error: null,
  }

  private constructor() {
    this.initializeAuth()
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private async initializeAuth() {
    try {
      // Obtener sesión actual
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        this.authState.error = error
      } else {
        this.authState.session = session
        this.authState.user = session?.user || null
      }
    } catch (error) {
      console.error('Error inicializando auth:', error)
    } finally {
      this.authState.loading = false
    }

    // Escuchar cambios de autenticación
    supabase.auth.onAuthStateChange((event, session) => {
      this.authState.session = session
      this.authState.user = session?.user || null
      this.authState.loading = false

      // Disparar evento personalizado para notificar cambios
      window.dispatchEvent(
        new CustomEvent('authStateChanged', {
          detail: this.authState,
        })
      )
    })
  }

  // Iniciar sesión con email y contraseña
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        this.authState.error = error
        return { user: null, error }
      }

      this.authState.user = data.user
      this.authState.session = data.session
      this.authState.error = null

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Error en signIn:', error)
      return { user: null, error: error as AuthError }
    }
  }

  // Registrarse con email y contraseña
  async signUp(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        this.authState.error = error
        return { user: null, error }
      }

      this.authState.user = data.user
      this.authState.session = data.session
      this.authState.error = null

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Error en signUp:', error)
      return { user: null, error: error as AuthError }
    }
  }

  // Cerrar sesión
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        this.authState.error = error
        return { error }
      }

      this.authState.user = null
      this.authState.session = null
      this.authState.error = null

      return { error: null }
    } catch (error) {
      console.error('Error en signOut:', error)
      return { error: error as AuthError }
    }
  }

  // Iniciar sesión con Google
  async signInWithGoogle(): Promise<{
    user: User | null
    error: AuthError | null
  }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        this.authState.error = error
        return { user: null, error }
      }

      // Para OAuth, data.user puede ser null inicialmente
      // El usuario será redirigido a Google
      return { user: null, error: null }
    } catch (error) {
      console.error('Error en signInWithGoogle:', error)
      return { user: null, error: error as AuthError }
    }
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    return this.authState.user
  }

  // Obtener sesión actual
  getCurrentSession(): Session | null {
    return this.authState.session
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.authState.user
  }

  // Obtener estado de autenticación
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  // Verificar si está cargando
  isLoading(): boolean {
    return this.authState.loading
  }

  // Obtener error de autenticación
  getError(): AuthError | null {
    return this.authState.error
  }

  // Limpiar error
  clearError() {
    this.authState.error = null
  }

  // Restablecer contraseña
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        this.authState.error = error
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Error en resetPassword:', error)
      return { error: error as AuthError }
    }
  }
}

// Exportar instancia singleton
export const authService = AuthService.getInstance()
