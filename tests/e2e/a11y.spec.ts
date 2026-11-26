/**
 * axe sem violações sérias ou críticas, nas quatro paletas (spec 2, §8).
 * Landing e chat com movimento reduzido (sem mosaico por cima do texto,
 * que confundiria o cálculo de contraste); boot com movimento normal,
 * porque com movimento reduzido ele não aparece.
 */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PALETTE_IDS, preparar } from './helpers.ts';

async function serias(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

for (const paleta of PALETTE_IDS) {
  test.describe(`axe · ${paleta}`, () => {
    test('landing', async ({ page, context }) => {
      await preparar(context, { paleta });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-palette', paleta);
      expect(await serias(page)).toEqual([]);
    });

    test('boot', async ({ page, context }) => {
      await preparar(context, { paleta, boot: true });
      await page.goto('/');
      await expect(page.locator('#boot')).toBeVisible();
      await page.waitForTimeout(1200);
      expect(await serias(page)).toEqual([]);
    });

    test('chat', async ({ page, context }) => {
      await preparar(context, { paleta });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/conversa');
      await page.getByRole('button', { name: 'Seu nome?' }).click();
      await expect(page.getByText('Caio Bruno Alves Santana Ferreira', { exact: false })).toBeVisible();
      expect(await serias(page)).toEqual([]);
    });
  });
}
