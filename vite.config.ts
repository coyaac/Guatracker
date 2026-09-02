/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// En build para GitHub Pages la app vive bajo /Guatracker/; en dev, en la raíz.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Guatracker/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt', // RNF-06: aviso de "actualizar", no auto
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Guatracker',
        short_name: 'Guatracker',
        description: 'Seguimiento personal de hábitos',
        lang: 'es-CL',
        theme_color: '#0e101a',
        background_color: '#0e101a',
        display: 'standalone',
        // start_url y scope los deriva el plugin desde `base` (/Guatracker/).
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // RNF-05/08: app shell cache-first, cero red en runtime
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**'], // RNF-20: ≥80% en dominio
    },
  },
}))
