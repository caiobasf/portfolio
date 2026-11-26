/**
 * Sem JavaScript a landing mostra todo o conteúdo (spec 2, §6.6 e §8).
 */
import { test, expect } from '@playwright/test';
import { projetos, stack, trajetoria, contato, sobre } from '../../src/content/perfil.ts';

test.use({ javaScriptEnabled: false });

test('landing sem JavaScript: todo o conteúdo visível, sem efeitos', async ({ page }) => {
  await page.goto('/');

  // nada de boot, mosaico ou seletor de paleta
  await expect(page.locator('#boot')).toBeHidden();
  await expect(page.locator('canvas.mosaic')).toHaveCount(0);
  await expect(page.locator('[data-palette-switcher]')).toBeHidden();

  // título: o apelido em texto e o nome completo para leitores de tela
  await expect(page.locator('[data-hero-fallback]')).toHaveText('CAIOBASF');
  await expect(page.locator('#hero-titulo')).toContainText('Caio Bruno Alves Santana Ferreira');

  const textos = [
    sobre.paragrafo,
    ...projetos.map((p) => p.nome),
    ...projetos.flatMap((p) => p.itens),
    ...stack.flatMap((g) => g.itens),
    ...trajetoria.map((t) => t.cargo),
    ...trajetoria.flatMap((t) => t.itens),
    contato.email,
  ];
  for (const t of textos) {
    const el = page.getByText(t, { exact: true }).first();
    await el.scrollIntoViewIfNeeded();
    await expect(el, t).toBeVisible();
  }
});
