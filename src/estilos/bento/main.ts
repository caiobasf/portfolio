/**
 * Interações do estilo Bento: brilho que segue o cursor, inclinação 3D,
 * "eu construo" com troca suave, contagem, copiar e-mail, rolagem suave (Lenis),
 * revelações com ScrollTrigger e pausa dos loops fora da tela.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { construo, contato } from '../../content/perfil';

gsap.registerPlugin(ScrollTrigger);

const $$ = <T extends Element = HTMLElement>(sel: string, raiz: ParentNode = document) =>
  Array.from(raiz.querySelectorAll<T>(sel) as NodeListOf<T>);

/* ---------- brilho que segue o cursor (um listener para todas as grades) ---------- */
function brilho() {
  const cartoes = $$('[data-spot] .b-card');
  let x = 0;
  let y = 0;
  let pendente = false;
  const atualiza = () => {
    pendente = false;
    for (const c of cartoes) {
      const r = c.getBoundingClientRect();
      if (r.bottom < -400 || r.top > innerHeight + 400) continue;
      c.style.setProperty('--mx', `${x - r.left}px`);
      c.style.setProperty('--my', `${y - r.top}px`);
    }
  };
  document.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      x = e.clientX;
      y = e.clientY;
      if (!pendente) {
        pendente = true;
        requestAnimationFrame(atualiza);
      }
    },
    { passive: true },
  );
}

/* ---------- copiar e-mail + toast ---------- */
function copiar() {
  const toast = document.querySelector<HTMLElement>('.b-toast');
  let tempo = 0;
  const mostra = (msg: string, ok = true) => {
    if (!toast) return;
    toast.innerHTML = '';
    if (ok) {
      const ic = document.createElement('span');
      ic.className = 'b-toast__icone';
      ic.setAttribute('aria-hidden', 'true');
      ic.innerHTML =
        '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      toast.append(ic);
    }
    toast.append(msg);
    toast.classList.add('is-visivel');
    clearTimeout(tempo);
    tempo = window.setTimeout(() => toast.classList.remove('is-visivel'), 2600);
  };
  const fallback = () => {
    const t = document.createElement('textarea');
    t.value = contato.email;
    t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.append(t);
    t.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    t.remove();
    return ok;
  };
  for (const b of $$<HTMLButtonElement>('[data-copiar]')) {
    b.hidden = false;
    b.addEventListener('click', async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(contato.email);
        ok = true;
      } catch {
        ok = fallback();
      }
      if (ok) mostra(`E-mail copiado: ${contato.email}`);
      else mostra(`Não deu para copiar. O e-mail é ${contato.email}`, false);
    });
  }
}

/* ---------- "Eu construo [A] para [B]" ---------- */
function construoCiclo(animar: boolean) {
  const a = document.querySelector<HTMLElement>('[data-troca="a"]');
  const b = document.querySelector<HTMLElement>('[data-troca="b"]');
  const card = document.querySelector<HTMLElement>('.b-construo');
  const marcas = $$('.b-marcador');
  if (!a || !b || !card) return () => {};
  const pa = a.querySelector<HTMLElement>('.b-troca__palavra')!;
  const pb = b.querySelector<HTMLElement>('.b-troca__palavra')!;
  let i = 0;
  let pausado = false;
  let visivel = true;
  card.addEventListener('pointerenter', () => (pausado = true));
  card.addEventListener('pointerleave', () => (pausado = false));
  const io = new IntersectionObserver(([e]) => (visivel = e.isIntersecting));
  io.observe(card);

  const troca = (caixa: HTMLElement, palavra: HTMLElement, novo: string, atraso: number) => {
    const largura0 = caixa.offsetWidth;
    const tl = gsap.timeline({ delay: atraso });
    tl.to(palavra, {
      yPercent: -40,
      opacity: 0,
      filter: 'blur(8px)',
      duration: 0.38,
      ease: 'power2.in',
    });
    tl.add(() => {
      palavra.textContent = novo;
      caixa.style.width = 'auto';
      const largura1 = caixa.offsetWidth;
      gsap.fromTo(
        caixa,
        { width: largura0 },
        { width: largura1, duration: 0.5, ease: 'power3.inOut', onComplete: () => (caixa.style.width = '') },
      );
    });
    tl.fromTo(
      palavra,
      { yPercent: 40, opacity: 0, filter: 'blur(8px)' },
      { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.55, ease: 'power3.out' },
    );
  };

  const passo = () => {
    if (pausado || !visivel || document.hidden) return;
    i = (i + 1) % construo.length;
    const [na, nb] = construo[i];
    if (animar) {
      troca(a, pa, na, 0);
      troca(b, pb, nb, 0.08);
    } else {
      pa.textContent = na;
      pb.textContent = nb;
    }
    marcas.forEach((m, k) => m.classList.toggle('is-ativo', k === i));
  };
  const id = window.setInterval(passo, 2800);
  return () => {
    clearInterval(id);
    io.disconnect();
  };
}

