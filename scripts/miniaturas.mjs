/**
 * Gera as miniaturas do seletor de estilo em public/estilos/<id>.jpg (480×300).
 *
 * Uso (com o site rodando, ex.: npm run dev ou npm run preview):
 *   npm run miniaturas
 *   npm run miniaturas -- --base=http://localhost:4329
 *
 * Captura cada estilo em 1280×800 (sem o botão de estilo, com movimento
 * reduzido para pegar o estado final) e reduz no próprio Chrome via canvas.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ESTILOS } from '../src/estilos/registro.ts';

const arg = process.argv.find((a) => a.startsWith('--base='));
const base = arg ? arg.slice(7) : 'http://localhost:4321';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'estilos');
mkdirSync(out, { recursive: true });

/** Esperas extras para estilos com abertura mais longa. */
const ESPERA = { terminal: 3000, desktop: 3000 };

const browser = await chromium.launch({ channel: 'chrome' });
// movimento reduzido: cada estilo aparece no estado final, sem abertura nem entrada pela metade
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
await context.addInitScript(() => {
  try {
    sessionStorage.setItem('cf-boot', '1');
  } catch {}
});
const page = await context.newPage();
const tela = await context.newPage();

for (const e of ESTILOS) {
  await page.goto(base + e.href, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'estilo-switcher{display:none!important}' });
  await page.waitForTimeout(ESPERA[e.id] ?? 1500);
  const png = await page.screenshot({ type: 'png' });

  const jpg = await tela.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = 300;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82);
  }, `data:image/png;base64,${png.toString('base64')}`);

  writeFileSync(path.join(out, `${e.id}.jpg`), Buffer.from(jpg.split(',')[1], 'base64'));
  console.log(`✓ ${e.id}`);
}

await browser.close();
