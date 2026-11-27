/**
 * Interações do estilo Caderno: rabiscos do rough.js (com semente fixa) que se
 * desenham na rolagem, marca-texto que passa, rabiscos que balançam no clique,
 * anotações de margem alinhadas ao texto e índice com a seção atual.
 *
 * Sem JS a página já é um caderno (bordas e sublinhados em CSS). Quando o
 * rough.js desenha, html ganha .c-rough e as versões em CSS somem.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import rough from 'roughjs';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

const NS = 'http://www.w3.org/2000/svg';
const $$ = <T extends Element = HTMLElement>(sel: string, raiz: ParentNode = document) =>
  Array.from(raiz.querySelectorAll<T>(sel) as NodeListOf<T>);

interface Rabisco {
  el: HTMLElement;
  tipo: string;
  seed: number;
  feito: boolean;
  svg?: SVGSVGElement;
}

/* ---------- rough.js ---------- */
function desenha(r: Rabisco, esconder: boolean) {
  r.svg?.remove();
  const el = r.el;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (!w || !h) return;
  const cor = el.dataset.cor || '#22304a';
  const P = 16;
  const svg = document.createElementNS(NS, 'svg') as SVGSVGElement;
  svg.setAttribute('class', 'c-rabisco');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('width', String(w + P * 2));
  svg.setAttribute('height', String(h + P * 2));
  svg.style.left = `${-P}px`;
  svg.style.top = `${-P}px`;
  const rc = rough.svg(svg);
  const o = { seed: r.seed, stroke: cor, strokeWidth: 2, roughness: 1.3, bowing: 1.2 };
  const nos: SVGGElement[] = [];

  switch (r.tipo) {
    case 'sublinhado': {
      // inline-block com entrelinha alta: o traço vai logo abaixo da letra, não da caixa
      const fs = parseFloat(getComputedStyle(el).fontSize) || 20;
      const y = P + Math.min(h, h / 2 + fs * 0.62);
      nos.push(
        rc.curve(
          [
            [P - 6, y + 2],
            [P + w * 0.3, y - 1],
            [P + w * 0.65, y + 2],
            [P + w + 8, y - 2],
          ],
          { ...o, strokeWidth: 2.6, disableMultiStroke: true },
        ),
      );
      if ('duplo' in el.dataset) {
        nos.push(
          rc.curve(
            [
              [P + w * 0.06, y + 9],
              [P + w * 0.5, y + 6],
              [P + w + 2, y + 8],
            ],
            { ...o, seed: r.seed + 1, strokeWidth: 2, disableMultiStroke: true },
          ),
        );
      }
      break;
    }
    case 'circulo':
      nos.push(rc.ellipse(P + w / 2, P + h / 2, w + 16, h + 14, { ...o, strokeWidth: 2.2, roughness: 1.5 }));
      break;
    case 'caixa':
      nos.push(rc.rectangle(P, P, w, h, { ...o, strokeWidth: 2.3, roughness: 1.6, bowing: 1.6 }));
      break;
    case 'linha': {
      const ponto = el.querySelector<HTMLElement>('.c-etapa__ponto');
      const re = el.getBoundingClientRect();
      const x = ponto ? ponto.getBoundingClientRect().left + ponto.offsetWidth / 2 - re.left + P : P + 18;
      const yf = P + h + 6;
      nos.push(rc.line(x, P + 10, x + 3, yf, { ...o, strokeWidth: 2.6, roughness: 1.1, bowing: 3 }));
      nos.push(
        rc.line(x + 3, yf + 2, x - 8, yf - 12, { ...o, seed: r.seed + 2, strokeWidth: 2.6, disableMultiStroke: true }),
        rc.line(x + 3, yf + 2, x + 14, yf - 11, { ...o, seed: r.seed + 3, strokeWidth: 2.6, disableMultiStroke: true }),
      );
      break;
    }
    case 'seta': {
      const cima = el.dataset.dir === 'cima';
      const x0 = P + w * (cima ? 0.95 : 0.55);
      const y0 = cima ? P + h - 4 : P + 2;
      const x1 = P + w * (cima ? 0.3 : 0.45);
      const y1 = cima ? P + 3 : P + h - 2;
      const meio: [number, number] = cima ? [P + w * 0.2, P + h * 0.62] : [P + w * 0.9, P + h * 0.5];
      nos.push(rc.curve([[x0, y0], meio, [x1, y1]], { ...o, strokeWidth: 2.4, disableMultiStroke: true }));
      const d = cima ? 1 : -1;
      nos.push(
        rc.line(x1, y1, x1 - 9, y1 + d * 11, { ...o, seed: r.seed + 2, strokeWidth: 2.4, disableMultiStroke: true }),
        rc.line(x1, y1, x1 + 10, y1 + d * 9, { ...o, seed: r.seed + 3, strokeWidth: 2.4, disableMultiStroke: true }),
      );
      break;
    }
  }
  svg.append(...nos);
  el.append(svg);
  r.svg = svg;
  if (esconder) gsap.set($$<SVGPathElement>('path', svg), { drawSVG: '0%' });
}

