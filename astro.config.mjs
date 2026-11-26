// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Endereço público do site (canonical, Open Graph, sitemap, robots).
 * PENDENTE: domínio ainda não definido. Definir SITE_URL no build de produção,
 * por exemplo: SITE_URL=https://caiobasf.dev npm run build
 */
const site = process.env.SITE_URL || 'http://localhost:4321';

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [sitemap()],
  build: {
    // CSS pequeno vai inline no HTML: uma requisição a menos no caminho crítico
    inlineStylesheets: 'auto',
  },
});
