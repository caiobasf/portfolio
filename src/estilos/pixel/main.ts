/**
 * Estilo "pixel": paisagem, herói, diálogo com máquina de escrever, filtros do
 * inventário, menu de contato com cursor, barra de XP e sons (mudos até a
 * pessoa ligar). Sem JS a página continua completa e legível.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { iniciarPaisagem } from './paisagem';
import { som } from './som';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(s: string, raiz: ParentNode = document) => raiz.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, raiz: ParentNode = document) =>
  Array.from(raiz.querySelectorAll<T>(s));
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───────── som ───────── */
const botaoSom = $<HTMLButtonElement>('.p-som');
if (botaoSom) {
  botaoSom.hidden = false;
  botaoSom.addEventListener('click', () => {
    botaoSom.setAttribute('aria-pressed', String(som.alternar()));
  });
}

/* ───────── barra de XP = progresso da leitura ───────── */
const xp = $('.p-barra-xp');
if (xp) {
  let pendente = false;
  const atualizar = () => {
    pendente = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    xp.style.setProperty('--p', `${max > 0 ? Math.min(100, (scrollY / max) * 100) : 0}%`);
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

/* ───────── olhos piscando (herói e retratos) ───────── */
setInterval(() => {
  if (document.hidden || reduzido()) return;
  const sprites = $$('.p-sprite').filter((s) => s.querySelector('.p-olho'));
  sprites.forEach((s) => $$<SVGRectElement>('.p-olho', s).forEach((o) => o.setAttribute('fill', '#ffcd75')));
  setTimeout(
    () => sprites.forEach((s) => $$<SVGRectElement>('.p-olho', s).forEach((o) => o.setAttribute('fill', '#1a1c2c'))),
    140,
  );
}, 3400);

/* ───────── diálogo com máquina de escrever ───────── */
const dialogo = $('.p-dialogo');
const dlg = dialogo ? iniciarDialogo(dialogo) : null;

function iniciarDialogo(caixa: HTMLElement) {
  const falas = $$('.p-fala', caixa);
  const botao = $<HTMLButtonElement>('.p-avancar', caixa)!;
  const rotulo = $('.p-avancar-t', caixa)!;
  const pagina = $('.p-pagina', caixa)!;
  if (!falas.length || !botao) return null;

  caixa.classList.add('js');
  botao.hidden = false;
  let atual = -1;
  let timer = 0;
  let digitando = false;
  let iniciado = false;

  function preparar(el: HTMLElement) {
    if (el.dataset.pronta) return;
    const texto = el.textContent ?? '';
    el.textContent = '';
    const visual = document.createElement('span');
    visual.className = 'p-visual';
    visual.textContent = texto;
    const letras = document.createElement('span');
    letras.setAttribute('aria-hidden', 'true');
    for (const ch of texto) {
      const c = document.createElement('span');
      c.className = 'p-c';
      c.textContent = ch;
      letras.append(c);
    }
    el.append(visual, letras);
    el.dataset.pronta = '1';
  }

  function terminar() {
    clearInterval(timer);
    digitando = false;
    if (atual >= 0) $$('.p-c', falas[atual]).forEach((c) => c.classList.add('v'));
    const ultima = atual === falas.length - 1;
    botao.classList.toggle('fim', ultima);
    rotulo.textContent = ultima ? 'Recomeçar' : 'Avançar';
  }

  function mostrar(i: number) {
    clearInterval(timer);
    atual = i;
    falas.forEach((f, j) => f.classList.toggle('atual', j === i));
    const el = falas[i];
    preparar(el);
    pagina.textContent = `${i + 1}/${falas.length}`;
    const letras = $$('.p-c', el);
    letras.forEach((c) => c.classList.remove('v'));
    botao.classList.remove('fim');
    rotulo.textContent = 'Pular';
    if (reduzido()) return terminar();
    digitando = true;
    let k = 0;
    timer = window.setInterval(() => {
      const c = letras[k++];
      if (!c) return terminar();
      c.classList.add('v');
      if (k % 3 === 0 && c.textContent !== ' ') som.digitar();
    }, 26);
  }

  function avancar() {
    iniciado = true;
    if (digitando) return terminar();
    som.mover();
    mostrar((atual + 1) % falas.length);
  }

  // estado inicial: primeira fala inteira visível (sem animação até entrar na tela)
  mostrar(0);
  terminar();
  rotulo.textContent = 'Avançar';

  botao.addEventListener('click', (e) => {
    e.stopPropagation();
    avancar();
  });
  caixa.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    if (getSelection()?.toString()) return;
    avancar();
  });

  const comecar = () => {
    if (iniciado) return;
    iniciado = true;
    mostrar(0);
  };
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) {
        comecar();
        io.disconnect();
      }
    },
    { threshold: 0.6 },
  );
  io.observe(caixa);

  return { comecar, botao };
}

