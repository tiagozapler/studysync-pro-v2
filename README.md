# StudySync Pro 2.0

> 🎓 **Asistente académico profesional con IA local y almacenamiento offline**

Una aplicación web académica completamente **GRATUITA** y **offline-first** diseñada para estudiantes universitarios. Sin servicios de pago, sin backend externo, todos los datos almacenados de forma segura en tu dispositivo.

## ✨ Características Principales

### 🔒 **100% Privado y Offline**
- **Sin backend**: Todos los datos permanecen en tu dispositivo
- **Sin servicios de pago**: Funciona completamente gratis
- **PWA**: Instalable como app nativa, funciona sin conexión
- **IndexedDB**: Almacenamiento robusto para archivos y datos

### 📚 **Gestión Académica Completa**
- **CRUD de cursos**: Agregar, editar, archivar cursos con colores personalizados
- **Materiales**: Subida de PDFs, PPTs, documentos con organización por etiquetas
- **Sistema de notas**: Cálculo automático de promedios y simulaciones
- **Calendario académico**: Eventos, recordatorios y planificación semestral
- **Tareas y todos**: Gestión de pendientes por curso
- **Notas rápidas**: Bloc de notas interno con categorías

### 🤖 **IA Gratuita (3 Adaptadores)**
- **MOCK**: Simulación para testing (activo por defecto)
- **WebLLM**: IA en navegador usando WebGPU (modelos cuantizados)
- **Ollama**: Conexión a IA local (localhost:11434)
- **RAG Local**: Embeddings con transformers.js para búsqueda semántica

## 🚀 Inicio Rápido

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🛠️ Stack Tecnológico

- **React 18** + **TypeScript** + **Vite**
- **TailwindCSS** - Tema oscuro profesional
- **Zustand** - Estado global
- **Dexie.js** - Base de datos IndexedDB
- **PWA** - Service Worker + Manifest

## ⌨️ Atajos de Teclado

- `Ctrl+K` - Command Palette
- `Ctrl+1` - Dashboard
- `Ctrl+2` - Calendario
- `Espacio` - Iniciar/Pausar Pomodoro (modo focus)

## 🔧 Características Implementadas

✅ **Funcionalidades Core**
- [x] Gestión de cursos (CRUD completo)
- [x] Dashboard con estadísticas
- [x] Sistema de notas rápidas
- [x] Navegación con Command Palette
- [x] Modo Focus con Pomodoro
- [x] PWA con Service Worker
- [x] Almacenamiento local persistente

✅ **UI/UX**
- [x] Tema oscuro profesional
- [x] Diseño cuadrado/minimalista
- [x] Responsive design
- [x] Navegación por teclado
- [x] Loading states y error boundaries

🚧 **En Desarrollo** (Placeholders implementados)
- [ ] Gestión de archivos completa
- [ ] Sistema de notas académicas
- [ ] Calendario con eventos
- [ ] Búsqueda global
- [ ] Adaptadores IA (WebLLM, Ollama)
- [ ] RAG local con embeddings

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes UI reutilizables
├── features/           # Funcionalidades por dominio
├── lib/                # Librerías y utilidades
├── pages/              # Páginas principales
├── styles/             # Estilos globales
└── data/               # Datos de demostración
```

## 🎨 Diseño

- **Fondo**: `#0B0F17` (Negro profundo)
- **Texto**: `#F9FAFB` (Blanco suave)
- **Colores de curso**: Vibrantes diferenciados
- **Bordes**: Mínimamente redondeados (max 6px)
- **Sombras**: Duras, sin difuminado

## 📄 Licencia

MIT License - Software libre y gratuito.

---

**¡Aplicación académica moderna, privada y completamente offline!**