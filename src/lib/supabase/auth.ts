import { supabase } from './client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthError {
  message: string;
  status?: number;
}

export interface SignUpData {
  email: string;
  password: string;
  metadata?: {
    name?: string;
  };
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Registra un nuevo usuario
 */
export async function signUp(
  data: SignUpData
): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: data.metadata,
      },
    });

    if (error) {
      return {
        user: null,
        error: { message: error.message, status: error.status },
      };
    }

    return { user: authData.user, error: null };
  } catch (err) {
    return {
      user: null,
      error: { message: 'Error inesperado durante el registro' },
    };
  }
}

/**
 * Inicia sesión de un usuario
 */
export async function signIn(
  data: SignInData
): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        user: null,
        error: { message: error.message, status: error.status },
      };
    }

    return { user: authData.user, error: null };
  } catch (err) {
    return {
      user: null,
      error: { message: 'Error inesperado durante el inicio de sesión' },
    };
  }
}

/**
 * Cierra la sesión del usuario actual
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: { message: error.message, status: error.status } };
    }

    return { error: null };
  } catch (err) {
    return {
      error: { message: 'Error inesperado durante el cierre de sesión' },
    };
  }
}

/**
 * Obtiene el usuario actual
 */
export async function getCurrentUser(): Promise<{
  user: User | null;
  error: AuthError | null;
}> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return {
        user: null,
        error: { message: error.message, status: error.status },
      };
    }

    return { user, error: null };
  } catch (err) {
    return {
      user: null,
      error: { message: 'Error inesperado al obtener usuario actual' },
    };
  }
}

/**
 * Obtiene la sesión actual
 */
export async function getCurrentSession(): Promise<{
  session: Session | null;
  error: AuthError | null;
}> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return {
        session: null,
        error: { message: error.message, status: error.status },
      };
    }

    return { session, error: null };
  } catch (err) {
    return {
      session: null,
      error: { message: 'Error inesperado al obtener sesión actual' },
    };
  }
}

/**
 * Escucha cambios en el estado de autenticación
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Verifica si el usuario está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const { user } = await getCurrentUser();
  return user !== null;
}
