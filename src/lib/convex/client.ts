import { ConvexReactClient } from "convex/react";

// URL de tu deployment de Convex
const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

if (!convexUrl) {
  throw new Error("❌ VITE_CONVEX_URL no está configurada en .env.local");
}

// Crear cliente de Convex
export const convex = new ConvexReactClient(convexUrl);

// Log de configuración (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log("🔧 Convex configurado:", {
    url: convexUrl,
  });
}

// Exportar globalmente para debugging
if (typeof window !== "undefined") {
  (window as any).convex = convex;
}