/* ---------- pausa os loops de CSS quando o hero sai da tela ---------- */
function pausaForaDaTela() {
  const hero = document.querySelector('.b-hero');
  if (!hero) return;
  const html = document.documentElement;
  new IntersectionObserver(([e]) => html.classList.toggle('b-pausado', !e.isIntersecting), {
    rootMargin: '200px 0px',
  }).observe(hero);
}

/* ---------- navegação: seção atual ---------- */
function navAtual() {
  const links = $$<HTMLAnchorElement>('[data-nav]');
  for (const l of links) {
    const alvo = document.getElementById(l.dataset.nav!);
    if (!alvo) continue;
    ScrollTrigger.create({
      trigger: alvo,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (st) => {
        if (st.isActive) l.setAttribute('aria-current', 'location');
        else l.removeAttribute('aria-current');
      },
    });
  }
}

export function iniciar() {
  brilho();
  copiar();
  pausaForaDaTela();
  navAtual();

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: reduce)', () => {
    // sem animação: o ciclo troca o texto sem transição (só enquanto visível)
    return construoCiclo(false);
  });

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    /* Lenis */
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    // âncoras internas: posição calculada aqui (respeita scroll-margin do alvo)
    const ancora = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const hash = a.getAttribute('href')!;
      const alvo = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      if (!alvo || a.classList.contains('b-pular')) return;
      e.preventDefault();
      const margem = parseFloat(getComputedStyle(alvo).scrollMarginTop) || 0;
      const y = alvo.getBoundingClientRect().top + window.scrollY - margem - 96;
      lenis.scrollTo(Math.max(0, y), { duration: 1.2 });
      history.pushState(null, '', hash);
    };
    document.addEventListener('click', ancora);
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // o link "pular" e o foco precisam funcionar normalmente

    /* entrada do hero */
    const hero = $$('[data-hero]');
    gsap.from(hero, {
      opacity: 0,
      y: 36,
      scale: 0.97,
      filter: 'blur(12px)',
      duration: 1.1,
      ease: 'power3.out',
      stagger: { each: 0.07, from: 'start' },
      clearProps: 'filter,transform',
    });
    gsap.from('.b-topo', { y: -24, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.15 });
    gsap.to('.b-h1 .b-grad-texto', {
      backgroundPosition: '100% 50%',
      duration: 6,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 1,
    });

    /* revelações ao rolar */
    const revela = $$('[data-revela]');
    gsap.set(revela, { opacity: 0, y: 40, filter: 'blur(10px)' });
    ScrollTrigger.batch(revela, {
      start: 'top 90%',
      once: true,
      onEnter: (lote) =>
        gsap.to(lote, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out',
          stagger: Math.min(0.08, 0.32 / lote.length),
          overwrite: true,
          clearProps: 'filter,transform',
        }),
    });

    /* contagem */
    for (const el of $$('[data-conta]')) {
      const fim = Number(el.dataset.conta);
      const obj = { v: 0 };
      el.textContent = '0';
      gsap.to(obj, {
        v: fim,
        duration: 1.8,
        ease: 'power3.out',
        delay: 0.6,
        scrollTrigger: { trigger: el, start: 'top 95%', once: true },
        onUpdate: () => (el.textContent = String(Math.round(obj.v))),
      });
    }

    /* barras e linha do painel */
    const painel = document.querySelector('.b-painel');
    if (painel) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: painel, start: 'top 80%', once: true } });
      tl.from('.b-painel__barra', {
        scaleY: 0,
        transformOrigin: '50% 100%',
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.04,
      });
      const linha = painel.querySelector<SVGPathElement>('.b-painel__linha');
      if (linha) {
        const L = linha.getTotalLength();
        tl.fromTo(linha, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.3);
      }
      tl.from('.b-painel__rosca', { strokeDashoffset: 188.5, duration: 1.4, ease: 'power3.out' }, 0.2);
      tl.from('.b-painel__prog', { scaleX: 0, transformOrigin: '0 50%', duration: 1.2, ease: 'power3.out' }, 0.4);
    }

    /* inclinação 3D só com mouse */
    const limpa: (() => void)[] = [];
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      for (const card of $$('[data-tilt]')) {
        gsap.set(card, { transformPerspective: 1200 });
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
        const move = (e: PointerEvent) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          rx(-py * 5);
          ry(px * 6);
        };
        const sai = () => {
          rx(0);
          ry(0);
        };
        card.addEventListener('pointermove', move);
        card.addEventListener('pointerleave', sai);
        limpa.push(() => {
          card.removeEventListener('pointermove', move);
          card.removeEventListener('pointerleave', sai);
          gsap.set(card, { clearProps: 'transform' });
        });
      }
    }

    const paraCiclo = construoCiclo(true);

    return () => {
      paraCiclo();
      limpa.forEach((f) => f());
      gsap.ticker.remove(tick);
      document.removeEventListener('click', ancora);
      lenis.destroy();
    };
  });
}
