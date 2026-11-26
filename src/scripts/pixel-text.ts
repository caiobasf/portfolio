/**
 * Texto em pixels num <canvas>: rasteriza a palavra fora da tela, amostra em
 * células de 3px e faz a transição "cobrir → revelar" célula a célula.
 *
 * Usado pelo subtítulo "Eu construo [A] para [B]." e pelo apelido do hero.
 */

const CELL = 3; // px CSS por célula
const COVER_END = 0.45; // fase 1 (cobrir) ocupa de 0 a ~45% do tempo
const REVEAL_START = 0.55;
const REVEAL_SPAN = 0.4;
const FLASH = 0.06; // duração do clarão ao revelar (fração do tempo total)
const NOISE_RATIO = 0.1;
const ALPHA_THRESHOLD = 90;

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lê uma variável CSS de :root (as cores vêm sempre dos tokens). */
export const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

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

interface Geometry {
  font: string;
  /** altura da linha do canvas, px CSS */
  h: number;
  /** posição da linha de base, px CSS */
  base: number;
  dpr: number;
}

export interface PixelPalette {
  glyph: string;
  cover: string;
  noise: string;
  flash: string;
}

interface Plan {
  a: Uint8Array;
  b: Uint8Array;
  cols: number;
  rows: number;
  r1: Float32Array;
  r2: Float32Array;
  noise: Uint8Array;
  w: number;
}

