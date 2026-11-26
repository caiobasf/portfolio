/**
 * Gera public/og-image.png (1200×630) e public/apple-touch-icon.png (180×180)
 * a partir de HTML, usando os tokens de src/styles/tokens.css e as fontes locais.
 *
 * Uso: npm run images
 * Requer Chrome ou Edge instalado (ou CHROME_PATH apontando para o executável).
 */
import { chromium } from 'playwright-core';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokens = readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
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

const og = `<!doctype html><html><head><meta charset="utf-8"><style>${base}
body {
  position: relative;
  background-image:
    radial-gradient(ellipse 60% 70% at 88% 8%, var(--glow-wine), transparent 70%),
    radial-gradient(ellipse 70% 80% at 8% 100%, var(--glow-teal), transparent 70%),
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: auto, auto, 48px 48px, 48px 48px;
}
.scan { position: absolute; inset: 0; background-image: repeating-linear-gradient(0deg, var(--scanline) 0 1px, transparent 1px 4px); }
.frame { position: absolute; inset: 40px; border: 1px solid var(--line); padding: 56px 64px; display: flex; flex-direction: column; justify-content: space-between; }
.frame::before, .frame::after { content: ''; position: absolute; width: 36px; height: 36px; }
.frame::before { top: -1px; left: -1px; border-top: 3px solid var(--accent); border-left: 3px solid var(--accent); }
.frame::after { right: -1px; bottom: -1px; border-right: 3px solid var(--accent); border-bottom: 3px solid var(--accent); }
.top { display: flex; justify-content: space-between; font-size: 22px; letter-spacing: 0.16em; font-weight: 500; }
.status { color: var(--text-3); font-size: 18px; letter-spacing: 0.2em; display: flex; align-items: center; gap: 14px; }
.status i { width: 12px; height: 12px; background: var(--accent); display: inline-block; }
h1 { font-family: var(--font-display); font-weight: 700; font-size: 150px; line-height: 0.9; text-transform: uppercase; letter-spacing: -0.01em; }
h1 span { color: var(--accent); }
.nick { font-size: 40px; font-weight: 500; margin-top: 14px; }
.role { font-size: 24px; letter-spacing: 0.1em; }
</style></head><body><div class="scan"></div>
<div class="frame">
  <div class="top"><span>CF<span class="accent-text">//</span>PORTFÓLIO</span><span class="status"><i></i>// ABERTO A OPORTUNIDADES</span></div>
  <div><h1>Caio <span>Ferreira</span></h1><p class="nick">caiobasf</p></div>
  <p class="role">DESENVOLVEDOR FULL STACK <span class="accent-text">//</span> SÃO PAULO, SP</p>
</div></body></html>`;

const icon = `<!doctype html><html><head><meta charset="utf-8"><style>${base}
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
