// Servicio de autenticación simple para StudySync Pro v2
// Usando solo localStorage para demostración

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Usuario demo por defecto
const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@studysync.com',
  name: 'Usuario Demo',
};

class SimpleAuthService {
  private currentUser: User | null = null;

  constructor() {
    // Cargar usuario del localStorage al inicializar
    const savedUser = localStorage.getItem('studysync_current_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (error) {
        console.warn('Error loading saved user:', error);
        this.currentUser = null;
      }
    }
  }

  // Obtener usuario actual
  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  // Login simple (demo)
  async signIn(email: string, password: string): Promise<User> {
    // Para demo, cualquier email/password funciona
    const user: User = {
      id: `user-${Date.now()}`,
      email: email,
      name: email.split('@')[0],
    };

    this.currentUser = user;
    localStorage.setItem('studysync_current_user', JSON.stringify(user));
    
    return user;
  }

  // Login automático con usuario demo
  async signInDemo(): Promise<User> {
    this.currentUser = DEMO_USER;
    localStorage.setItem('studysync_current_user', JSON.stringify(DEMO_USER));
    return DEMO_USER;
  }

  // Logout
  async signOut(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('studysync_current_user');
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Obtener ID del usuario (para Convex)
  getUserId(): string {
    return this.currentUser?.id || 'anonymous';
  }
}

// Instancia singleton
export const authService = new SimpleAuthService();

// Funciones de conveniencia para compatibilidad
export const getCurrentUser = () => authService.getCurrentUser();
export const signOut = () => authService.signOut();
export type { User };
