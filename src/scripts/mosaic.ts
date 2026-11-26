/**
 * Revelação em mosaico (spec 2, §6.4).
 *
 * Cada alvo `[data-mosaic]` fora da tela no carregamento recebe um canvas
 * por cima, com quadrados de 16px nas cores --mosaic-1..5. Ao entrar na tela
 * (12% visível), os quadrados somem em ordem aleatória em ~750ms; os que estão
 * prestes a sumir piscam em --accent. No fim o canvas sai do DOM.
 *
 * Sem JavaScript, sem IntersectionObserver ou com movimento reduzido nada é
 * criado: o conteúdo nunca fica escondido por padrão.
 */
import { getPalette, onPaletteChange } from './palette';
import { prefersReducedMotion } from './pixel-text';

const CELL = 16;
const DURATION = 750;
const FLASH = 0.05;
const THRESHOLD = 0.12;

interface Item {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  /** instante (0–1) em que cada quadrado some */
  t: Float32Array;
  /** cor de cada quadrado (0–4 → --mosaic-1..5) */
  c: Uint8Array;
  t0: number;
}

function draw(it: Item, p: number): void {
  const pal = getPalette();
  const cores = [pal['mosaic-1'], pal['mosaic-2'], pal['mosaic-3'], pal['mosaic-4'], pal['mosaic-5']];
  const { ctx, cols, rows } = it;
  ctx.clearRect(0, 0, cols, rows);
  for (let k = 0; k < cols * rows; k++) {
    const tk = it.t[k];
    if (tk <= p) continue; // já sumiu
    ctx.fillStyle = tk - p < FLASH ? pal.accent : cores[it.c[k]];
    ctx.fillRect(k % cols, Math.floor(k / cols), 1, 1);
  }
}

export function initMosaic(targets: HTMLElement[]): void {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const vh = window.innerHeight;
  const pending = new Map<Element, Item>();

  for (const el of targets) {
    const r = el.getBoundingClientRect();
    // não cobre nada visível no carregamento (nem atrasa o LCP)
    if (r.width === 0 || r.height === 0 || (r.top < vh && r.bottom > 0)) continue;

    // medido uma vez: 1 px do canvas = 1 quadrado; o CSS estica (pixelated)
    const cols = Math.ceil(r.width / CELL);
    const rows = Math.ceil(r.height / CELL);
    const canvas = document.createElement('canvas');
    canvas.className = 'mosaic';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    const n = cols * rows;
    const t = new Float32Array(n);
    const c = new Uint8Array(n);
    for (let k = 0; k < n; k++) {
      t[k] = Math.random();
      c[k] = Math.floor(Math.random() * 5);
    }
    const it: Item = { canvas, ctx, cols, rows, t, c, t0: 0 };
    draw(it, 0);
    el.append(canvas);
    pending.set(el, it);
  }
  if (!pending.size) return;

  // um único laço para todos os mosaicos em andamento
  const active = new Set<Item>();
  let raf = 0;
  const loop = (now: number) => {
    for (const it of active) {
      const p = Math.min(1, (now - it.t0) / DURATION);
      if (p >= 1) {
        it.canvas.remove();
        active.delete(it);
      } else {
        draw(it, p);
      }
    }
    raf = active.size ? requestAnimationFrame(loop) : 0;
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const it = pending.get(e.target);
        if (!it) continue;
        io.unobserve(e.target);
        pending.delete(e.target);
        it.t0 = performance.now();
        active.add(it);
      }
      if (active.size && !raf) raf = requestAnimationFrame(loop);
      if (!pending.size) stopPalette();
    },
    { threshold: THRESHOLD },
  );
  pending.forEach((_, el) => io.observe(el));

  // mosaicos ainda parados acompanham a troca de paleta
  const stopPalette = onPaletteChange(() => pending.forEach((it) => draw(it, 0)));
}
