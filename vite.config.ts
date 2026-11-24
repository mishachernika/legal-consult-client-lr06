import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA (рівень 3, завдання 7): manifest українською + сервіс-воркер.
    // API завжди лише з мережі (NetworkFirst без кешу відповідей),
    // статики Vite прекаширує через precache (generateSW за замовчуванням).
    VitePWA({
      injectRegister: 'auto',
      registerType: 'prompt',
      manifest: {
        name: 'LegalConsult — онлайн юридичні консультації',
        short_name: 'LegalConsult',
        description:
          'Платформа онлайн юридичних консультацій: знайдіть юриста, заплануйте консультацію, спілкуйтеся в чаті.',
        lang: 'uk',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#1d4ed8',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Запити до API не кешуємо: дані завжди свіжі з сервера
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
          {
            // Завантажені файли (аватари, вкладення) — NetworkFirst з кеш-фолбеком
            urlPattern: ({ url }) => url.pathname.startsWith('/api/files/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'files-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
    // Аналіз розміру бандла: stats.html у корені (у .gitignore), вмикається змінною BUILD_STATS=1
    ...(process.env.BUILD_STATS
      ? [
          visualizer({
            filename: 'stats.html',
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  resolve: {
    // абсолютні імпорти '@/...' — той самий псевдонім, що й у tsconfig.app.json (paths)
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Proxy тієї ж origin: браузер шле /api і /socket.io на :5173, vite пересилає на :3000.
    // Перевага: відпадає CORS на розробці, а аватари не блокує CORP (helmet на API
    // віддає Cross-Origin-Resource-Policy: same-origin, тож прямі <img src=":3000/..."> блокуються).
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
