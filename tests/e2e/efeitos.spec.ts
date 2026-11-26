/**
 * Paleta (persistência, sem piscar) e efeitos de scanner (spec 2, §3, §4, §6).
 */
import { test, expect } from '@playwright/test';
import { preparar } from './helpers.ts';

test('a paleta escolhida persiste e já está aplicada antes do <body>', async ({ page, context }) => {
  await preparar(context);
  await page.goto('/');
  await page.getByRole('button', { name: 'Paleta Monocromático' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'mono');
  await expect(page.getByRole('button', { name: 'Paleta Monocromático' })).toHaveAttribute('aria-pressed', 'true');

  // na recarga, o atributo já existe quando o <body> começa (sem piscar a paleta errada)
  await page.addInitScript(() => {
    new MutationObserver((_, mo) => {
      if (document.body) {
        (window as unknown as { __noBody: string | null }).__noBody = document.documentElement.getAttribute('data-palette');
        mo.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.reload();
  expect(await page.evaluate(() => (window as unknown as { __noBody: string }).__noBody)).toBe('mono');
});

test('sem escolha salva, sistema escuro começa na paleta escuro', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('/conversa');
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'escuro');
  await ctx.close();
});

test('mosaico: nada sobre o que está visível; some ao entrar na tela e sai do DOM', async ({ page, context }) => {
  await preparar(context);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  // o que já aparece no carregamento nunca é coberto
  const visiveisCobertos = await page.evaluate(() =>
    Array.from(document.querySelectorAll('canvas.mosaic')).filter((c) => {
      const r = c.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0;
    }).length,
  );
  expect(visiveisCobertos).toBe(0);

  const projetos = page.locator('#projetos [data-mosaic]').first();
  await expect(projetos.locator('canvas.mosaic')).toHaveCount(1);
  await projetos.scrollIntoViewIfNeeded();
  await expect(projetos.locator('canvas.mosaic')).toHaveCount(0, { timeout: 2_000 });
});

test('movimento reduzido: sem mosaico, sem animação dos títulos', async ({ page, context }) => {
  await preparar(context);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('canvas.mosaic')).toHaveCount(0);
  await page.locator('#stack').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await expect(page.locator('.sh.scan-on')).toHaveCount(0);
});

test('faixa do scanner: canvas desenhado e altura fixa de 150px', async ({ page, context }) => {
  await preparar(context);
  await page.goto('/');
  const band = page.locator('[data-scan-band]');
  await expect(band).toHaveClass(/is-live/);
  expect((await band.boundingBox())!.height).toBe(150);
});

test('chat: tópico nome por texto livre', async ({ page, context }) => {
  await preparar(context);
  await page.goto('/conversa');
  await page.getByLabel('Escreva uma mensagem').fill('como posso te chamar?');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('consultando: identidade')).toBeVisible();
  await expect(page.getByText('mas na internet eu sou o caiobasf')).toBeVisible();
});
