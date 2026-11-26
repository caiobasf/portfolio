/**
 * Neo-brutalista: animações elásticas, letreiro, slot do "Eu construo",
 * adesivos arrastáveis (Draggable + Inertia) e copiar e-mail.
 * Tudo parte do JS: sem ele o conteúdo fica parado e legível.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { SplitText } from 'gsap/SplitText';
import { construo } from '../../content/perfil';

gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin, SplitText);

const qs = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const qsa = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<T>(s));
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

qsa('[data-so-js]').forEach((e) => (e.hidden = false));

/* ---------- aviso (toast) ---------- */
const aviso = qs('[data-aviso]')!;
let avisoTimer = 0;
function avisar(txt: string) {
  aviso.textContent = txt;
  aviso.classList.add('visivel');
  clearTimeout(avisoTimer);
  avisoTimer = window.setTimeout(() => aviso.classList.remove('visivel'), 2600);
}

/* ---------- copiar e-mail ---------- */
const email = qs<HTMLAnchorElement>('[data-email]')!;
qs('[data-copiar]')?.addEventListener('click', async (e) => {
  const b = e.currentTarget as HTMLButtonElement;
  const txt = email.textContent?.trim() ?? '';
  let ok = false;
  try {
    await navigator.clipboard.writeText(txt);
    ok = true;
  } catch {
    const sel = getSelection();
    const r = document.createRange();
    r.selectNodeContents(email);
    sel?.removeAllRanges();
    sel?.addRange(r);
    ok = document.execCommand?.('copy') ?? false;
  }
  avisar(ok ? 'Copiado! Agora é só colar.' : 'Selecionei o e-mail: use Ctrl+C.');
  b.textContent = ok ? 'Copiado!' : 'Copiar';
  if (!reduzido()) gsap.fromTo(b, { rotation: -8, scale: 1.15 }, { rotation: 0, scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
  setTimeout(() => (b.textContent = 'Copiar'), 2400);
});

/* ---------- adesivos arrastáveis ---------- */
const palco = qs('.palco')!;
const adesivos = qsa<SVGElement>('[data-adesivo]');
adesivos.forEach((el) => {
  Draggable.create(el, {
    type: 'x,y',
    bounds: palco,
    inertia: !reduzido(),
    edgeResistance: 0.75,
    zIndexBoost: true,
    onPress() {
      if (!reduzido()) gsap.to(el, { scale: 1.15, rotation: '+=8', duration: 0.25, ease: 'back.out(3)' });
      el.style.filter = 'drop-shadow(10px 10px 0 #000)';
    },
    onRelease() {
      if (!reduzido()) gsap.to(el, { scale: 1, duration: 0.8, ease: 'elastic.out(1.1, 0.35)' });
      el.style.filter = '';
    },
  });
});

/* ---------- slot do "Eu construo A para B" ---------- */
const slotA = qs('[data-slot-a]')!;
const slotB = qs('[data-slot-b]')!;
const coresA = ['#3a86ff', '#ff7a00', '#ffd23f', '#ff5ca8', '#06d6a0'];
const coresB = ['#06d6a0', '#ffd23f', '#ff5ca8', '#3a86ff', '#ff7a00'];
let indice = 0;

function trocar(palavra: HTMLElement, txt: string, cor: string, atraso: number) {
  const slot = palavra.parentElement!;
  const tl = gsap.timeline({ delay: atraso });
  tl.to(palavra, { yPercent: -115, duration: 0.2, ease: 'back.in(2.5)' })
    .add(() => {
      const w0 = slot.offsetWidth;
      palavra.textContent = txt;
      const w1 = slot.offsetWidth;
      slot.style.backgroundColor = cor;
      gsap.fromTo(slot, { width: w0 }, { width: w1, duration: 0.45, ease: 'back.out(2.2)', clearProps: 'width' });
    })
    .fromTo(palavra, { yPercent: 115 }, { yPercent: 0, duration: 0.55, ease: 'back.out(2.6)' });
  return tl;
}

/* ---------- pausa global ---------- */
const botaoPausa = qs<HTMLButtonElement>('[data-pausa]')!;
const rotuloPausa = qs('[data-pausa-rotulo]')!;
let pausado = false;
const continuos: gsap.core.Animation[] = [];
botaoPausa.addEventListener('click', () => {
  pausado = !pausado;
  botaoPausa.setAttribute('aria-pressed', String(pausado));
  rotuloPausa.textContent = pausado ? 'Retomar animações' : 'Pausar animações';
  continuos.forEach((a) => (pausado ? a.pause() : a.resume()));
});

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: reduce)', () => {
  botaoPausa.hidden = true;
  return () => (botaoPausa.hidden = false);
});

