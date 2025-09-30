# Importar StudySync Pro a Lovable

## 📋 Información del Proyecto

- **Framework**: React 18 + TypeScript + Vite
- **Backend**: Convex (BaaS)
- **Styling**: Tailwind CSS
- **Estado**: Zustand
- **UI Components**: Radix UI, Lucide Icons

## 🗂️ Estructura del Proyecto

```
src/
├── features/          # Módulos principales (ai, courses, calendar, etc.)
├── components/        # Componentes compartidos
├── lib/              # Servicios, utilidades, configuración
├── pages/            # Páginas de la aplicación
└── styles/           # Estilos globales

convex/               # Backend (Convex)
├── courses.ts        # Funciones de cursos
├── files.ts          # Funciones de archivos
└── schema.ts         # Schema de base de datos
```

## 🔑 Variables de Entorno Necesarias

Copia el archivo `env.example` y crea un `.env`:

```bash
# Convex (obligatorio)
VITE_CONVEX_URL=tu_url_de_convex

# AI Services (opcional)
VITE_GROQ_API_KEY=tu_api_key_de_groq
VITE_OPENAI_API_KEY=tu_api_key_de_openai
```

## 🚀 Comandos Principales

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Iniciar Convex (en terminal separada)
npx convex dev

# Build
npm run build
```

## ⚠️ Notas Importantes para Lovable

1. **Convex Backend**: Este proyecto usa Convex como backend. Necesitarás:
   - Crear una cuenta en Convex.dev
   - Ejecutar `npx convex dev` para vincular el proyecto
   - Configurar la variable `VITE_CONVEX_URL`

2. **PDF.js Worker**: El proyecto incluye un worker para PDFs en `public/pdf.worker.min.js`

3. **Service Worker**: Hay un service worker en `public/sw.js` para PWA

4. **Dependencias Principales**:
   - React 18.3.1
   - TypeScript 5.6.2
   - Vite 5.4.8
   - Convex 1.16.5
   - Tailwind CSS 3.4.13

## 📦 Archivos a Ignorar

Los siguientes archivos/carpetas no son necesarios para Lovable:

- `node_modules/`
- `dist/`
- `.env` (usar variables de entorno de Lovable)
- `*.bat`, `*.ps1` (scripts de Windows)
- Archivos temporales: `colors_temp.txt`, `missing_colors.txt`, etc.

## 🔄 Proceso de Importación

1. Ve a [lovable.dev](https://lovable.dev)
2. Crea un nuevo proyecto → "Import from GitHub"
3. Selecciona el repositorio: `tiagozapler/studysync-pro-v2`
4. Configura las variables de entorno en Lovable
5. Lovable detectará automáticamente Vite + React

## 🐛 Solución de Problemas

- Si Lovable no detecta el proyecto correctamente, asegúrate de que `package.json` esté en la raíz
- Si hay errores de TypeScript, Lovable puede necesitar ejecutar `npm install` primero
- Para Convex, puede que necesites reconfigurarlo en el nuevo entorno

## 📧 Contacto

Si tienes problemas con la importación, revisa la documentación de Lovable o contacta su soporte.
