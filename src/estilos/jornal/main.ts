/**
 * Estilo "jornal": animações discretas.
 * - o jornal chega girando (uma vez por sessão), como nos filmes antigos;
 * - a manchete "pega tinta" palavra a palavra;
 * - os fios se desenham ao entrar na tela; o sol da previsão gira devagar.
 * Tudo parte do JS (gsap.from): sem JS, a página fica inteira e parada.
 * Com movimento reduzido, nada anima e as cotações ficam paradas.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const GIRO_KEY = 'cf-jornal-giro';

/* botão de pausa das cotações (WCAG 2.2.2) */
const cotacoes = document.querySelector<HTMLElement>('.j-cotacoes');
const pausa = document.querySelector<HTMLButtonElement>('[data-pausa]');
pausa?.addEventListener('click', () => {
  const pausado = cotacoes?.classList.toggle('j-pausado') ?? false;
  pausa.innerHTML = `${pausado ? 'Retomar' : 'Pausar'}<span class="j-sr"> cotações</span>`;
});

const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)', () => {
  const folha = document.querySelector<HTMLElement>('.j-folha');
  const titulo = document.querySelector<HTMLElement>('.j-manchete h1');
  let girar = false;
  try {
    girar = !sessionStorage.getItem(GIRO_KEY);
    sessionStorage.setItem(GIRO_KEY, '1');
  } catch {}
  // só gira se a página abriu no topo (sem âncora)
  if (location.hash || scrollY > 40) girar = false;

  const tl = gsap.timeline();
  if (folha && girar) {
    tl.from(folha, {
      rotation: -720,
      scale: 0.06,
      autoAlpha: 0,
      duration: 1.15,
      ease: 'power3.out',
      transformOrigin: `50% ${Math.min(innerHeight / 2, 420)}px`,
      clearProps: 'transform,opacity,visibility',
    });
    tl.from(folha, { y: 18, duration: 0.25, ease: 'power2.in', clearProps: 'transform' }, '>-0.05');
  }

  let split: SplitText | null = null;
  if (titulo) {
    split = SplitText.create(titulo, { type: 'words', wordsClass: 'j-palavra' });
    tl.from(
      split.words,
      {
        opacity: 0,
        filter: 'blur(5px)',
        y: 6,
        duration: 0.55,
        ease: 'power2.out',
        stagger: 0.045,
        clearProps: 'filter,transform,opacity',
      },
      girar ? 0.95 : 0.1,
    );
  }

  // fios que se desenham
  for (const fio of gsap.utils.toArray<HTMLElement>('.j-fio')) {
    gsap.from(fio, {
      scaleX: 0,
      transformOrigin: '0 50%',
      duration: 0.9,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: fio, start: 'top 94%', once: true },
    });
  }

  // olhos (citações) e carimbo
  for (const el of gsap.utils.toArray<HTMLElement>('.j-olho')) {
    gsap.from(el, {
      clipPath: 'inset(0 100% 0 0)',
      duration: 0.8,
      ease: 'power2.out',
      clearProps: 'clipPath',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  }
  const carimbo = document.querySelector('.j-carimbo');
  if (carimbo) {
    gsap.from(carimbo, {
      scale: 2.4,
      opacity: 0,
      rotation: -22,
      duration: 0.45,
      ease: 'back.out(2)',
      delay: girar ? 1.6 : 0.6,
      clearProps: 'scale,opacity,rotation',
    });
  }

  // o sol da previsão gira devagar (pausa com a aba oculta, pelo próprio gsap)
  const raios = gsap.to('.j-raios', { rotation: 360, duration: 24, ease: 'none', repeat: -1 });
  const sol = document.querySelector('.j-sol');
  let io: IntersectionObserver | null = null;
  if (sol) {
    io = new IntersectionObserver(([e]) => (e.isIntersecting ? raios.play() : raios.pause()));
    io.observe(sol);
  }

  return () => {
    split?.revert();
    io?.disconnect();
  };
});
