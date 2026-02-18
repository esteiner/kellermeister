import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { createHtmlPlugin } from 'vite-plugin-html';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import litCss from 'vite-plugin-lit-css';
import dotenv from '@dotenvx/dotenvx';

// https://vitejs.dev/config/
// noinspection JSUnusedGlobalSymbols
export default defineConfig(({ command }) => {
  if (command !== 'build') {
    dotenv.config({ path: ['.env', '.env.local'], overload: true, quiet: true, strict: true });
  }

  return {
    // Set base path for GitHub Pages deployment
    // Use '/' for local development, '/repo-name/' for GitHub Pages
    base: process.env.VITE_BASE_PATH || '/',
    server: {
      host: '0.0.0.0',
    },
    define: {
      'import.meta.env.MATOMO_SITE_ID': process.env.FRONTEND_MATOMO_SITE_ID && JSON.stringify(process.env.FRONTEND_MATOMO_SITE_ID),
      'import.meta.env.MATOMO_SCRIPT_URL': process.env.FRONTEND_MATOMO_SCRIPT_URL && JSON.stringify(process.env.FRONTEND_MATOMO_SCRIPT_URL),
      'import.meta.env.MATOMO_TRACKER_URL': process.env.FRONTEND_MATOMO_TRACKER_URL && JSON.stringify(process.env.FRONTEND_MATOMO_TRACKER_URL),
      'import.meta.env.SITE_NAME': process.env.FRONTEND_SITE_NAME && JSON.stringify(process.env.FRONTEND_SITE_NAME),
      'import.meta.env.SITE_DESCRIPTION': process.env.FRONTEND_SITE_DESCRIPTION && JSON.stringify(process.env.FRONTEND_SITE_DESCRIPTION),
      'import.meta.env.IS_DEV': process.env.FRONTEND_IS_DEV && JSON.stringify(process.env.FRONTEND_IS_DEV),
      'import.meta.env.SHOW_DOMAIN_NOTICE': process.env.FRONTEND_SHOW_DOMAIN_NOTICE && JSON.stringify(process.env.FRONTEND_SHOW_DOMAIN_NOTICE),
    },
    plugins: [
      litCss({
        exclude: ['./styles.css', './styles.scss'],
      }),
      nodePolyfills({
        include: ['fs'],
      }),
      // @see https://github.com/vbenjs/vite-plugin-html
      createHtmlPlugin({
        entry: '/src/infrastructure/web/main.ts',
      })
    ]
  };
});
