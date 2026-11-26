import { defineConfig } from '@playwright/test';

/**
 * Testes de navegador (npm test). Usam o Chrome instalado no sistema
 * (channel: 'chrome'), sem baixar navegadores. O servidor é o build de
 * produção servido pelo `astro preview`.
 */
const PORT = 4329;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
  },
  webServer: {
    command: `npm run build && npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
