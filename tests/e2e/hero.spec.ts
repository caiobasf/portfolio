/**
 * Título do hero: CAIOBASF ⇄ nome completo (spec 2, §5.2).
 */
import { test, expect } from '@playwright/test';
import { preparar, tituloParado } from './helpers.ts';

const TITULO = '[data-hero-title]';

test.describe('título do hero', () => {
  test.beforeEach(async ({ context }) => preparar(context));

  test('monta CAIOBASF, troca no hover e volta ao sair', async ({ page }) => {
    await page.goto('/');
    await tituloParado(page, 'apelido');

    await page.hover(TITULO);
    await tituloParado(page, 'nome');

    await page.mouse.move(5, 600);
    await tituloParado(page, 'apelido');
  });

  test('hover rápido não empilha animações', async ({ page }) => {
    await page.goto('/');
    await tituloParado(page, 'apelido');

    const box = (await page.locator(TITULO).boundingBox())!;
    for (let i = 0; i < 8; i++) {
      await page.mouse.move(box.x + 20, box.y + box.height / 2);
      await page.waitForTimeout(60);
      await page.mouse.move(5, 600);
      await page.waitForTimeout(60);
    }
    await tituloParado(page, 'apelido');
    await expect(page.locator(TITULO)).toHaveAttribute('data-max-anim', '1');
  });

  test('foco pelo teclado mostra o nome; sair do foco volta', async ({ page }) => {
    await page.goto('/');
    await tituloParado(page, 'apelido');

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      if (await page.locator(TITULO).evaluate((el) => el === document.activeElement)) break;
    }
    await expect(page.locator(TITULO)).toBeFocused();
    await tituloParado(page, 'nome');

    await page.keyboard.press('Tab');
    await tituloParado(page, 'apelido');
  });

  test('com movimento reduzido a troca é instantânea', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await tituloParado(page, 'apelido');

    await page.hover(TITULO);
    // sem esperar quadros: o estado já mudou e nenhuma animação começou
    await expect(page.locator(TITULO)).toHaveAttribute('data-state', 'nome', { timeout: 200 });
    await expect(page.locator(TITULO)).toHaveAttribute('data-max-anim', '0');
  });
});

test.describe('título do hero no toque', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test.beforeEach(async ({ context }) => preparar(context));

  test('toque alterna entre apelido e nome', async ({ page }) => {
    await page.goto('/');
    await tituloParado(page, 'apelido');

    await page.locator(TITULO).tap();
    await tituloParado(page, 'nome');
    await page.locator(TITULO).tap();
    await tituloParado(page, 'apelido');
  });
});

test('SEO: título, JSON-LD Person sem e-mail nem telefone', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Caio Bruno Alves Santana Ferreira (caiobasf) — Desenvolvedor Full Stack');
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const ld = JSON.parse(raw ?? '{}');
  expect(ld['@type']).toBe('Person');
  expect(ld.name).toBe('Caio Bruno Alves Santana Ferreira');
  expect(ld.alternateName).toEqual(['caiobasf', 'Caio Ferreira']);
  expect(raw).not.toMatch(/mailto|telephone|tel:|"email"|gmail/i);
  expect(ld.email).toBeUndefined();
  expect(ld.telephone).toBeUndefined();
});
