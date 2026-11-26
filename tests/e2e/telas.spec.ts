/**
 * Capturas de tela de landing, boot e chat, em 390px e 1440px, nas quatro
 * paletas (spec 2, §8). Não comparam pixels (fontes variam entre máquinas):
 * ficam em test-results/telas/ para revisão.
 */
import { test, expect } from '@playwright/test';
import { PALETTE_IDS, VIEWPORTS, preparar } from './helpers.ts';

const DIR = 'test-results/telas';

for (const paleta of PALETTE_IDS) {
  for (const [nome, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`${paleta} · ${nome}`, () => {
      test.use({ viewport });

      test('landing', async ({ page, context }) => {
        await preparar(context, { paleta });
        // movimento reduzido: sem mosaico cobrindo o que está abaixo da dobra
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/', { waitUntil: 'networkidle' });
        await expect(page.locator('[data-hero-title][data-state="apelido"]')).toBeAttached();
        await page.screenshot({ path: `${DIR}/landing-${paleta}-${viewport.width}.png`, fullPage: true });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
      });

      test('boot', async ({ page, context }) => {
        await preparar(context, { paleta, boot: true });
        await page.goto('/');
        await page.waitForTimeout(1800);
        await page.screenshot({ path: `${DIR}/boot-${paleta}-${viewport.width}.png` });
      });

      test('chat', async ({ page, context }) => {
        await preparar(context, { paleta });
        await page.goto('/conversa', { waitUntil: 'networkidle' });
        await page.screenshot({ path: `${DIR}/chat-${paleta}-${viewport.width}.png` });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
      });
    });
  }
}
