import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { createHtmlPlugin } from 'vite-plugin-html';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import litCss from 'vite-plugin-lit-css';
import dotenv from '@dotenvx/dotenvx';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { replaceVariablesSync } from '@inventage/envsubst';

interface Dict<T> {
  [key: string]: T | undefined;
}

function filterVarsByPrefix(vars: Dict<string>, prefix: string = 'FRONTEND_') {
  return Object.fromEntries(Object.entries(vars).filter(([key]) => key.startsWith(prefix)));
}

function replaceIndexEnvVars(vars: Dict<string> = process.env): Plugin {
  return {
    name: 'replace-index-html-env-vars',
    apply: 'serve', // only in dev
    enforce: 'pre', // run before others
    transformIndexHtml(html) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
      const [replaced] = replaceVariablesSync(html, filterVarsByPrefix(vars));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return replaced;
    },
  };
}

// https://vitejs.dev/config/
// noinspection JSUnusedGlobalSymbols
export default defineConfig(({ command }) => {
  if (command !== 'build') {
    dotenv.config({ path: ['.env', '.env.local'], overload: true, quiet: true, strict: true });
  }

  return {
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
      replaceIndexEnvVars(),
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