/* ───────── PRESSIONE START ───────── */
const start = $<HTMLAnchorElement>('.p-start');
start?.addEventListener('click', (e) => {
  const alvo = $('#sobre');
  if (!alvo) return;
  e.preventDefault();
  som.start();
  alvo.scrollIntoView({ behavior: reduzido() ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', '#sobre');
  dlg?.botao.focus({ preventScroll: true });
});

/* ───────── inventário: filtros e dicas ───────── */
const abas = $('.p-abas');
if (abas) {
  abas.hidden = false;
  const bolsas = $$('.p-bolsa');
  abas.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.p-aba');
    if (!b) return;
    som.mover();
    const g = b.dataset.grupo;
    $$('.p-aba', abas).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    bolsas.forEach((s) => (s.hidden = g !== '*' && s.dataset.grupo !== g));
    if (!reduzido()) {
      gsap.from(
        bolsas.filter((s) => !s.hidden).flatMap((s) => $$('.p-item', s)),
        { autoAlpha: 0, y: 8, duration: 0.24, ease: 'steps(3)', stagger: 0.02 },
      );
    }
  });
}
function posicionarDica(item: HTMLElement) {
  const dica = $('.p-dica', item);
  if (!dica) return;
  const r = item.getBoundingClientRect();
  const largura = 232;
  const cx = r.left + r.width / 2;
  const esq = cx - largura / 2;
  const dir = cx + largura / 2;
  const limite = document.documentElement.clientWidth - 8;
  const dx = esq < 8 ? 8 - esq : dir > limite ? limite - dir : 0;
  dica.style.setProperty('--dx', `${Math.round(dx)}px`);
}
$$('.p-item').forEach((item) => {
  item.addEventListener('pointerenter', () => {
    posicionarDica(item);
    som.mover();
  });
  item.addEventListener('focus', () => posicionarDica(item));
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const foco = document.activeElement as HTMLElement | null;
  if (foco?.classList.contains('p-item')) foco.blur();
});

/* ───────── menu de contato com cursor ───────── */
const opcoes = $$<HTMLAnchorElement>('.p-opcao');
const infos = $$('.p-info');
function ativar(i: number, focar = false) {
  opcoes.forEach((o, j) => o.classList.toggle('ativa', j === i));
  infos.forEach((o, j) => o.classList.toggle('ativa', j === i));
  if (focar) opcoes[i]?.focus();
}
opcoes.forEach((o, i) => {
  o.addEventListener('pointerenter', () => {
    if (!o.classList.contains('ativa')) som.mover();
    ativar(i);
  });
  o.addEventListener('focus', () => ativar(i));
  o.addEventListener('click', () => som.confirmar());
  o.addEventListener('keydown', (e) => {
    const n = opcoes.length;
    let alvo = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') alvo = (i + 1) % n;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') alvo = (i - 1 + n) % n;
    else if (e.key === 'Home') alvo = 0;
    else if (e.key === 'End') alvo = n - 1;
    if (alvo < 0) return;
    e.preventDefault();
    som.mover();
    ativar(alvo, true);
  });
});

/* ───────── movimento ───────── */
const ceu = $<HTMLCanvasElement>('.p-ceu');
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: reduce)', () => {
  const parar = ceu ? iniciarPaisagem(ceu, true) : () => {};
  return () => parar();
});

mm.add('(prefers-reduced-motion: no-preference)', () => {
  const parar = ceu ? iniciarPaisagem(ceu, false) : () => {};

  // abertura da tela de título: o logo desce em quadros, o resto "liga"
  const tl = gsap.timeline({ delay: 0.15 });
  tl.from('.p-logo-l', { yPercent: -260, autoAlpha: 0, duration: 0.9, ease: 'steps(9)', stagger: 0.18 });
  tl.from('.p-pre, .p-faixa, .p-local, .p-start', { autoAlpha: 0, duration: 0.01, stagger: 0.22 }, '-=0.1');
  tl.from('.p-heroi', { y: -40, autoAlpha: 0, duration: 0.5, ease: 'steps(5)' }, 0.4);

  // herói respirando (dois quadros)
  const bob = (alvo: string, y: number, d: number) =>
    gsap.to(alvo, { y, duration: d, ease: 'steps(1)', repeat: -1, yoyo: true });
  bob('.p-heroi-sprite', -6, 0.45);
  bob('.p-ficha-sprite', -7, 0.5);
  bob('.p-aqui-sprite', -2, 0.4);

  // janelas abrem como num RPG: estica na horizontal, depois na vertical
  $$('.p-dialogo, .p-ficha, .p-missao, .p-inventario, .p-fase-card, .p-menu-janela, .p-menu-info').forEach((el) => {
    gsap
      // o gatilho é o pai: o próprio elemento começa achatado e mediria errado
      .timeline({ scrollTrigger: { trigger: el.parentElement ?? el, start: 'top 80%', once: true } })
      .fromTo(el, { scaleX: 0.08, scaleY: 0.04 }, { scaleX: 1, scaleY: 0.04, duration: 0.18, ease: 'steps(3)' })
      .to(el, { scaleY: 1, duration: 0.2, ease: 'steps(4)', clearProps: 'transform' });
  });

  // títulos de seção entram em quadros
  $$('.p-cab').forEach((cab) => {
    gsap.from(cab.children, {
      x: -32,
      autoAlpha: 0,
      duration: 0.4,
      ease: 'steps(4)',
      stagger: 0.12,
      scrollTrigger: { trigger: cab, start: 'top 90%', once: true },
    });
  });

  // nós do mapa acendem em sequência
  gsap.from('.p-no', {
    scale: 0,
    duration: 0.3,
    ease: 'steps(3)',
    stagger: 0.25,
    scrollTrigger: { trigger: '.p-mapa', start: 'top 80%', once: true },
  });

  return () => parar();
});
