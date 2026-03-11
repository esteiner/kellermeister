import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Set base path for GitHub Pages deployment
  // Use '/' for local development, '/repo-name/' for GitHub Pages
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    // https://vite-pwa-org.netlify.app/guide/
    VitePWA ({
      selfDestroying: true,
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Kellermeister',
        short_name: 'Kellermeister',
        description: 'Kellermeister verwaltet deinen Weinkeller',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
  },
});
