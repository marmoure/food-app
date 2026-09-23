import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { dataApi } from './server/data-api';

export default defineConfig({
  plugins: [
    react(),
    dataApi(),
    VitePWA({
      registerType: 'autoUpdate',
      // Icons are generated from public/icon.svg by pwa-assets.config.ts and injected into the manifest.
      pwaAssets: { config: true },
      manifest: {
        name: 'Sunday Kitchen',
        short_name: 'Kitchen',
        description: 'Shop Saturday, cook Sunday, reheat all week.',
        lang: 'en',
        theme_color: '#0A6B58',
        background_color: '#EDF1EE',
        display: 'standalone',
        start_url: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
});
