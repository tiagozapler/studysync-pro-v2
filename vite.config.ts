import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    //         handler: 'CacheFirst',
    //         options: {
    //         cacheName: 'google-fonts-cache',
    //         expiration: {
    //           maxEntries: 10,
    //           maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
    //         },
    //         cacheKeyWillBeUsed: async ({ request }) => {
    //           return `${request.url}`
    //         }
    //       }
    //     },
    //     {
    //       urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    //       handler: 'CacheFirst',
    //       options: {
    //         cacheName: 'gstatic-fonts-cache',
    //         expiration: {
    //           maxEntries: 10,
    //           maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
    //         },
    //         cacheKeyWillBeUsed: async ({ request }) => {
    //           return `${request.url}`
    //         }
    //       }
    //     }
    //   ]
    // },
    // includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    // manifest: {
    //   name: 'StudySync Pro',
    //   short_name: 'StudySync',
    //   description: 'Tu asistente académico personal completamente funcional y sincronizado en la nube',
    //   theme_color: '#0f172a',
    //   background_color: '#0f172a',
    //   display: 'standalone',
    //   orientation: 'portrait-primary',
    //   scope: '/',
    //   start_url: '/',
    //   icons: [
    //     {
    //       src: 'icon-192x192.png',
    //       sizes: '192x192',
    //       type: 'image/png',
    //       purpose: 'any maskable'
    //     },
    //     {
    //       src: 'icon-512x512.png',
    //       sizes: '512x512',
    //       type: 'image/png',
    //       purpose: 'any maskable'
    //     }
    //   ],
    //   shortcuts: [
    //     {
    //       name: 'Dashboard',
    //       short_name: 'Dashboard',
    //       description: 'Acceso rápido al dashboard principal',
    //       url: '/dashboard',
    //       icons: [{ src: 'icon-192x192.png', sizes: '192x192' }]
    //     },
    //     {
    //       name: 'Nuevo Curso',
    //       short_name: 'Curso',
    //       description: 'Crear un nuevo curso',
    //       url: '/dashboard?action=new-course',
    //       icons: [{ src: 'icon-192x192.png', sizes: '192x192' }]
    //     },
    //     {
    //       name: 'Modo Enfoque',
    //       short_name: 'Enfoque',
    //       description: 'Activar modo de concentración',
    //       url: '/focus',
    //       icons: [{ src: 'icon-192x192.png', sizes: '192x192' }]
    //     }
    //   ]
    // }
    // })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@features': resolve(__dirname, 'src/features'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@pages': resolve(__dirname, 'src/pages'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['tailwindcss'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    strictPort: true,
    fs: {
      strict: false,
      allow: ['..'],
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  css: {
    postcss: './postcss.config.js',
  },
})
