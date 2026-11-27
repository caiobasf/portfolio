/**
 * Interações do estilo cyberpunk. Tudo aqui é acréscimo: sem JS a página já
 * está completa. Movimento só com prefers-reduced-motion: no-preference.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { construo } from '../../content/perfil';
import { iniciarCidade } from './cidade';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<T>(s));

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$/<>[]';

function relogio() {
  const hora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const data = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horas = $$('.js-relogio');
  const datas = $$('.js-data');
  const tick = () => {
    const agora = new Date();
    const h = hora.format(agora);
    const d = data.format(agora).replace(/\//g, '.');
    horas.forEach((el) => (el.textContent = h));
    datas.forEach((el) => (el.textContent = d));
  };
  tick();
  setInterval(tick, 1000);
}

function cursor() {
  const el = $('.js-cursor');
  const quadro = $('.js-quadro');
  if (!el) return;
  const p4 = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, '0');
  window.addEventListener(
    'pointermove',
    (e) => {
      el.textContent = `X ${p4(e.clientX)} · Y ${p4(e.clientY)}`;
    },
    { passive: true },
  );
  if (quadro) {
    let n = 0;
    setInterval(() => {
      if (document.hidden) return;
      n = (n + 7) % 1_000_000;
      quadro.textContent = String(n).padStart(6, '0');
    }, 140);
  }
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
  const links = $$<HTMLAnchorElement>('.cp-nav a[data-nav]');
  const mapa = new Map(links.map((a) => [a.dataset.nav!, a]));
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.removeAttribute('aria-current'));
        mapa.get(e.target.id)?.setAttribute('aria-current', 'location');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  mapa.forEach((_, id) => {
    const s = document.getElementById(id);
    if (s) io.observe(s);
  });
}

function copiar() {
  const btn = $<HTMLButtonElement>('.js-copiar');
  const aviso = $('.cp-console__aviso');
  const mail = $<HTMLAnchorElement>('a[href^="mailto:"]');
  if (!btn || !mail || !navigator.clipboard) return;
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mail.href.replace('mailto:', ''));
      if (aviso) aviso.textContent = '> e-mail copiado para a área de transferência';
    } catch {
      if (aviso) aviso.textContent = '> não foi possível copiar; use o botão de e-mail';
    }
  });
}

/** rajadas de glitch: liga a classe por ~0,5 s em intervalos aleatórios */
function glitchEmRajadas(els: HTMLElement[]) {
  let timer = 0;
  const disparar = (el: HTMLElement) => {
    el.classList.remove('is-glitch');
    void el.offsetWidth;
    el.classList.add('is-glitch');
    window.setTimeout(() => el.classList.remove('is-glitch'), 520);
  };
  const agendar = () => {
    timer = window.setTimeout(
      () => {
        if (!document.hidden) {
          const alvo = els[Math.floor(Math.random() * els.length)];
          disparar(alvo);
          if (Math.random() < 0.4) window.setTimeout(() => disparar(els[(els.indexOf(alvo) + 1) % els.length]), 140);
        }
        agendar();
      },
      2600 + Math.random() * 3800,
    );
  };
  agendar();
  return { parar: () => clearTimeout(timer), disparar };
}

