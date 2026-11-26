/**
 * Interações do estilo executivo: contidas e "premium". Tudo é acréscimo —
 * sem JS a página está completa, com os números já no valor final.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<T>(s));

const nf = new Intl.NumberFormat('pt-BR');
const EASE = 'power3.out';

function imprimir() {
  const btn = $<HTMLButtonElement>('.js-imprimir');
  if (!btn) return;
  btn.hidden = false;
  btn.addEventListener('click', () => window.print());
}

function progresso() {
  const barra = $('.js-progresso');
  if (!barra) return;
  let pendente = false;
  const atualizar = () => {
    pendente = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener(
    'scroll',
    () => {
      if (!pendente) {
        pendente = true;
        requestAnimationFrame(atualizar);
      }
    },
    { passive: true },
  );
  atualizar();
}

function navAtiva() {
  const links = $$<HTMLAnchorElement>('.ex-nav a[data-nav]');
  const mapa = new Map(links.map((a) => [a.dataset.nav!, a]));
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.removeAttribute('aria-current'));
        mapa.get(e.target.id)?.setAttribute('aria-current', 'location');
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  mapa.forEach((_, id) => {
    const s = document.getElementById(id);
    if (s) io.observe(s);
  });
}

export function iniciar() {
  imprimir();
  progresso();
  navAtiva();

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // ---- rolagem suave (Lenis) ligada ao ScrollTrigger ----
    const lenis = new Lenis({ duration: 1.1, anchors: { offset: -80 } });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // ---- capa ----
    const nome = $('.js-nome');
    let split: SplitText | null = null;
    const capa = gsap.timeline({ defaults: { ease: EASE } });
    if (nome) {
      split = SplitText.create(nome, { type: 'lines', mask: 'lines', linesClass: 'ex-linha' });
      capa.from(split.lines, {
        yPercent: 105,
        duration: 1.15,
        stagger: 0.12,
        ease: 'power4.out',
        onComplete: () => split?.revert(),
      });
    }
    capa
      .from('.ex-capa .js-regua', { scaleX: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.2 }, 0)
      .from('.js-capa-item', { opacity: 0, y: 18, duration: 0.9, stagger: 0.08 }, 0.35)
      .from('.ex-sumario li', { opacity: 0, x: 16, duration: 0.7, stagger: 0.06 }, 0.7);

    const caminhos = $$<SVGPathElement>('.js-guilhoche path');
    if (caminhos.length) {
      capa.from(caminhos, { drawSVG: '0%', duration: 2.6, ease: 'power2.inOut', stagger: 0.08 }, 0.1);
      capa.from('.js-guilhoche circle', { drawSVG: '0%', duration: 1.8, ease: 'power2.inOut' }, 0.3);
      gsap.to('.js-guilhoche', {
        rotate: 24,
        transformOrigin: '50% 50%',
        ease: 'none',
        scrollTrigger: { trigger: '.ex-capa', start: 'top top', end: 'bottom top', scrub: 0.8 },
      });
    }

    // ---- fios que se desenham ----
    $$('.js-regua')
      .filter((r) => !r.closest('.ex-capa'))
      .forEach((r) => {
        gsap.from(r, {
          scaleX: 0,
          duration: 1.3,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: r, start: 'top 90%', once: true },
        });
      });

    // ---- subida suave ----
    ScrollTrigger.batch('.js-sobe', {
      start: 'top 88%',
      once: true,
      onEnter: (els) => gsap.from(els, { opacity: 0, y: 26, duration: 1, ease: EASE, stagger: 0.09, overwrite: true }),
    });
    ScrollTrigger.batch('.js-linha', {
      start: 'top 92%',
      once: true,
      onEnter: (els) => gsap.from(els, { opacity: 0, x: -12, duration: 0.8, ease: EASE, stagger: 0.07 }),
    });

    // ---- números com contagem ----
    $$('.js-numero').forEach((card, i) => {
      const alvo = $('.js-conta', card);
      const valor = Number(alvo?.dataset.valor ?? 0);
      const t = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 85%', once: true }, delay: i * 0.12 });
      t.from(card, { opacity: 0, y: 30, duration: 0.9, ease: EASE });
      if (alvo && valor) {
        const obj = { v: 0 };
        t.to(
          obj,
          {
            v: valor,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: () => {
              alvo.textContent = nf.format(Math.round(obj.v));
            },
          },
          0.1,
        );
      }
    });

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      split?.revert();
    };
  });
}
