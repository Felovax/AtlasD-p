/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { invitation } from './src/config/invitation.ts';

/**
 * Setter inn tittel, beskrivelse og full adresse i <meta property="og:..."> slik at
 * forhåndsvisningen (bilde + tittel) fungerer når lenken deles i SMS/Messenger.
 * Tekstene hentes fra src/config/invitation.ts.
 * GitHub Actions setter VITE_SITE_URL automatisk (se .github/workflows/deploy.yml).
 */
function shareMetaPlugin(siteUrl: string): Plugin {
  const normalized = siteUrl ? siteUrl.replace(/\/?$/, '/') : '';
  const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return {
    name: 'share-meta',
    transformIndexHtml: (html) =>
      html
        .replaceAll('__SITE_URL__', normalized)
        .replaceAll('__OG_TITLE__', escape(invitation.texts.shareTitle))
        .replaceAll('__OG_DESCRIPTION__', escape(invitation.texts.shareDescription)),
  };
}

/** Lager 404.html (GitHub Pages viser den for ukjente adresser) med riktig startside. */
function notFoundPagePlugin(base: string): Plugin {
  return {
    name: 'not-found-page',
    apply: 'build',
    generateBundle() {
      const template = readFileSync(resolve(import.meta.dirname, 'src/static/404.html'), 'utf8');
      this.emitFile({ type: 'asset', fileName: '404.html', source: template.replaceAll('__BASE__', base) });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '');
  // GitHub Pages serverer prosjektsider fra /<repo-navn>/. Workflowen setter BASE_PATH.
  const base = (env.BASE_PATH || '/').replace(/\/?$/, '/');

  return {
    base,
    plugins: [react(), shareMetaPlugin(env.VITE_SITE_URL ?? ''), notFoundPagePlugin(base)],
    build: {
      target: 'es2020',
      assetsInlineLimit: 2048,
      rollupOptions: {
        input: {
          main: resolve(import.meta.dirname, 'index.html'),
          admin: resolve(import.meta.dirname, 'admin/index.html'),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      include: ['src/**/*.test.{ts,tsx}'],
    },
  };
});
