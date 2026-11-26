/**
 * Texto em pixels num <canvas>: rasteriza o texto fora da tela, amostra em
 * células de 3px e faz a transição "texto antigo → blocos → texto novo"
 * célula a célula.
 *
 * Usado pelo subtítulo "Eu construo [A] para [B]." (aqui) e pelo título do
 * hero CAIOBASF ⇄ nome completo (hero-title.ts), que reaproveita as funções
 * exportadas.
 */
import { getPalette, onPaletteChange } from './palette';

export const CELL = 3; // px CSS por célula
const COVER_END = 0.45; // fase 1 (texto antigo) vai de 0 a r1 × 0,45
const REVEAL_START = 0.55; // fase 3 (texto novo) começa em 0,55 + r2 × 0,4
const REVEAL_SPAN = 0.4;
const FLASH = 0.06; // clarão ao revelar (fração do tempo total)
const NOISE_RATIO = 0.1;
const ALPHA_THRESHOLD = 90;

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Espera a fonte carregar, com limite de tempo (não trava se a rede falhar). */
export async function waitForFont(font: string, timeout = 1500): Promise<void> {
  if (!('fonts' in document)) return;
  await Promise.race([
    document.fonts.load(font).catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, timeout)),
  ]);
}

export function debounce(fn: () => void, ms = 250): () => void {
  let t: number | undefined;
  return () => {
    window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}

/** Grade de células ligadas/desligadas de um texto. */
export interface CellGrid {
  on: Uint8Array;
  cols: number;
  rows: number;
}

/**
 * Rasteriza `text` num canvas fora da tela de `w`×`h` px CSS (linha de base em
 * `base`) e devolve quais células de 3px têm tinta. Textos com fontes
 * diferentes podem ser comparados desde que usem o mesmo `w` e `h`.
 */
export function rasterize(text: string, font: string, base: number, w: number, h: number): CellGrid {
  const cols = Math.ceil(w / CELL);
  const rows = Math.ceil(h / CELL);
  const on = new Uint8Array(cols * rows);
  if (!text) return { on, cols, rows };

  const oc = document.createElement('canvas');
  oc.width = Math.max(1, Math.ceil(w));
  oc.height = Math.max(1, Math.ceil(h));
  const x = oc.getContext('2d', { willReadFrequently: true });
  if (!x) return { on, cols, rows };
  x.font = font;
  x.textBaseline = 'alphabetic';
  x.fillStyle = '#fff'; // máscara invisível: só o canal alfa é lido
  x.fillText(text, 0, base);
  const W = oc.width;
  const H = oc.height;
  const data = x.getImageData(0, 0, W, H).data;

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      let hit = 0;
      const yEnd = Math.min(H, (cy + 1) * CELL);
      const xEnd = Math.min(W, (cx + 1) * CELL);
      for (let yy = cy * CELL; yy < yEnd && !hit; yy++) {
        for (let xx = cx * CELL; xx < xEnd; xx++) {
          if (data[(yy * W + xx) * 4 + 3] > ALPHA_THRESHOLD) {
            hit = 1;
            break;
          }
        }
      }
      on[cy * cols + cx] = hit;
    }
  }
  return { on, cols, rows };
}

/** Sorteio de uma transição: tempos por célula e células de ruído. */
export interface Plan {
  a: Uint8Array;
  b: Uint8Array;
  cols: number;
  rows: number;
  r1: Float32Array;
  r2: Float32Array;
  noise: Uint8Array;
}

export function makePlan(a: CellGrid, b: CellGrid): Plan {
  const n = a.cols * a.rows;
  const r1 = new Float32Array(n);
  const r2 = new Float32Array(n);
  const noise = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    r1[k] = Math.random();
    r2[k] = Math.random();
    noise[k] = Math.random() < NOISE_RATIO ? 1 : 0;
  }
  return { a: a.on, b: b.on, cols: a.cols, rows: a.rows, r1, r2, noise };
}

