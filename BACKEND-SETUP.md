# 🚀 Configuración del Backend con Supabase

## **¿Qué es Supabase?**

Supabase es un **backend-as-a-service** gratuito que te proporciona:

- ✅ **Base de datos PostgreSQL** (500MB gratis)
- ✅ **Autenticación de usuarios** (email/password + Google)
- ✅ **API REST automática**
- ✅ **Row Level Security** (RLS) para privacidad
- ✅ **Sincronización en tiempo real**
- ✅ **Backup automático**

## **📋 PASOS PARA CONFIGURAR SUPABASE**

### **PASO 1: Crear Proyecto en Supabase**

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Inicia sesión con GitHub o Google
4. Haz clic en "New Project"
5. Completa la información:
   - **Name**: `studysync-pro`
   - **Database Password**: Crea una contraseña segura
   - **Region**: Elige la más cercana a ti
6. Haz clic en "Create new project"
7. Espera 2-3 minutos a que se configure

### **PASO 2: Obtener Credenciales**

1. En tu proyecto, ve a **Settings** → **API**
2. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **PASO 3: Configurar Variables de Entorno**

1. Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# AI Configuration
VITE_HUGGING_FACE_TOKEN=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
```

2. Reemplaza con tus credenciales reales

### **PASO 4: Configurar Base de Datos**

1. En Supabase, ve a **SQL Editor**
2. Copia y pega el contenido de `supabase-schema.sql`
3. Haz clic en **Run** para ejecutar el script
4. Verifica que se crearon las tablas en **Table Editor**

### **PASO 5: Configurar Autenticación**

1. Ve a **Authentication** → **Settings**
2. En **Site URL**, agrega: `http://localhost:3000`
3. En **Redirect URLs**, agrega:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-password`
4. Guarda los cambios

### **PASO 6: Configurar Google OAuth (Opcional)**

1. Ve a **Authentication** → **Providers**
2. Habilita **Google**
3. Configura OAuth en [Google Cloud Console](https://console.cloud.google.com)
4. Agrega las credenciales de Google

## **🔧 FUNCIONALIDADES DEL BACKEND**

### **Autenticación**

- ✅ Registro con email/password
- ✅ Inicio de sesión con email/password
- ✅ Inicio de sesión con Google
- ✅ Restablecimiento de contraseña
- ✅ Sesiones persistentes

### **Base de Datos**

- ✅ **Cursos**: Nombre, profesor, créditos, semestre, color
- ✅ **Archivos**: Nombre, tipo, tamaño, contenido, curso
- ✅ **Calificaciones**: Nombre, puntaje, peso, tipo, curso
- ✅ **Eventos**: Título, descripción, fecha, hora, prioridad
- ✅ **Notas**: Título, contenido, curso

### **Seguridad**

- ✅ **Row Level Security** (RLS) habilitado
- ✅ Usuarios solo ven sus propios datos
- ✅ Políticas de acceso por usuario
- ✅ Validación de autenticación

### **Sincronización**

- ✅ Datos sincronizados entre dispositivos
- ✅ Backup automático en la nube
- ✅ API REST para integraciones futuras

## **📱 CÓMO USAR EN LA APLICACIÓN**

### **Antes (Sin Backend)**

```typescript
// Los datos se guardaban solo en el navegador
const courses = localStorage.getItem('courses');
```

### **Ahora (Con Supabase)**

```typescript
// Los datos se guardan en la nube y se sincronizan
const courses = await databaseService.getCourses();
```

## **🚀 BENEFICIOS IMPLEMENTADOS**

1. **✅ Sincronización entre dispositivos**
2. **✅ Backup automático en la nube**
3. **✅ Autenticación segura de usuarios**
4. **✅ Base de datos PostgreSQL robusta**
5. **✅ API REST automática**
6. **✅ Seguridad con RLS**
7. **✅ Escalabilidad automática**

## **💰 PLAN GRATUITO DE SUPABASE**

- **Base de datos**: 500MB
- **Usuarios**: Ilimitados
- **API requests**: 50,000/mes
- **Autenticación**: Ilimitada
- **Storage**: 1GB
- **Backup**: Automático

## **🔍 VERIFICAR INSTALACIÓN**

1. **Compilar**: `npm run build`
2. **Verificar variables de entorno**
3. **Probar autenticación** en la app
4. **Verificar sincronización** entre pestañas

## **📞 SOPORTE**

Si tienes problemas:

1. Verifica las variables de entorno
2. Revisa la consola del navegador
3. Verifica la configuración en Supabase
4. Ejecuta el script SQL completo

## **🎯 PRÓXIMOS PASOS**

- [ ] Configurar notificaciones push
- [ ] Implementar sincronización offline
- [ ] Agregar analytics
- [ ] Configurar webhooks
- [ ] Implementar colaboración entre usuarios

---

**¡Tu aplicación StudySync Pro ahora tiene un backend profesional y gratuito! 🎉**