function animaRabisco(r: Rabisco) {
  r.feito = true;
  if (!r.svg) return;
  const caminhos = $$<SVGPathElement>('path', r.svg);
  gsap.to(caminhos, {
    drawSVG: '100%',
    duration: r.tipo === 'linha' ? 1.6 : r.tipo === 'caixa' ? 1.1 : 0.7,
    ease: 'power1.inOut',
    stagger: 0.18,
  });
}

/* ---------- anotações de margem alinhadas ao texto ---------- */
function alinhaNotas() {
  const caixa = document.querySelector<HTMLElement>('.c-notas');
  if (!caixa) return;
  const notas = $$('.c-nota', caixa);
  const largo = matchMedia('(min-width: 1001px)').matches;
  let minimo = 0;
  const topo = caixa.getBoundingClientRect().top;
  for (const n of notas) {
    if (!largo) {
      n.style.position = '';
      n.style.top = '';
      continue;
    }
    const alvo = document.getElementById(n.dataset.alvo ?? '');
    if (!alvo) continue;
    const y = Math.max(alvo.getBoundingClientRect().top - topo - 4, minimo);
    n.style.position = 'absolute';
    n.style.top = `${y}px`;
    minimo = y + n.offsetHeight + 12;
  }
}

/* ---------- índice: seção atual ---------- */
function indiceAtual() {
  for (const l of $$<HTMLAnchorElement>('.c-indice a')) {
    const alvo = document.querySelector(l.getAttribute('href')!);
    if (!alvo) continue;
    ScrollTrigger.create({
      trigger: alvo,
      start: 'top 40%',
      end: 'bottom 40%',
      onToggle: (st) => (st.isActive ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current')),
    });
  }
}

export async function iniciar() {
  const rabiscos: Rabisco[] = $$('[data-rabisco]').map((el, i) => ({
    el,
    tipo: el.dataset.rabisco!,
    seed: 11 + i * 17,
    feito: false,
  }));

  try {
    await document.fonts.ready;
  } catch {
    /* segue com as medidas que tiver */
  }

  let animar = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('c-rough');
  for (const r of rabiscos) desenha(r, animar);
  alinhaNotas();
  indiceAtual();

  // redesenha (sem animar o que já foi desenhado) quando a largura muda
  let largura = innerWidth;
  let espera = 0;
  addEventListener('resize', () => {
    clearTimeout(espera);
    espera = window.setTimeout(() => {
      if (Math.abs(innerWidth - largura) < 2) return;
      largura = innerWidth;
      for (const r of rabiscos) desenha(r, animar && !r.feito);
      alinhaNotas();
      ScrollTrigger.refresh();
    }, 220);
  });

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: reduce)', () => {
    animar = false;
    for (const r of rabiscos) {
      r.feito = true;
      if (r.svg) gsap.set($$('path', r.svg), { drawSVG: '100%' });
    }
  });

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    animar = true;

    /* rabiscos se desenham ao entrar na tela */
    for (const r of rabiscos) {
      if (r.feito) continue;
      ScrollTrigger.create({
        trigger: r.el,
        start: 'top 88%',
        once: true,
        onEnter: () => animaRabisco(r),
      });
    }

    /* entrada do hero: marca-texto no nome e o desenho */
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('.c-oi', { opacity: 0, x: -20, rotation: -8, duration: 0.5 })
      .from('.c-swipe path', { drawSVG: '0%', duration: 0.8, ease: 'power2.inOut' }, 0.25)
      .from('.c-h1__texto', { opacity: 0, y: 14, duration: 0.6 }, 0.15);
    const tracos = $$<SVGPathElement>('.c-dev .c-traco');
    tl.from(tracos, { drawSVG: '0%', duration: 0.9, stagger: 0.07, ease: 'power1.inOut' }, 0.3);
    tl.from('.c-dev [fill]:not([fill="none"]).c-traco', { fillOpacity: 0, duration: 0.5, stagger: 0.05 }, 1.2);
    tl.from('.c-dev__sol', { scale: 0.4, opacity: 0, transformOrigin: '50% 50%', duration: 0.7, ease: 'back.out(1.6)' }, 0.5);
    tl.from('.c-dev__balao', { scale: 0, transformOrigin: '20% 100%', duration: 0.5, ease: 'back.out(2)' }, 1.7);

    /* post-its caem na página */
    gsap.from('.c-postit', {
      y: -50,
      rotation: (i: number) => (i % 2 ? -10 : 10),
      opacity: 0,
      duration: 0.8,
      stagger: 0.14,
      ease: 'back.out(1.5)',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: '.c-postits', start: 'top 92%', once: true },
    });

    /* fichas presas com fita */
    for (const f of $$('.c-ficha')) {
      gsap.from(f, {
        y: 60,
        rotation: f.classList.contains('c-ficha--b') ? 6 : -6,
        opacity: 0,
        duration: 0.9,
        ease: 'back.out(1.3)',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: f, start: 'top 90%', once: true },
      });
    }

    /* desenhos que se fazem na rolagem */
    for (const svg of $$<SVGSVGElement>('.c-ficha__icone')) {
      gsap.from($$('.c-traco-rolagem', svg), {
        drawSVG: '0%',
        duration: 0.8,
        stagger: 0.2,
        ease: 'power1.inOut',
        scrollTrigger: { trigger: svg, start: 'top 90%', once: true },
      });
    }

    /* checklists */
    for (const lista of $$('.c-lista')) {
      gsap.from($$('.c-check', lista), {
        drawSVG: '0%',
        duration: 0.35,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: { trigger: lista, start: 'top 85%', once: true },
      });
    }

    /* marca-texto passa sobre as palavras */
    for (const m of $$('.c-marca')) {
      if (m.closest('.c-hero')) continue;
      gsap.from(m, {
        backgroundSize: '0% 72%',
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: m, start: 'top 85%', once: true },
      });
    }
    gsap.from('.c-hero .c-marca', { backgroundSize: '0% 72%', duration: 0.6, stagger: 0.15, delay: 1, ease: 'power2.out' });

    /* anotações de margem */
    gsap.from('.c-nota, .c-ficha__nota', {
      opacity: 0,
      x: -16,
      duration: 0.5,
      stagger: 0.1,
      scrollTrigger: { trigger: '#sobre', start: 'top 70%', once: true },
    });

    /* avião de papel */
    const aviao = document.querySelector('.c-aviao');
    if (aviao) {
      const t = gsap.timeline({ scrollTrigger: { trigger: aviao, start: 'top 85%', once: true } });
      t.from('.c-aviao__mascara', { drawSVG: '0%', duration: 1.6, ease: 'power1.inOut' }).from(
        '.c-aviao__corpo',
        { x: -170, y: 110, rotation: -25, opacity: 0, duration: 1.6, ease: 'power1.inOut', transformOrigin: '50% 50%' },
        0,
      );
    }

    /* clique num rabisco: ele balança */
    const balanca = (e: Event) => {
      const alvo = e.currentTarget as Element;
      if (gsap.isTweening(alvo)) return;
      gsap.to(alvo, {
        keyframes: { rotation: [0, -8, 7, -5, 3, 0] },
        duration: 0.6,
        ease: 'power1.inOut',
        transformOrigin: '50% 60%',
      });
    };
    const doodles = $$('.c-doodle');
    doodles.forEach((d) => d.addEventListener('click', balanca));

    return () => doodles.forEach((d) => d.removeEventListener('click', balanca));
  });
}
