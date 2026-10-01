import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { dataApi } from './server/data-api.ts';

export default defineConfig({
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true },
  plugins: [
    react(),
    dataApi(),
    VitePWA({
      registerType: 'autoUpdate',
      // Icons are generated from public/icon.svg by pwa-assets.config.ts and injected into the manifest.
      // The app updates the HTML theme color to match the selected palette.
      pwaAssets: { config: true, injectThemeColor: false },
      manifest: {
        name: 'Cube Kitchen',
        short_name: 'Cube Kitchen',
        description: 'Your freezer cubes and monthly meal plan.',
        lang: 'en',
        theme_color: '#2f6550',
        background_color: '#f8f9f6',
        display: 'standalone',
        start_url: '/',
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['library/**'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/library\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cube-library',
              expiration: { maxEntries: 650, maxAgeSeconds: 60 * 60 * 24 * 180 },
            },
          },
        ],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
});