export interface FrameColors {
  /** cor do texto (antigo e novo) */
  glyph: string;
  /** blocos da fase 2, em rodízio por célula */
  blocks: readonly string[];
  /** blocos de células de ruído (fora dos dois textos); vazio = usa `blocks` */
  noise?: string;
  /** clarão ao revelar */
  flash: string;
}

/** Desenha um quadro da transição no instante `t` ∈ [0, 1]. */
export function drawFrame(ctx: CanvasRenderingContext2D, p: Plan, t: number, c: FrameColors): void {
  ctx.clearRect(0, 0, p.cols * CELL, p.rows * CELL);
  const n = p.cols * p.rows;
  const nb = c.blocks.length;
  for (let k = 0; k < n; k++) {
    const inA = p.a[k];
    const inB = p.b[k];
    const isNoise = p.noise[k];
    if (!inA && !inB && !isNoise) continue;

    const ta = p.r1[k] * COVER_END;
    const tb = REVEAL_START + p.r2[k] * REVEAL_SPAN;
    let color: string | null = null;

    if (t < ta) {
      if (inA) color = c.glyph; // texto antigo ainda visível
    } else if (t < tb) {
      color = !inA && !inB && c.noise ? c.noise : c.blocks[k % nb]; // célula coberta
    } else if (inB) {
      color = t < tb + FLASH ? c.flash : c.glyph; // revela o novo
    }
    if (!color) continue;

    ctx.fillStyle = color;
    ctx.fillRect((k % p.cols) * CELL + 0.25, Math.floor(k / p.cols) * CELL + 0.25, CELL - 0.5, CELL - 0.5);
  }
}

