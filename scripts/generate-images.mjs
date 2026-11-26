/**
 * Gera public/og-image.png (1200×630) e public/apple-touch-icon.png (180×180)
 * a partir de HTML, usando as paletas (src/styles/palettes.ts), os tokens de
 * src/styles/tokens.css e as fontes locais.
 *
 * Uso: npm run images
 * Requer Node com suporte a TypeScript nativo (≥ 22.18) e Chrome ou Edge
 * instalado (ou CHROME_PATH apontando para o executável).
 */
import { chromium } from 'playwright-core';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { paletteCss } from '../src/styles/palettes.ts';

/** Paletas usadas nas imagens: prévia no visual claro, ícone no escuro. */
const PALETA_OG = 'scanner';
const PALETA = 'escuro';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokens = paletteCss() + '\n' + readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
// fontes embutidas em base64: páginas criadas com setContent não carregam file://
const font = (p) =>
  `data:font/woff2;base64,${readFileSync(path.join(root, 'node_modules', p)).toString('base64')}`;

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) throw new Error('Chrome/Edge não encontrado. Defina CHROME_PATH.');

const base = `
${tokens}
@font-face { font-family: 'Rajdhani'; font-weight: 700; src: url('${font('@fontsource/rajdhani/files/rajdhani-latin-700-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'JetBrains Mono Variable'; font-weight: 100 800; src: url('${font('@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2')}') format('woff2'); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 100%; height: 100%; }
body { background: var(--bg); color: var(--text); font-family: var(--font-mono); overflow: hidden; }
.accent-text { color: var(--accent-text); }
`;

/** Alvo de registro: quadrado com contorno e dois quadradinhos opostos. */
const alvo = (x, y) =>
  `<g transform="translate(${x},${y})"><rect x="0.5" y="0.5" width="17" height="17" fill="none" style="stroke:var(--text)"/>` +
  `<rect x="1" y="1" width="8" height="8" style="fill:var(--text)"/><rect x="9" y="9" width="8" height="8" style="fill:var(--text)"/></g>`;
const alvos = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => alvo(c * 96, r * 66))).join('');

const og = `<!doctype html><html data-palette="${PALETA_OG}"><head><meta charset="utf-8"><style>${base}
body {
  position: relative;
  background-image:
    radial-gradient(ellipse 50% 60% at 92% 0%, var(--glow-a), transparent 70%),
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: auto, 48px 48px, 48px 48px;
}
.scan { position: absolute; inset: 0; background-image: repeating-linear-gradient(0deg, var(--scanline) 0 1px, transparent 1px 4px); }
.main { position: absolute; left: 72px; right: 72px; top: 64px; bottom: 150px; display: flex; flex-direction: column; justify-content: space-between; }
.top { display: flex; align-items: center; gap: 14px; font-size: 20px; letter-spacing: 0.2em; color: var(--text-3); }
.top i { width: 12px; height: 12px; background: var(--accent); display: inline-block; }
h1 { font-weight: 500; font-size: 168px; line-height: 1; letter-spacing: -0.01em; color: var(--text); }
.role { font-size: 26px; letter-spacing: 0.1em; color: var(--text); }
.marks { position: absolute; right: 72px; top: 64px; display: flex; flex-direction: column; align-items: flex-end; gap: 18px; }
.marks p { font-size: 14px; line-height: 1.7; letter-spacing: 0.16em; color: var(--text-3); text-align: right; }
.band { position: absolute; left: 0; right: 0; bottom: 0; height: 110px; background: var(--band-bg);
  background-image: repeating-linear-gradient(0deg, var(--band-line) 0 1px, transparent 1px 6px); }
.band span { position: absolute; font-size: 14px; letter-spacing: 0.18em; color: var(--band-fg); background: var(--band-bg); padding: 2px 8px; }
</style></head><body><div class="scan"></div>
<div class="marks"><svg width="210" height="150" viewBox="0 0 210 150">${alvos}</svg><p>ESCANEANDO: PERFIL_01<br>FREQ: 7.3 MHz<br>KEY-1</p></div>
<div class="main">
  <p class="top"><i></i>// ABERTO A OPORTUNIDADES</p>
  <div><h1>CAIOBASF</h1></div>
  <p class="role">DESENVOLVEDOR FULL STACK <span class="accent-text">//</span> SÃO PAULO, SP</p>
</div>
<div class="band"><span style="left:64px;top:14px">SCAN · PERFIL · 7.3 MHz</span><span style="right:64px;bottom:14px">KEY-1</span></div>
</body></html>`;

const icon = `<!doctype html><html data-palette="${PALETA}"><head><meta charset="utf-8"><style>${base}
body { display: grid; place-items: center; background: var(--bg); }
.m { width: 180px; height: 180px; display: grid; place-items: center; position: relative;
  font-family: var(--font-display); font-weight: 700; font-size: 104px; letter-spacing: -2px; padding-top: 8px; }
.m::before, .m::after { content: ''; position: absolute; width: 40px; height: 40px; }
.m::before { top: 18px; left: 18px; border-top: 6px solid var(--accent); border-left: 6px solid var(--accent); }
.m::after { right: 18px; bottom: 18px; border-right: 6px solid var(--accent); border-bottom: 6px solid var(--accent); }
.m span { color: var(--accent-text); }
</style></head><body><div class="m"><div>C<span>F</span></div></div></body></html>`;

const browser = await chromium.launch({ executablePath });
const jobs = [
  { html: og, w: 1200, h: 630, out: 'public/og-image.png' },
  { html: icon, w: 180, h: 180, out: 'public/apple-touch-icon.png' },
];
for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h } });
  await page.setContent(job.html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, job.out) });
  await page.close();
  console.log('gerado:', job.out);
}
await browser.close();
