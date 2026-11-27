/**
 * Os dez estilos (src/estilos/registro.ts) e o seletor de estilo.
 *
 * Para cada estilo: carrega sem erros, tem um <h1> com o nome, não estoura na
 * horizontal no celular, passa no axe e mostra todo o currículo sem JS.
 */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ESTILOS, ESTILO_STORAGE_KEY } from '../../src/estilos/registro.ts';
import { projetos, stack, trajetoria, contato, sobre } from '../../src/content/perfil.ts';
import { VIEWPORTS, preparar } from './helpers.ts';

const novos = ESTILOS.filter((e) => e.id !== 'scanner');

async function serias(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

/** Todo texto do currículo que precisa aparecer em qualquer estilo. */
const TEXTOS = [
  sobre.paragrafo,
  ...projetos.map((p) => p.nome),
  ...projetos.flatMap((p) => p.itens),
  ...stack.flatMap((g) => g.itens),
  ...trajetoria.map((t) => t.cargo),
  ...trajetoria.flatMap((t) => t.itens),
  contato.email,
];

for (const estilo of novos) {
  test.describe(`estilo ${estilo.id}`, () => {
    test('carrega sem erros, com h1 e sem estouro no celular', async ({ page, context }) => {
      await preparar(context);
      await page.setViewportSize(VIEWPORTS.celular);
      const erros: string[] = [];
      page.on('pageerror', (e) => erros.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') erros.push(m.text());
      });

      await page.goto(estilo.href);
      await expect(page.locator('html')).toHaveAttribute('data-estilo', estilo.id);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toContainText('Caio');
      await page.waitForTimeout(1500);

      const estouro = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(estouro, 'rolagem horizontal').toBeLessThanOrEqual(0);
      expect(erros).toEqual([]);
      expect(await page.evaluate((k) => localStorage.getItem(k), ESTILO_STORAGE_KEY)).toBe(estilo.id);
    });

    test('axe sem violações sérias', async ({ page, context }) => {
      await preparar(context);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(estilo.href);
      await page.waitForTimeout(800);
      expect(await serias(page)).toEqual([]);
    });

    test.describe('sem JavaScript', () => {
      test.use({ javaScriptEnabled: false });

      test('todo o currículo visível', async ({ page }) => {
        await page.goto(estilo.href);
        await expect(page.locator('h1')).toContainText('Caio');
        // o primeiro elemento visível com o texto (alguns estilos têm cópias
        // só para impressão, e letreiros que se movem sem parar)
        for (const t of TEXTOS) {
          const el = page.getByText(t).filter({ visible: true }).first();
          await expect(el, t).toBeAttached();
          await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
          await expect(el, t).toBeVisible();
        }
        await expect(page.locator(`a[href="mailto:${contato.email}"]`).first()).toBeAttached();
        await expect(page.locator(`a[href="${contato.github.url}"]`).first()).toBeAttached();
        await expect(page.locator(`a[href="${contato.linkedin.url}"]`).first()).toBeAttached();
      });
    });
  });
}

test.describe('seletor de estilo', () => {
  test('troca pelo painel, salva a escolha e a landing redireciona', async ({ page, context }) => {
    await preparar(context);
    await page.goto('/');
    const seletor = page.locator('estilo-switcher');

    await seletor.getByRole('button', { name: /Trocar estilo do site/ }).click();
    await expect(seletor.getByRole('dialog')).toBeVisible();
    await seletor.getByRole('link', { name: /Bento/ }).click();
    await expect(page).toHaveURL(/\/estilo\/bento\/?$/);
    await expect(page.locator('html')).toHaveAttribute('data-estilo', 'bento');

    // a landing leva direto ao estilo salvo
    await page.goto('/');
    await expect(page).toHaveURL(/\/estilo\/bento\/?$/);

    // escolher o original desliga o redirecionamento
    await page.locator('estilo-switcher').getByRole('button', { name: /Trocar estilo do site/ }).click();
    await page.locator('estilo-switcher').getByRole('link', { name: /Scanner/ }).click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await page.goto('/');
    await expect(page).toHaveURL(/localhost:\d+\/$/);
  });

  test('setas percorrem os estilos em ordem', async ({ page, context }) => {
    await preparar(context);
    await page.goto(novos[0].href);
    await page.locator('estilo-switcher').getByRole('link', { name: /Próximo estilo/ }).click();
    await expect(page).toHaveURL(new RegExp(novos[1].href));
    await page.locator('estilo-switcher').getByRole('link', { name: /Estilo anterior/ }).click();
    await expect(page).toHaveURL(new RegExp(novos[0].href));
  });

  test('sem JavaScript o painel abre e os links funcionam', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/estilo/jornal/');
    await page.locator('estilo-switcher').getByRole('button', { name: /Trocar estilo do site/ }).click();
    await expect(page.locator('estilo-switcher').getByRole('dialog')).toBeVisible();
    await page.locator('estilo-switcher').getByRole('link', { name: /Terminal/ }).click();
    await expect(page).toHaveURL(/\/estilo\/terminal\/?$/);
    await context.close();
  });
});