export function iniciar() {
  relogio();
  cursor();
  progresso();
  navAtiva();
  copiar();

  const canvas = $<HTMLCanvasElement>('.js-cidade');
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: reduce)', () => {
    const parar = canvas ? iniciarCidade(canvas, { animar: false }) : () => {};
    return () => parar();
  });

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const pararCidade = canvas ? iniciarCidade(canvas, { animar: true }) : () => {};

    // ---- entrada do hero ----
    const nomes = $$('.cp-nome .js-glitch');
    const cargo = $('.js-cargo');
    const glitch = glitchEmRajadas(nomes);
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.cp-canto', { scale: 2.2, opacity: 0, duration: 0.5, stagger: 0.04 })
      .from('.cp-hud__ln', { opacity: 0, duration: 0.4, stagger: 0.08 }, '<0.2')
      .from('.cp-hero__pre', { opacity: 0, x: -20, duration: 0.5 }, '<')
      .from(
        nomes,
        {
          opacity: 0,
          xPercent: -6,
          skewX: -18,
          duration: 0.55,
          stagger: 0.12,
          onStart: () => nomes.forEach((n, i) => setTimeout(() => glitch.disparar(n), 120 + i * 140)),
        },
        '<0.1',
      )
      .add(() => {
        if (cargo)
          gsap.to(cargo, {
            duration: 1,
            scrambleText: { text: cargo.textContent ?? '', chars: CHARS, speed: 0.6, revealDelay: 0.15 },
          });
      }, '-=0.2')
      .from('.cp-hero__construo, .cp-hero__chips li, .cp-hero__acoes > *', {
        opacity: 0,
        y: 16,
        duration: 0.45,
        stagger: 0.05,
      }, '-=0.1')
      .from('.cp-telemetria', { opacity: 0, x: 30, duration: 0.6 }, '<0.1')
      .fromTo('.cp-hud__mira', { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.6 }, '<');

    // ---- frase "Eu construo A para B" decifrando ----
    const a = $('.js-construo-a');
    const b = $('.js-construo-b');
    let i = 0;
    const ciclo = window.setInterval(() => {
      if (document.hidden || !a || !b) return;
      i = (i + 1) % construo.length;
      const [pa, pb] = construo[i];
      gsap.to(a, { duration: 0.9, scrambleText: { text: pa, chars: CHARS, speed: 0.8 } });
      gsap.to(b, { duration: 0.9, delay: 0.15, scrambleText: { text: pb, chars: CHARS, speed: 0.8 } });
    }, 3400);

    // ---- glitch ao passar nos contratos ----
    const hovers = $$('.js-contrato').map((card) => {
      const tit = $('.js-glitch-hover', card);
      const fn = () => tit && glitch.disparar(tit);
      card.addEventListener('pointerenter', fn);
      return () => card.removeEventListener('pointerenter', fn);
    });

    // ---- títulos de seção decifrando + linha que se desenha ----
    $$('.cp-cab').forEach((cab) => {
      const tit = $('.js-decode', cab);
      const linha = $('.js-linha', cab);
      const idx = $('.cp-cab__idx', cab);
      const t = gsap.timeline({ scrollTrigger: { trigger: cab, start: 'top 85%', once: true } });
      if (idx) t.from(idx, { opacity: 0, x: -14, duration: 0.4 });
      if (tit)
        t.to(
          tit,
          { duration: 1, scrambleText: { text: tit.textContent ?? '', chars: CHARS, speed: 0.7, revealDelay: 0.15 } },
          '<',
        );
      if (linha) t.from(linha, { scaleX: 0, duration: 1.1, ease: 'power2.inOut' }, '<0.1');
    });

    // ---- painéis entram "limpando" da esquerda ----
    const limpa = (alvos: Element[] | string, trigger?: Element, stagger = 0.12) =>
      gsap.from(alvos, {
        clipPath: 'inset(0 100% 0 0)',
        opacity: 0.2,
        duration: 0.9,
        ease: 'power3.inOut',
        stagger,
        clearProps: 'clipPath,opacity',
        scrollTrigger: { trigger: trigger ?? (alvos as Element[])[0], start: 'top 85%', once: true },
      });

    limpa($$('#perfil .js-painel'), $('.cp-dossie')!, 0.1);
    limpa($$('.js-contrato'), $('.cp-contratos')!, 0.18);

    gsap.from('.js-modulo', {
      opacity: 0,
      y: 30,
      scale: 0.96,
      duration: 0.6,
      ease: 'power2.out',
      stagger: { each: 0.08, grid: 'auto', from: 'start' },
      scrollTrigger: { trigger: '.cp-implantes', start: 'top 82%', once: true },
    });

    const trilho = $('.js-trilho');
    if (trilho)
      gsap.from(trilho, {
        scaleY: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.cp-log', start: 'top 75%', end: 'bottom 70%', scrub: 0.6 },
      });
    $$('.js-log').forEach((item) => {
      gsap.from(item.children, {
        opacity: 0,
        x: -24,
        duration: 0.55,
        stagger: 0.07,
        ease: 'power2.out',
        scrollTrigger: { trigger: item, start: 'top 82%', once: true },
      });
    });

    // ---- console: linhas digitadas ----
    const teclas = $$('.js-tecla');
    const textos = teclas.map((el) => el.textContent ?? '');
    const console_ = gsap.timeline({ scrollTrigger: { trigger: '.cp-console', start: 'top 80%', once: true } });
    console_.from('.cp-console', { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'power3.inOut', clearProps: 'clipPath' });
    console_.from('.cp-canal', { opacity: 0, y: 24, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, 0.35);
    let pos = 0.5;
    teclas.forEach((el, k) => {
      const dur = Math.min(0.7, Math.max(0.3, textos[k].length * 0.018));
      console_.fromTo(
        el,
        { scrambleText: { text: ' ', chars: ' ' } },
        { duration: dur, scrambleText: { text: textos[k], chars: '_▮', speed: 1 }, ease: 'none' },
        pos,
      );
      pos += dur + 0.05;
    });

    return () => {
      pararCidade();
      glitch.parar();
      clearInterval(ciclo);
      hovers.forEach((f) => f());
    };
  });
}
