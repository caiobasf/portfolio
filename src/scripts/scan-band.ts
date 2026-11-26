/**
 * Listras de scanner (spec 2, §6.2): linhas horizontais de 1px a cada 5px,
 * deformadas por um perfil em degraus ("plateau") que anda devagar.
 *
 * Usado pela faixa entre o hero e o "Sobre" e pelo fundo do boot.
 *
 * Orçamento: um laço requestAnimationFrame por instância, no máximo 25 qps
 * (40ms), parado fora da tela (IntersectionObserver) e com a aba oculta
 * (visibilitychange). Com movimento reduzido, um quadro estático.
 */
import { onPaletteChange } from './palette';
import { debounce, prefersReducedMotion } from './pixel-text';

const MIN_FRAME = 40; // ms → 25 quadros por segundo

/** Desenha as listras no instante `t` (ms). `w`, `h` em px do canvas (já × dpr). */
export function drawStripes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  amp: number,
  color: string,
  dpr: number,
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = Math.max(1, dpr);
  ctx.strokeStyle = color;
  const gap = 5 * dpr;
  const step = 4 * dpr;
  for (let y0 = gap; y0 < h; y0 += gap) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += step) {
      const u = x / w;
      const plateau = Math.floor(u * 14) / 14; // degraus do perfil de varredura
      const base =
        0.6 * Math.sin(plateau * 23 + (y0 / dpr) * 0.02 + t * 0.0006) + 0.4 * Math.sin(plateau * 7.3 - t * 0.0004);
      const jitter = 0.5 * Math.sin((x / dpr) * 0.35 + (y0 / dpr) * 0.9 + t * 0.004);
      const y = y0 + (base * 9 + jitter * 1.6) * amp * dpr;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

export interface StripesOptions {
  /** cor das linhas (lida a cada quadro: acompanha a paleta) */
  color: () => string;
  /** amplitude (1 = faixa da landing) */
  amp: () => number;
}

export class Stripes {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private onScreen = true;
  private started = false;
  private readonly still = prefersReducedMotion();
  private cleanup: Array<() => void> = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: StripesOptions,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d indisponível');
    this.ctx = ctx;
    this.resize();

    const onResize = debounce(() => {
      this.resize();
      this.frame(performance.now());
    });
    window.addEventListener('resize', onResize);
    this.cleanup.push(() => window.removeEventListener('resize', onResize));

    const onVis = () => this.update();
    document.addEventListener('visibilitychange', onVis);
    this.cleanup.push(() => document.removeEventListener('visibilitychange', onVis));

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => {
        this.onScreen = e.isIntersecting;
        this.update();
      });
      io.observe(canvas);
      this.cleanup.push(() => io.disconnect());
    }

    // parado (movimento reduzido ou fora da tela): redesenha com a cor nova
    this.cleanup.push(onPaletteChange(() => this.frame(performance.now())));
  }

  private resize(): void {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.floor(r.width * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(r.height * this.dpr));
  }

  private frame(now: number): void {
    const { width, height } = this.canvas;
    drawStripes(this.ctx, width, height, this.still ? 0 : now, this.opts.amp(), this.opts.color(), this.dpr);
  }

  /** Liga ou desliga o laço conforme tela, aba e movimento reduzido. */
  private update(): void {
    const run = this.started && !this.still && this.onScreen && !document.hidden;
    if (run && !this.raf) {
      const loop = (now: number) => {
        if (!this.canvas.isConnected) return this.destroy();
        if (now - this.last >= MIN_FRAME) {
          this.last = now;
          this.frame(now);
        }
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    } else if (!run && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  start(): void {
    this.started = true;
    this.frame(performance.now()); // primeiro quadro já (e o único, com movimento reduzido)
    this.update();
  }

  destroy(): void {
    this.started = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.cleanup.forEach((fn) => fn());
    this.cleanup = [];
  }
}