/** Ajusta o tamanho do canvas (px CSS × densidade) e a escala do contexto. */
export function sizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number) {
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* ------------------------------------------------------------------ */
/* Palavra em linha (subtítulo)                                        */
/* ------------------------------------------------------------------ */

interface Geometry {
  font: string;
  /** altura da linha do canvas, px CSS */
  h: number;
  /** posição da linha de base, px CSS */
  base: number;
  dpr: number;
}

/** Fonte do elemento hospedeiro (o canvas herda tamanho, peso e família). */
function fontOf(el: Element): string {
  const cs = getComputedStyle(el);
  return `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

export class PixelWord {
  readonly canvas: HTMLCanvasElement;
  private host: HTMLElement;
  private colors: () => FrameColors;
  private geo!: Geometry;
  private raf = 0;
  private ctx: CanvasRenderingContext2D;
  private measureCtx: CanvasRenderingContext2D;

  constructor(host: HTMLElement, colors: () => FrameColors) {
    this.host = host;
    this.colors = colors;
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.canvas.className = 'px-canvas';
    const ctx = this.canvas.getContext('2d');
    const mctx = document.createElement('canvas').getContext('2d');
    if (!ctx || !mctx) throw new Error('canvas 2d indisponível');
    this.ctx = ctx;
    this.measureCtx = mctx;
    this.measure();
  }

  /** Recalcula fonte, altura e densidade (chamar no resize). */
  measure(): void {
    const font = fontOf(this.host);
    const m = this.measureCtx;
    m.font = font;
    const probe = m.measureText('Hgjpçã');
    const ascent = Math.ceil(probe.fontBoundingBoxAscent || probe.actualBoundingBoxAscent * 1.2);
    const descent = Math.ceil(probe.fontBoundingBoxDescent || probe.actualBoundingBoxDescent * 1.4);
    this.geo = { font, h: ascent + descent, base: ascent, dpr: Math.min(2, window.devicePixelRatio || 1) };
  }

  width(text: string): number {
    this.measureCtx.font = this.geo.font;
    return Math.ceil(this.measureCtx.measureText(text).width) + 1;
  }

  private resize(w: number): void {
    const { h, base, dpr } = this.geo;
    sizeCanvas(this.canvas, this.ctx, w, h, dpr);
    // alinha a linha de base do canvas com a do texto ao redor
    this.canvas.style.verticalAlign = `${-(h - base)}px`;
  }

  /** Estado final estático: a palavra nítida, sem células. */
  drawStatic(text: string): void {
    this.stop();
    this.resize(this.width(text));
    const ctx = this.ctx;
    ctx.font = this.geo.font;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = this.colors().glyph;
    ctx.fillText(text, 0, this.geo.base);
  }

  /** Transição de `from` para `to` (from vazio = montar do zero). Resolve ao terminar. */
  transition(from: string, to: string, duration: number): Promise<void> {
    this.stop();
    const { font, base, h } = this.geo;
    const w = Math.max(this.width(from || ' '), this.width(to));
    const p = makePlan(rasterize(from, font, base, w, h), rasterize(to, font, base, w, h));
    this.resize(w);
    const t0 = performance.now();

    return new Promise((resolve) => {
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        // cores lidas a cada quadro: uma troca de paleta no meio vale já no próximo
        drawFrame(this.ctx, p, t, this.colors());
        if (t < 1) {
          this.raf = requestAnimationFrame(frame);
        } else {
          this.raf = 0;
          this.drawStatic(to);
          resolve();
        }
      };
      this.raf = requestAnimationFrame(frame);
    });
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  get animating(): boolean {
    return this.raf !== 0;
  }
}

/* ------------------------------------------------------------------ */
/* Subtítulo "Eu construo [A] para [B]."                               */
/* ------------------------------------------------------------------ */

const PAUSE = 2600;
const SWAP = 1100;

/**
 * `root` contém dois `[data-px-slot]` (0 e 1) com o texto do primeiro par.
 * Se algo falhar, o texto estático do HTML continua lá.
 */
export async function initConstruo(root: HTMLElement, pairs: ReadonlyArray<readonly [string, string]>) {
  if (prefersReducedMotion() || pairs.length < 2) return;

  const slots = Array.from(root.querySelectorAll<HTMLElement>('[data-px-slot]'));
  if (slots.length !== 2) return;

  await waitForFont(fontOf(slots[0]));

  const colors = (): FrameColors => {
    const p = getPalette();
    return { glyph: p.accent, blocks: [p['accent-dark']], noise: p.noise, flash: p['accent-text'] };
  };

  const textFor = (pair: number, slot: number) => pairs[pair][slot] + (slot === 1 ? '.' : '');

  let words: PixelWord[];
  try {
    words = slots.map((s) => new PixelWord(s, colors));
    slots.forEach((s, i) => {
      s.textContent = '';
      s.append(words[i].canvas);
      words[i].drawStatic(textFor(0, i));
    });
  } catch {
    slots.forEach((s, i) => (s.textContent = textFor(0, i)));
    return;
  }
  root.classList.add('is-pixel');

  let current = 0;
  let visible = true;
  let timer = 0;

  const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
  io.observe(root);

  const next = async () => {
    // fora da tela ou aba oculta: não anima, só reagenda
    if (!visible || document.hidden) {
      timer = window.setTimeout(next, PAUSE);
      return;
    }
    const to = (current + 1) % pairs.length;
    await Promise.all(words.map((w, i) => w.transition(textFor(current, i), textFor(to, i), SWAP)));
    current = to;
    timer = window.setTimeout(next, PAUSE);
  };
  timer = window.setTimeout(next, PAUSE);

  window.addEventListener(
    'resize',
    debounce(() => {
      window.clearTimeout(timer);
      words.forEach((w, i) => {
        w.measure();
        w.drawStatic(textFor(current, i));
      });
      timer = window.setTimeout(next, PAUSE);
    }),
  );

  // nova paleta: redesenha o estado parado (animação em curso já lê a cor nova)
  onPaletteChange(() =>
    words.forEach((w, i) => {
      if (!w.animating) w.drawStatic(textFor(current, i));
    }),
  );
}