/** Fonte do elemento hospedeiro (o canvas herda tamanho, peso e família). */
function fontOf(el: Element): string {
  const cs = getComputedStyle(el);
  return `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

export class PixelWord {
  readonly canvas: HTMLCanvasElement;
  private host: HTMLElement;
  private palette: () => PixelPalette;
  private geo!: Geometry;
  private raf = 0;
  private ctx: CanvasRenderingContext2D;
  private measureCtx: CanvasRenderingContext2D;

  constructor(host: HTMLElement, palette: () => PixelPalette) {
    this.host = host;
    this.palette = palette;
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
    this.geo = {
      font,
      h: ascent + descent,
      base: ascent,
      dpr: Math.min(2, window.devicePixelRatio || 1),
    };
  }

  width(text: string): number {
    this.measureCtx.font = this.geo.font;
    return Math.ceil(this.measureCtx.measureText(text).width) + 1;
  }

  private resize(w: number): void {
    const { h, base, dpr } = this.geo;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    // alinha a linha de base do canvas com a do texto ao redor
    this.canvas.style.verticalAlign = `${-(h - base)}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Estado final estático: a palavra nítida, sem células. */
  drawStatic(text: string): void {
    this.stop();
    this.resize(this.width(text));
    const ctx = this.ctx;
    ctx.font = this.geo.font;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = this.palette().glyph;
    ctx.fillText(text, 0, this.geo.base);
  }

  private cells(text: string, w: number): { on: Uint8Array; cols: number; rows: number } {
    const h = this.geo.h;
    const cols = Math.ceil(w / CELL);
    const rows = Math.ceil(h / CELL);
    const on = new Uint8Array(cols * rows);
    if (!text) return { on, cols, rows };

    const oc = document.createElement('canvas');
    oc.width = w;
    oc.height = h;
    const x = oc.getContext('2d', { willReadFrequently: true });
    if (!x) return { on, cols, rows };
    x.font = this.geo.font;
    x.textBaseline = 'alphabetic';
    x.fillStyle = '#fff'; // máscara invisível: só o canal alfa é lido
    x.fillText(text, 0, this.geo.base);
    const data = x.getImageData(0, 0, w, h).data;

    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        let hit = 0;
        const yEnd = Math.min(h, (cy + 1) * CELL);
        const xEnd = Math.min(w, (cx + 1) * CELL);
        for (let yy = cy * CELL; yy < yEnd && !hit; yy++) {
          for (let xx = cx * CELL; xx < xEnd; xx++) {
            if (data[(yy * w + xx) * 4 + 3] > ALPHA_THRESHOLD) {
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

  private plan(from: string, to: string): Plan {
    const w = Math.max(this.width(from || ' '), this.width(to));
    const a = this.cells(from, w);
    const b = this.cells(to, w);
    const n = a.cols * a.rows;
    const r1 = new Float32Array(n);
    const r2 = new Float32Array(n);
    const noise = new Uint8Array(n);
    for (let k = 0; k < n; k++) {
      r1[k] = Math.random();
      r2[k] = Math.random();
      noise[k] = Math.random() < NOISE_RATIO ? 1 : 0;
    }
    return { a: a.on, b: b.on, cols: a.cols, rows: a.rows, r1, r2, noise, w };
  }

  private drawFrame(p: Plan, t: number, pal: PixelPalette): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, p.w, this.geo.h);
    const n = p.cols * p.rows;
    for (let k = 0; k < n; k++) {
      const inA = p.a[k];
      const inB = p.b[k];
      const isNoise = p.noise[k];
      if (!inA && !inB && !isNoise) continue;

      const ta = p.r1[k] * COVER_END;
      const tb = REVEAL_START + p.r2[k] * REVEAL_SPAN;
      let color: string | null = null;

      if (t < ta) {
        if (inA) color = pal.glyph; // palavra antiga ainda visível
      } else if (t < tb) {
        color = inA || inB ? pal.cover : pal.noise; // célula coberta
      } else if (inB) {
        color = t < tb + FLASH ? pal.flash : pal.glyph; // revela a nova
      }
      if (!color) continue;

      ctx.fillStyle = color;
      ctx.fillRect((k % p.cols) * CELL + 0.25, Math.floor(k / p.cols) * CELL + 0.25, CELL - 0.5, CELL - 0.5);
    }
  }

  /**
   * Transição de `from` para `to` (from vazio = montar do zero;
   * from === to = desmontar e remontar). Resolve ao terminar.
   */
  transition(from: string, to: string, duration: number): Promise<void> {
    this.stop();
    const p = this.plan(from, to);
    this.resize(p.w);
    const pal = this.palette();
    const t0 = performance.now();

    return new Promise((resolve) => {
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        this.drawFrame(p, t, pal);
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

  const palette = (): PixelPalette => ({
    glyph: cssVar('--accent'),
    cover: cssVar('--accent-deep'),
    noise: cssVar('--pixel-noise'),
    flash: cssVar('--accent-text'),
  });

  const textFor = (pair: number, slot: number) => pairs[pair][slot] + (slot === 1 ? '.' : '');

  let words: PixelWord[];
  try {
    words = slots.map((s) => new PixelWord(s, palette));
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
}

/* ------------------------------------------------------------------ */
/* Apelido "caiobasf"                                                  */
/* ------------------------------------------------------------------ */

const NICK_DURATION = 1300;

export async function initApelido(button: HTMLButtonElement, word: string) {
  if (prefersReducedMotion()) return;

  const host = button.querySelector<HTMLElement>('[data-px-host]') ?? button;
  await waitForFont(fontOf(host));

  const palette = (): PixelPalette => ({
    glyph: cssVar('--text'),
    cover: cssVar('--accent-dark'),
    noise: cssVar('--pixel-noise'),
    flash: cssVar('--accent-text'),
  });

  let pw: PixelWord;
  try {
    pw = new PixelWord(host, palette);
    host.textContent = '';
    host.append(pw.canvas);
  } catch {
    host.textContent = word;
    return;
  }

  let busy = false;
  const run = async (from: string) => {
    if (busy) return;
    busy = true;
    await pw.transition(from, word, NICK_DURATION);
    busy = false;
  };

  run(''); // monta ao carregar

  const replay = () => run(word);
  button.addEventListener('mouseenter', replay);
  button.addEventListener('focus', replay);
  button.addEventListener('click', replay);

  window.addEventListener(
    'resize',
    debounce(() => {
      if (busy) return;
      pw.measure();
      pw.drawStatic(word);
    }),
  );
}
