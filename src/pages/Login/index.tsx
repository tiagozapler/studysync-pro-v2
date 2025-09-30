import React from 'react';
import { LogIn } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4">
      <div className="w-full max-w-md card p-8 border">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Bienvenido</h1>
          <p className="mt-2 text-subtle">Inicia sesión para continuar</p>
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-subtle">Email</label>
            <input type="email" className="input w-full" placeholder="tucorreo@ejemplo.com" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-subtle">Contraseña</label>
            <input type="password" className="input w-full" placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2">
            <LogIn size={18} />
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <a href="#" className="text-sm link-accent">¿Olvidaste tu contraseña?</a>
        </div>
      </div>
    </div>
  );
}
