/**
 * Título do hero: CAIOBASF ⇄ "Caio Bruno Alves Santana Ferreira" em pixels.
 *
 * - Um único canvas com o tamanho do maior texto (o layout não pula).
 * - Os dois textos são rasterizados na MESMA grade de 3px, mesmo com fontes
 *   de tamanhos diferentes: é isso que permite animar de um para o outro.
 * - Fila de um passo: guarda estado atual e alvo; se o alvo muda no meio,
 *   termina a animação atual e só então começa a próxima. Nunca empilha.
 *
 * Estado exposto para os testes no botão: data-state, data-target,
 * data-anim ("1" animando) e data-max-anim (máximo de animações simultâneas).
 */
import { getPalette, onPaletteChange } from './palette';
import {
  type CellGrid,
  type FrameColors,
  debounce,
  drawFrame,
  makePlan,
  prefersReducedMotion,
  rasterize,
  sizeCanvas,
  waitForFont,
} from './pixel-text';

type Estado = 'apelido' | 'nome';

const DURACAO = 1000; // troca e montagem inicial

interface Geo {
  W: number;
  H: number;
  dpr: number;
  apelido: { font: string; base: number; grid: CellGrid };
  nome: { font: string; base: number; grid: CellGrid };
  vazio: CellGrid;
}

export async function initHeroTitle(button: HTMLButtonElement, textos: Record<Estado, string>): Promise<void> {
  const h1 = button.parentElement;
  if (!h1) return;

  const familia = getComputedStyle(button).fontFamily;
  const fontPx = (px: number) => `500 ${px}px ${familia}`;
  const fsAtual = () => parseFloat(getComputedStyle(button).fontSize) || 80;
  await waitForFont(fontPx(fsAtual()));

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'hero__canvas';
  const ctx = canvas.getContext('2d');
  const mctx = document.createElement('canvas').getContext('2d');
  if (!ctx || !mctx) return; // fica o texto do HTML

  const reduzir = prefersReducedMotion();

  let geo: Geo;
  const medir = (): Geo => {
    const fs = fsAtual();
    const H = Math.ceil(fs * 1.5);
    const disponivel = Math.max(140, Math.floor(h1.getBoundingClientRect().width));
    const largura = (t: string, f: string) => {
      mctx.font = f;
      return Math.ceil(mctx.measureText(t).width) + 2;
    };

    const fApelido = fontPx(fs);
    const wApelido = largura(textos.apelido, fApelido);

    // nome: metade do título (até 56px), reduzido até caber na largura
    let fn = Math.min(fs * 0.5, 56);
    let wNome = largura(textos.nome, fontPx(fn));
    if (wNome > disponivel) {
      fn = Math.floor(((fn * disponivel) / wNome) * 10) / 10;
      wNome = largura(textos.nome, fontPx(fn));
    }
    const fNome = fontPx(fn);

    const W = Math.min(Math.max(wApelido, wNome), Math.max(disponivel, wApelido));
    const baseApelido = Math.round(H * 0.72);
    const baseNome = Math.round(H / 2 + fn * 0.35);
    return {
      W,
      H,
      dpr: Math.min(2, window.devicePixelRatio || 1),
      apelido: { font: fApelido, base: baseApelido, grid: rasterize(textos.apelido, fApelido, baseApelido, W, H) },
      nome: { font: fNome, base: baseNome, grid: rasterize(textos.nome, fNome, baseNome, W, H) },
      vazio: rasterize('', fApelido, baseApelido, W, H),
    };
  };

  const cores = (): FrameColors => {
    const p = getPalette();
    return { glyph: p.text, blocks: [p['accent-dark'], p.noise, p['accent-text']], flash: p['accent-text'] };
  };

  let estado: Estado = 'apelido';
  let alvo: Estado = 'apelido';
  let raf = 0;
  let ativas = 0;
  let maxAtivas = 0;

  const marcar = () => {
    button.dataset.state = estado;
    button.dataset.target = alvo;
    button.dataset.anim = raf ? '1' : '0';
    button.dataset.maxAnim = String(maxAtivas);
  };

  const desenharEstatico = (e: Estado) => {
    sizeCanvas(canvas, ctx, geo.W, geo.H, geo.dpr);
    ctx.clearRect(0, 0, geo.W, geo.H);
    ctx.font = geo[e].font;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = getPalette().text;
    ctx.fillText(textos[e], 0, geo[e].base);
  };

  const animar = (de: CellGrid, para: Estado) => {
    const plano = makePlan(de, geo[para].grid);
    sizeCanvas(canvas, ctx, geo.W, geo.H, geo.dpr);
    const t0 = performance.now();
    ativas++;
    maxAtivas = Math.max(maxAtivas, ativas);

    const quadro = (agora: number) => {
      const t = Math.min(1, (agora - t0) / DURACAO);
      drawFrame(ctx, plano, t, cores()); // paleta lida a cada quadro
      if (t < 1) {
        raf = requestAnimationFrame(quadro);
        return;
      }
      raf = 0;
      ativas--;
      estado = para;
      desenharEstatico(estado);
      marcar();
      seguir();
    };
    raf = requestAnimationFrame(quadro);
    marcar();
  };

  /** Fila de um passo: só começa a próxima quando a atual termina. */
  const seguir = () => {
    if (raf || alvo === estado) return;
    if (reduzir) {
      estado = alvo;
      desenharEstatico(estado);
      marcar();
      return;
    }
    animar(geo[estado].grid, alvo);
  };

  const irPara = (e: Estado) => {
    alvo = e;
    marcar();
    seguir();
  };

  // monta: troca o texto do HTML pelo canvas e constrói CAIOBASF a partir do vazio
  geo = medir();
  const fallback = button.querySelector('[data-hero-fallback]');
  fallback?.remove();
  button.append(canvas);
  h1.classList.add('is-pixel');
  if (reduzir) {
    desenharEstatico('apelido');
    marcar();
  } else {
    animar(geo.vazio, 'apelido');
  }

  /* ---- interação ---- */
  let ponteiro = '';
  let hover = false;

  button.addEventListener('pointerdown', (e) => (ponteiro = e.pointerType));
  button.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    hover = true;
    irPara('nome');
  });
  button.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    hover = false;
    if (!button.matches(':focus-visible')) irPara('apelido');
  });
  // foco pelo teclado mostra o nome; foco vindo de toque fica com o clique
  button.addEventListener('focus', () => {
    if (button.matches(':focus-visible')) irPara('nome');
  });
  button.addEventListener('blur', () => {
    if (!hover) irPara('apelido');
  });
  button.addEventListener('click', (e) => {
    const tipo = e.detail === 0 ? 'teclado' : ponteiro;
    if (tipo === 'mouse') return; // com mouse quem manda é o hover
    irPara(alvo === 'nome' ? 'apelido' : 'nome');
  });

  window.addEventListener(
    'resize',
    debounce(() => {
      // recalcula e redesenha o estado alvo, sem reanimar
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        ativas--;
      }
      estado = alvo;
      geo = medir();
      desenharEstatico(estado);
      marcar();
    }),
  );

  onPaletteChange(() => {
    if (!raf) desenharEstatico(estado);
  });
}