mm.add('(prefers-reduced-motion: no-preference)', () => {
  continuos.length = 0;

  /* entrada do palco */
  const letras = qsa('[data-letras]').map((el) => new SplitText(el, { type: 'chars', charsClass: 'char', aria: 'none' }));
  const chars = letras.flatMap((s) => s.chars);
  const intro = gsap.timeline({ defaults: { ease: 'back.out(2)' } });
  intro
    .from('.oi', { scale: 0, rotation: -40, duration: 0.5 })
    .from(chars, { yPercent: 120, rotation: () => gsap.utils.random(-30, 30), opacity: 0, duration: 0.6, stagger: 0.035 }, '-=0.25')
    .from('.nome-l2', { scaleX: 0, transformOrigin: '0% 50%', duration: 0.5, ease: 'power4.out' }, 0.35)
    .from('.selo', { scale: 0, rotation: -200, duration: 0.9, ease: 'elastic.out(1, 0.5)' }, 0.6)
    .from('.construo-fixo, .slot', { y: 40, opacity: 0, stagger: 0.06, duration: 0.45 }, 0.8)
    .from('.meta li', { y: 30, rotation: () => gsap.utils.random(-15, 15), opacity: 0, stagger: 0.07, duration: 0.45 }, 1)
    .from('.acoes .botao', { scale: 0.4, opacity: 0, stagger: 0.08, duration: 0.5 }, 1.1)
    .from(adesivos, { scale: 0, rotation: () => gsap.utils.random(-90, 90), duration: 1, stagger: 0.12, ease: 'elastic.out(1, 0.45)' }, 1.1)
    .from('.adesivo-dica', { opacity: 0, x: 20, duration: 0.4 }, 1.8);

  /* selo girando (pausa fora da tela) */
  const giro = gsap.to('.selo-estrela', { rotation: 360, duration: 16, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
  continuos.push(giro);

  /* letreiro: loop infinito, acelera com a rolagem, desacelera no hover */
  const trilho = qs('[data-trilho]')!;
  const letreiro = qs('[data-letreiro]')!;
  const letr = gsap.to(trilho, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
  continuos.push(letr);
  let hover = false;
  letreiro.addEventListener('pointerenter', () => {
    hover = true;
    gsap.to(letr, { timeScale: 0, duration: 0.5, overwrite: true });
  });
  letreiro.addEventListener('pointerleave', () => {
    hover = false;
    gsap.to(letr, { timeScale: 1, duration: 0.5, overwrite: true });
  });
  const st = ScrollTrigger.create({
    trigger: letreiro,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (s) => (s.isActive && !pausado ? letr.resume() : letr.pause()),
    onUpdate: (s) => {
      if (hover) return;
      const v = gsap.utils.clamp(-6, 6, s.getVelocity() / 250);
      gsap.to(letr, { timeScale: v === 0 ? 1 : v, duration: 0.2, overwrite: true });
      gsap.to(letr, { timeScale: v < 0 ? -1 : 1, duration: 1.2, delay: 0.25, ease: 'power2.out' });
    },
  });
  ScrollTrigger.create({
    trigger: palco,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (s) => (s.isActive && !pausado ? giro.resume() : giro.pause()),
  });

  /* slot do construo */
  const ciclo = gsap.timeline({ repeat: -1, delay: 2.6 });
  construo.forEach((_, k) => {
    const prox = (k + 1) % construo.length;
    ciclo.add(() => {
      if (document.hidden) return;
      indice = prox;
      const [a, b] = construo[indice];
      trocar(slotA, a, coresA[indice % coresA.length], 0);
      trocar(slotB, b, coresB[indice % coresB.length], 0.12);
    }, k * 2.6);
  });
  ciclo.add(() => {}, construo.length * 2.6);
  continuos.push(ciclo);

  /* pop-ins na rolagem */
  qsa('.titulo').forEach((t) =>
    gsap.from(t, {
      x: -120,
      rotation: -6,
      opacity: 0,
      duration: 0.8,
      ease: 'back.out(1.8)',
      scrollTrigger: { trigger: t, start: 'top 88%', once: true },
    }),
  );
  qsa('[data-pop]').forEach((el) =>
    gsap.from(el, {
      y: 80,
      scale: 0.88,
      rotation: gsap.utils.random(-7, 7),
      opacity: 0,
      duration: 0.75,
      ease: 'back.out(1.7)',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    }),
  );
  qsa('.projeto').forEach((p) =>
    gsap.from(qsa('.tag', p), {
      scale: 0,
      rotation: () => gsap.utils.random(-40, 40),
      duration: 0.6,
      stagger: 0.05,
      ease: 'back.out(3)',
      scrollTrigger: { trigger: p, start: 'top 75%', once: true },
    }),
  );
  qsa('.bloco').forEach((b) =>
    gsap.from(qsa('li', b), {
      y: 20,
      opacity: 0,
      duration: 0.4,
      stagger: 0.04,
      ease: 'back.out(3)',
      scrollTrigger: { trigger: b, start: 'top 85%', once: true },
    }),
  );
  gsap.from('.stack-total strong', {
    scale: 0,
    rotation: 90,
    duration: 0.9,
    ease: 'elastic.out(1, 0.4)',
    scrollTrigger: { trigger: '.stack-total', start: 'top 90%', once: true },
  });

  if (pausado) continuos.forEach((a) => a.pause());

  return () => {
    st.kill();
    letras.forEach((s) => s.revert());
    continuos.length = 0;
  };
});
