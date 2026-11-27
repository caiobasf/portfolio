/**
 * Captura de tela + diagnóstico rápido de uma página (Chrome do sistema).
 *
 *   node scripts/captura.mjs <url-ou-caminho> <saida.png> [opções]
 *   (caminho com ou sem barra inicial: estilo/pixel ou /estilo/pixel/)
 *
 * Opções:
 *   --width=1440 --height=900   tamanho da janela (padrão desktop)
 *   --mobile                    atalho para 390x844
 *   --full                      página inteira
 *   --wait=1500                 espera extra (ms) antes da captura
 *   --scroll                    rola até o fim e volta (dispara animações de rolagem)
 *   --reduced                   prefers-reduced-motion: reduce
 *   --axe                       roda o axe (só violações sérias e críticas)
 *   --base=http://localhost:4321
 *
 * Imprime: título, <h1>, erros de console/página, estouro horizontal e axe.
 */
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const opt = Object.fromEntries(
  args
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.slice(2).split('=');
      return [k, v ?? true];
    }),
);

const [alvo = '/', saida] = pos;
const base = opt.base || 'http://localhost:4321';
// o Git Bash do Windows converte "/estilo/x" em "C:/Program Files/Git/estilo/x"
const caminho = alvo.replace(/^[A-Za-z]:\/.*?\/Git(?=\/)/, '').replace(/^(?!\/)/, '/');
const url = /^https?:/.test(alvo) ? alvo : base + caminho;
const width = opt.mobile ? 390 : Number(opt.width || 1440);
const height = opt.mobile ? 844 : Number(opt.height || 900);

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  reducedMotion: opt.reduced ? 'reduce' : 'no-preference',
});
// não deixa o estilo salvo redirecionar e pula o boot da landing
await context.addInitScript(() => {
  try {
    sessionStorage.setItem('cf-boot', '1');
  } catch {}
});
const page = await context.newPage();
const erros = [];
page.on('console', (m) => {
  if (m.type() === 'error') erros.push(`console: ${m.text()}`);
});
page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => erros.push(`request falhou: ${r.url()} ${r.failure()?.errorText}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(Number(opt.wait || 1200));

if (opt.scroll) {
  await page.evaluate(async () => {
    const passo = innerHeight * 0.7;
    for (let y = 0; y < document.documentElement.scrollHeight; y += passo) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    await new Promise((r) => setTimeout(r, 600));
    scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

const info = await page.evaluate(() => ({
  titulo: document.title,
  h1: Array.from(document.querySelectorAll('h1')).map((h) => h.textContent?.trim().replace(/\s+/g, ' ')),
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  altura: document.documentElement.scrollHeight,
}));

if (saida) await page.screenshot({ path: saida, fullPage: Boolean(opt.full) });

console.log(`URL: ${url} (${width}x${height})`);
console.log(`título: ${info.titulo}`);
console.log(`h1: ${JSON.stringify(info.h1)}`);
console.log(`altura da página: ${info.altura}px`);
console.log(
  info.scrollWidth > info.clientWidth
    ? `ESTOURO HORIZONTAL: scrollWidth ${info.scrollWidth} > ${info.clientWidth}`
    : 'sem estouro horizontal',
);
console.log(erros.length ? `ERROS:\n  ${erros.join('\n  ')}` : 'sem erros de console');

if (opt.axe) {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const r = await new AxeBuilder({ page }).exclude('estilo-switcher').analyze();
  const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  if (!graves.length) console.log('axe: sem violações sérias/críticas');
  for (const v of graves) {
    console.log(`axe [${v.impact}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 6)) console.log(`    ${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1]?.trim() ?? ''}`);
  }
}
if (saida) console.log(`captura: ${saida}`);
await browser.close();
