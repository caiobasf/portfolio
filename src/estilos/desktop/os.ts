/**
 * CaioOS 98: gerenciador de janelas, boot, menu Iniciar, relógio e programas.
 * Só roda com JS; sem ele a página é uma pilha de janelas estáticas.
 */
import { gsap } from 'gsap';
import { construo } from '../../content/perfil';

const html = document.documentElement;
const qs = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const qsa = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<T>(s));

const mqReduzido = matchMedia('(prefers-reduced-motion: reduce)');
const mqCelular = matchMedia('(max-width: 699px)');
const mqToque = matchMedia('(pointer: coarse)');
const reduzido = () => mqReduzido.matches;
const celular = () => mqCelular.matches;

html.classList.add('os');

const mesa = qs('#janelas')!;
const barraTarefas = qs('[data-tarefas]')!;
const janelas = qsa('[data-janela]');
const porId = new Map(janelas.map((j) => [j.dataset.janela!, j]));

interface Estado {
  posicionada: boolean;
  botao: HTMLButtonElement | null;
  origem: HTMLElement | null;
}
const estados = new Map<HTMLElement, Estado>(janelas.map((j) => [j, { posicionada: false, botao: null, origem: null }]));
let zTopo = 10;
let cascata = 0;

/* ---------- liga os controles que só funcionam com JS ---------- */
qsa<HTMLButtonElement>('.janela .tb[disabled]').forEach((b) => (b.disabled = false));
qsa('[data-so-js]').forEach((e) => (e.hidden = false));
janelas.forEach((j) => {
  j.setAttribute('role', 'dialog');
  j.setAttribute('aria-modal', 'false');
});

/* ---------- utilidades ---------- */
const area = () => mesa.getBoundingClientRect();
const aberta = (j: HTMLElement) => j.dataset.estado === 'aberta';
const iconeDe = (j: HTMLElement) => qs('.titulo-icone', j)?.innerHTML ?? '';

function zoom(de: DOMRect | null, para: DOMRect | null): Promise<void> {
  if (!de || !para || reduzido()) return Promise.resolve();
  const r = document.createElement('div');
  r.className = 'zoom-retangulo';
  document.body.append(r);
  return new Promise((ok) => {
    gsap.fromTo(
      r,
      { left: de.left, top: de.top, width: de.width, height: de.height },
      {
        left: para.left,
        top: para.top,
        width: para.width,
        height: para.height,
        duration: 0.22,
        ease: 'steps(7)',
        onComplete: () => {
          r.remove();
          ok();
        },
      },
    );
  });
}

function posicionar(j: HTMLElement) {
  const st = estados.get(j)!;
  if (st.posicionada) return;
  const a = area();
  const w = Math.min(Number(j.dataset.largura) || 600, a.width - 24);
  const auto = j.dataset.altura === '0';
  j.style.maxHeight = `${Math.round(a.height - 16)}px`;
  if (auto) j.style.height = 'auto';
  const h = auto ? Math.min(j.offsetHeight, a.height - 24) : Math.min(Number(j.dataset.altura) || 480, a.height - 24);
  let x: number;
  let y: number;
  if (j.dataset.janela === 'bemvindo') {
    x = (a.width - w) / 2;
    y = Math.max(12, (a.height - h) / 2 - 10);
  } else {
    const base = Math.min(150, Math.max(12, a.width - w - 12));
    x = base + (cascata % 6) * 30;
    y = 24 + (cascata % 6) * 30;
    cascata++;
    x = Math.min(x, a.width - w - 12);
    y = Math.min(y, a.height - h - 12);
  }
  Object.assign(j.style, {
    left: `${Math.round(Math.max(0, x))}px`,
    top: `${Math.round(Math.max(0, y))}px`,
    width: `${Math.round(w)}px`,
    height: auto ? 'auto' : `${Math.round(h)}px`,
  });
  j.setAttribute('data-posicionada', '');
  st.posicionada = true;
}

function topo(): HTMLElement | null {
  let melhor: HTMLElement | null = null;
  let z = -1;
  for (const j of janelas) {
    if (!aberta(j)) continue;
    const zi = Number(j.style.zIndex || 0);
    if (zi > z) {
      z = zi;
      melhor = j;
    }
  }
  return melhor;
}

function atualizarTarefas() {
  const t = topo();
  for (const j of janelas) {
    const st = estados.get(j)!;
    const ativa = j === t && aberta(j);
    if (aberta(j) && !ativa) j.setAttribute('data-inativa', '');
    else j.removeAttribute('data-inativa');
    st.botao?.setAttribute('aria-pressed', String(ativa));
  }
}

function ativar(j: HTMLElement, focar = false) {
  j.style.zIndex = String(++zTopo);
  atualizarTarefas();
  if (focar) j.focus({ preventScroll: true });
}

function criarBotao(j: HTMLElement) {
  const st = estados.get(j)!;
  if (st.botao) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'tarefa';
  b.setAttribute('aria-pressed', 'false');
  const nome = j.dataset.curto ?? '';
  b.innerHTML = `${iconeDe(j)}<span></span>`;
  b.querySelector('span')!.textContent = nome;
  b.title = nome;
  b.addEventListener('click', () => {
    if (j.dataset.estado === 'minimizada') restaurar(j);
    else if (j === topo()) minimizar(j);
    else ativar(j, true);
  });
  barraTarefas.append(b);
  st.botao = b;
  if (!reduzido()) gsap.from(b, { width: 0, minWidth: 0, opacity: 0, duration: 0.18, ease: 'steps(4)', clearProps: 'all' });
}

export async function abrir(id: string, origem: HTMLElement | null = null) {
  const j = porId.get(id);
  if (!j) return;
  const st = estados.get(j)!;
  if (aberta(j)) {
    ativar(j, true);
    if (!reduzido()) gsap.fromTo(j, { x: -3 }, { x: 0, duration: 0.25, ease: 'steps(5)', clearProps: 'x' });
    return;
  }
  if (j.dataset.estado === 'minimizada') return restaurar(j);
  if (origem) st.origem = origem;
  posicionar(j);
  j.dataset.estado = 'aberta';
  j.style.visibility = 'hidden';
  ativar(j);
  criarBotao(j);
  const alvo = j.getBoundingClientRect();
  const de = origem?.getBoundingClientRect() ?? new DOMRect(alvo.left + alvo.width / 2, alvo.top + alvo.height / 2, 0, 0);
  await zoom(de, alvo);
  j.style.visibility = '';
  ativar(j, true);
}

async function restaurar(j: HTMLElement) {
  const st = estados.get(j)!;
  j.dataset.estado = 'aberta';
  j.style.visibility = 'hidden';
  const alvo = j.getBoundingClientRect();
  await zoom(st.botao?.getBoundingClientRect() ?? null, alvo);
  j.style.visibility = '';
  ativar(j, true);
}

async function minimizar(j: HTMLElement) {
  const st = estados.get(j)!;
  const de = j.getBoundingClientRect();
  j.dataset.estado = 'minimizada';
  atualizarTarefas();
  await zoom(de, st.botao?.getBoundingClientRect() ?? null);
  const t = topo();
  if (t) ativar(t);
  st.botao?.focus();
}

async function fechar(j: HTMLElement) {
  const st = estados.get(j)!;
  const de = j.getBoundingClientRect();
  j.dataset.estado = 'fechada';
  j.removeAttribute('data-max');
  atualizarMax(j);
  st.botao?.remove();
  st.botao = null;
  atualizarTarefas();
  const origem = st.origem && document.contains(st.origem) && st.origem.offsetParent ? st.origem : null;
  await zoom(de, origem?.getBoundingClientRect() ?? new DOMRect(de.left + de.width / 2, de.top + de.height / 2, 0, 0));
  const t = topo();
  if (origem) origem.focus({ preventScroll: true });
  else if (t) ativar(t, true);
  else qs<HTMLElement>('.icone')?.focus();
  if (t && origem) ativar(t);
}

function atualizarMax(j: HTMLElement) {
  const b = qs('[data-acao="maximizar"]', j);
  if (b) b.setAttribute('aria-label', `${j.hasAttribute('data-max') ? 'Restaurar' : 'Maximizar'} ${j.dataset.curto}`);
}

async function alternarMax(j: HTMLElement) {
  if (j.dataset.variante === 'dialogo' || celular()) return;
  const de = j.getBoundingClientRect();
  j.toggleAttribute('data-max');
  atualizarMax(j);
  const para = j.getBoundingClientRect();
  j.style.visibility = 'hidden';
  await zoom(de, para);
  j.style.visibility = '';
  ativar(j);
}

/* ---------- eventos das janelas ---------- */
for (const j of janelas) {
  j.addEventListener('pointerdown', () => {
    if (j !== topo()) ativar(j);
  });
  j.addEventListener('focusin', () => {
    if (j !== topo()) ativar(j);
  });
  j.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-acao]');
    if (!b || b.closest('[data-janela]') !== j) return;
    const acao = b.dataset.acao;
    if (acao === 'fechar' || acao === 'fechar-janela') fechar(j);
    else if (acao === 'minimizar') minimizar(j);
    else if (acao === 'maximizar') alternarMax(j);
  });

  const barra = qs('.titulo-barra', j)!;
  barra.addEventListener('dblclick', (e) => {
    if ((e.target as Element).closest('button')) return;
    alternarMax(j);
  });
  barra.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || (e.target as Element).closest('button')) return;
    if (celular() || j.hasAttribute('data-max')) return;
    e.preventDefault();
    const a = area();
    const x0 = e.clientX;
    const y0 = e.clientY;
    const l0 = j.offsetLeft;
    const t0 = j.offsetTop;
    const w = j.offsetWidth;
    barra.setPointerCapture(e.pointerId);
    j.classList.add('arrastando');
    const mover = (ev: PointerEvent) => {
      const l = Math.min(Math.max(l0 + ev.clientX - x0, -w + 90), a.width - 90);
      const t = Math.min(Math.max(t0 + ev.clientY - y0, 0), a.height - 30);
      j.style.left = `${l}px`;
      j.style.top = `${t}px`;
    };
    const soltar = () => {
      j.classList.remove('arrastando');
      barra.removeEventListener('pointermove', mover);
      barra.removeEventListener('pointerup', soltar);
      barra.removeEventListener('pointercancel', soltar);
    };
    barra.addEventListener('pointermove', mover);
    barra.addEventListener('pointerup', soltar);
    barra.addEventListener('pointercancel', soltar);
  });
}

/* mantém as janelas dentro da área quando a tela muda de tamanho */
addEventListener('resize', () => {
  const a = area();
  for (const j of janelas) {
    if (!estados.get(j)!.posicionada) continue;
    const w = Math.min(j.offsetWidth, a.width - 12);
    const h = Math.min(j.offsetHeight, a.height - 12);
    j.style.width = `${w}px`;
    j.style.maxHeight = `${Math.round(a.height - 16)}px`;
    if (j.dataset.altura !== '0') j.style.height = `${h}px`;
    j.style.left = `${Math.min(Math.max(j.offsetLeft, 0), Math.max(0, a.width - w))}px`;
    j.style.top = `${Math.min(Math.max(j.offsetTop, 0), Math.max(0, a.height - h))}px`;
  }
});

/* ---------- itens "abríveis": clique seleciona, duplo clique abre ---------- */
let ultimoPonteiro = 'mouse';
addEventListener('pointerdown', (e) => (ultimoPonteiro = e.pointerType), true);

function abrivel(itens: HTMLElement[], acao: (el: HTMLElement) => void, colunas?: () => number) {
  const selecionar = (el: HTMLElement | null) => itens.forEach((i) => i.classList.toggle('selecionado', i === el));
  itens.forEach((el, idx) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      // teclado (Enter) chega com detail 0; toque abre com um toque só
      if (e.detail === 0 || ultimoPonteiro === 'touch' || ultimoPonteiro === 'pen' || mqToque.matches) {
        selecionar(el);
        acao(el);
      } else selecionar(el);
    });
    el.addEventListener('dblclick', (e) => {
      e.preventDefault();
      acao(el);
    });
    el.addEventListener('focus', () => selecionar(el));
    el.addEventListener('keydown', (e) => {
      const n = colunas ? colunas() : 1;
      let alvo = -1;
      if (e.key === ' ') {
        e.preventDefault();
        acao(el);
        return;
      }
      if (e.key === 'ArrowDown') alvo = idx + n;
      else if (e.key === 'ArrowUp') alvo = idx - n;
      else if (e.key === 'ArrowRight') alvo = idx + (colunas ? 1 : 1);
      else if (e.key === 'ArrowLeft') alvo = idx - 1;
      else if (e.key === 'Home') alvo = 0;
      else if (e.key === 'End') alvo = itens.length - 1;
      else return;
      e.preventDefault();
      itens[Math.min(Math.max(alvo, 0), itens.length - 1)].focus();
    });
  });
  return selecionar;
}

const icones = qsa('.icone');
const selecionarIcone = abrivel(icones, (el) => abrir(el.dataset.abre!, el), () => (celular() ? 4 : 1));
qs('.mesa-cab')!.addEventListener('pointerdown', (e) => {
  if (!(e.target as Element).closest('.icone')) selecionarIcone(null);
});

/* links que abrem janelas (atalhos do Bem-vindo, menu Iniciar) */
const menu = qs('#menu-iniciar')!;
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLElement>('[data-abre]');
  if (!a || a.classList.contains('icone')) return;
  e.preventDefault();
  if (menu.contains(a)) {
    menu.hidePopover();
    abrir(a.dataset.abre!, qs(`.icone[data-abre="${a.dataset.abre}"]`) ?? qs('[data-iniciar]'));
  } else abrir(a.dataset.abre!, a);
});

/* Esc fecha a janela em foco */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  if (!qs('[data-desligar]')!.hidden || !qs('[data-desligado]')!.hidden) return;
  const j = (document.activeElement as Element | null)?.closest<HTMLElement>('[data-janela]');
  if (j && aberta(j)) {
    e.preventDefault();
    fechar(j);
  }
});

/* ---------- menu Iniciar ---------- */
const botaoIniciar = qs<HTMLButtonElement>('[data-iniciar]')!;
const itensMenu = qsa('.mi-item', menu);
menu.addEventListener('toggle', (e) => {
  const abertoAgora = (e as ToggleEvent).newState === 'open';
  botaoIniciar.classList.toggle('aberto', abertoAgora);
  if (abertoAgora) {
    itensMenu[0]?.focus();
    if (!reduzido()) gsap.from(menu, { clipPath: 'inset(100% 0 0 0)', duration: 0.2, ease: 'steps(6)', clearProps: 'clipPath' });
  }
});
menu.addEventListener('keydown', (e) => {
  const visiveis = itensMenu.filter((i) => i.offsetParent);
  const i = visiveis.indexOf(document.activeElement as HTMLElement);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const n = (i + (e.key === 'ArrowDown' ? 1 : -1) + visiveis.length) % visiveis.length;
    visiveis[n].focus();
  }
});

/* ---------- relógio ---------- */
const relogio = qs<HTMLTimeElement>('[data-relogio]')!;
function tique() {
  const d = new Date();
  relogio.textContent = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  relogio.dateTime = d.toISOString();
  relogio.title = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
tique();
setInterval(() => {
  if (!document.hidden) tique();
}, 10_000);
document.addEventListener('visibilitychange', () => !document.hidden && tique());

/* ---------- Bem-vindo: dica (Eu construo A para B) ---------- */
let dica = 0;
const dicaA = qs('[data-dica-a]')!;
const dicaB = qs('[data-dica-b]')!;
qs('[data-acao="proxima-dica"]')?.addEventListener('click', () => {
  dica = (dica + 1) % construo.length;
  const [a, b] = construo[dica];
  if (reduzido()) {
    dicaA.textContent = a;
    dicaB.textContent = b;
    return;
  }
  const tl = gsap.timeline();
  const digitar = (el: HTMLElement, txt: string) => {
    const o = { n: 0 };
    return gsap.to(o, {
      n: txt.length,
      duration: txt.length * 0.035,
      ease: 'none',
      onUpdate: () => {
        el.textContent = txt.slice(0, Math.round(o.n));
      },
    });
  };
  dicaA.textContent = '';
  dicaB.textContent = '';
  tl.add(digitar(dicaA, a)).add(digitar(dicaB, b));
});

/* ---------- Explorador de projetos ---------- */
const exp = qs('[data-exp]');
if (exp) {
  const caminho = qs('[data-caminho-texto]', exp)!;
  const status = qs('[data-exp-status]')!;
  const voltar = qs<HTMLButtonElement>('[data-acao="voltar"]', exp)!;
  const acima = qs<HTMLButtonElement>('[data-acao="acima"]', exp)!;
  const raiz = caminho.textContent ?? '';
  const pastas = qsa('[data-projeto]', exp);
  const arvore = qsa('[data-arvore]', exp);
  const linkRaiz = qs('[data-raiz]', exp)!;
  const total = pastas.length;

  const mostrar = (id: string | null) => {
    exp.dataset.vista = id ? 'proj' : 'raiz';
    let nome = '';
    qsa('[data-projeto-detalhe]', exp).forEach((a) => {
      const atual = a.dataset.projetoDetalhe === id;
      a.classList.toggle('atual', atual);
      if (atual) nome = qs('h3', a)?.textContent ?? '';
    });
    arvore.forEach((a) => a.setAttribute('aria-current', String(a.dataset.arvore === id)));
    linkRaiz.setAttribute('aria-current', String(!id));
    caminho.textContent = id ? `${raiz}\\${nome}` : raiz;
    voltar.disabled = acima.disabled = !id;
    const n = id ? qsa(`[data-projeto-detalhe="${id}"] .proj-itens li`, exp).length : 0;
    status.textContent = id ? `${nome} · ${n} itens no LEIAME.txt` : `${total} objeto(s)`;
    const alvo = id ? qs<HTMLElement>(`[data-projeto-detalhe="${id}"] h3`, exp) : pastas[0];
    if (id && alvo) {
      alvo.tabIndex = -1;
      alvo.focus({ preventScroll: true });
      if (!reduzido()) gsap.from(qs(`[data-projeto-detalhe="${id}"]`, exp), { opacity: 0, duration: 0.2, ease: 'steps(4)' });
    }
    qs('.exp-conteudo', exp)!.scrollTop = 0;
  };
  mostrar(null);
  abrivel(pastas, (el) => mostrar(el.dataset.projeto!), () => 99);
  arvore.forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      mostrar(a.dataset.arvore!);
    }),
  );
  linkRaiz.addEventListener('click', (e) => {
    e.preventDefault();
    mostrar(null);
    pastas[0]?.focus();
  });
  const subir = () => {
    const atual = exp.dataset.vista === 'proj' ? qs('.proj.atual', exp)?.dataset.projetoDetalhe : null;
    mostrar(null);
    (pastas.find((p) => p.dataset.projeto === atual) ?? pastas[0])?.focus();
  };
  voltar.addEventListener('click', subir);
  acima.addEventListener('click', subir);
  exp.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && exp.dataset.vista === 'proj' && !(e.target as Element).closest('input,textarea')) {
      e.preventDefault();
      subir();
    }
  });
}

/* ---------- Propriedades: abas da stack ---------- */
const props = qs('[data-props]');
if (props) {
  const lista = qs('[data-abas]', props)!;
  const abas = qsa<HTMLButtonElement>('[data-aba]', props);
  const paineis = qsa('[data-painel]', props);
  lista.hidden = false;
  lista.setAttribute('role', 'tablist');
  lista.setAttribute('aria-label', 'Grupos da stack');
  const escolher = (i: number, focar = false) => {
    abas.forEach((a, k) => {
      a.setAttribute('role', 'tab');
      a.setAttribute('aria-selected', String(k === i));
      a.setAttribute('aria-controls', `painel-${k}`);
      a.tabIndex = k === i ? 0 : -1;
    });
    paineis.forEach((p, k) => {
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', `aba-${k}`);
      p.hidden = k !== i;
    });
    if (focar) abas[i].focus();
    if (!reduzido()) gsap.from(qsa('.painel-lista li', paineis[i]), { opacity: 0, x: -6, stagger: 0.03, duration: 0.15, ease: 'steps(3)' });
  };
  escolher(0);
  abas.forEach((a, i) => {
    a.addEventListener('click', () => escolher(i));
    a.addEventListener('keydown', (e) => {
      const n = abas.length;
      let k = -1;
      if (e.key === 'ArrowRight') k = (i + 1) % n;
      else if (e.key === 'ArrowLeft') k = (i - 1 + n) % n;
      else if (e.key === 'Home') k = 0;
      else if (e.key === 'End') k = n - 1;
      if (k < 0) return;
      e.preventDefault();
      escolher(k, true);
    });
  });
}

/* ---------- Trajetória: lista + detalhes ---------- */
const traj = qs('[data-traj]');
if (traj) {
  const itens = qsa('[data-etapa]', traj);
  const status = qs('[data-traj-status]')!;
  const escolher = (i: number) => {
    itens.forEach((a, k) => {
      a.closest('tr')!.classList.toggle('selecionada', k === i);
      a.setAttribute('aria-current', String(k === i));
    });
    qsa('[data-etapa-detalhe]', traj).forEach((d, k) => d.classList.toggle('atual', k === i));
    status.textContent = `1 de ${itens.length} selecionado · ${qs(`[data-etapa-detalhe="${i}"] h3`, traj)?.textContent ?? ''}`;
    qs('.traj-detalhes', traj)!.scrollTop = 0;
  };
  escolher(0);
  itens.forEach((a, i) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      escolher(i);
    });
    a.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const k = Math.min(Math.max(i + (e.key === 'ArrowDown' ? 1 : -1), 0), itens.length - 1);
      itens[k].focus();
      escolher(k);
    });
  });
}

/* ---------- Correio: Enviar abre o mailto ---------- */
const mail = qs<HTMLFormElement>('[data-mail]');
mail?.addEventListener('submit', (e) => {
  e.preventDefault();
  const dados = new FormData(mail);
  const para = mail.getAttribute('action')!;
  const url = `${para}?subject=${encodeURIComponent(String(dados.get('subject') ?? ''))}&body=${encodeURIComponent(String(dados.get('body') ?? ''))}`;
  qs('[data-mail-status]')!.textContent = 'Abrindo o seu programa de e-mail…';
  location.href = url;
});

/* ---------- Lixeira ---------- */
qs('[data-acao="esvaziar"]')?.addEventListener('click', (e) => {
  const b = e.currentTarget as HTMLButtonElement;
  const lista = qs('[data-lix-lista]')!;
  const fim = () => {
    lista.hidden = true;
    qs('[data-lix-vazia]')!.hidden = false;
    qs('[data-lix-status]')!.textContent = '0 objeto(s)';
    b.disabled = true;
  };
  if (reduzido()) return fim();
  gsap.to(qsa('li', lista), {
    x: 40,
    opacity: 0,
    duration: 0.25,
    stagger: 0.08,
    ease: 'steps(4)',
    onComplete: fim,
  });
});

/* ---------- Desligar ---------- */
const fundo = qs('[data-desligar]')!;
const desligado = qs('[data-desligado]')!;
const dlg = qs('.dlg', fundo)!;
qs('[data-acao="desligar"]')?.addEventListener('click', () => {
  menu.hidePopover();
  fundo.hidden = false;
  dlg.focus();
  if (!reduzido()) gsap.from(fundo, { opacity: 0, duration: 0.3, ease: 'steps(5)' });
});
const cancelar = () => {
  fundo.hidden = true;
  botaoIniciar.focus();
};
qsa('[data-acao="cancelar-desligar"]', fundo).forEach((b) => b.addEventListener('click', cancelar));
fundo.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    cancelar();
  }
  if (e.key === 'Tab') prender(e, fundo);
});
qs<HTMLFormElement>('[data-form-desligar]')!.addEventListener('submit', (e) => {
  e.preventDefault();
  const op = new FormData(e.currentTarget as HTMLFormElement).get('opcao');
  fundo.hidden = true;
  if (op === 'terminal') {
    location.href = '/estilo/terminal/';
  } else if (op === 'reiniciar') {
    inicializar(true);
  } else {
    desligado.hidden = false;
    qs<HTMLButtonElement>('[data-acao="religar"]', desligado)!.focus();
    if (!reduzido()) gsap.from(desligado, { opacity: 0, duration: 0.6, ease: 'steps(6)' });
  }
});
const religar = () => {
  if (desligado.hidden) return;
  desligado.hidden = true;
  inicializar(true);
};
desligado.addEventListener('click', religar);
desligado.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    return;
  }
  if (e.key !== 'Enter' && e.key !== ' ') religar();
});

function prender(e: KeyboardEvent, caixa: HTMLElement) {
  const f = qsa('button:not([disabled]), input:checked, [tabindex="0"]', caixa).filter((x) => x.offsetParent);
  if (!f.length) return;
  const i = f.indexOf(document.activeElement as HTMLElement);
  if (e.shiftKey && i <= 0) {
    e.preventDefault();
    f[f.length - 1].focus();
  } else if (!e.shiftKey && i === f.length - 1) {
    e.preventDefault();
    f[0].focus();
  }
}

/* ---------- boot ---------- */
const boot = qs('[data-boot]')!;

function fecharTudo() {
  for (const j of janelas) {
    if (j.dataset.janela === 'bemvindo') continue;
    estados.get(j)!.botao?.remove();
    estados.get(j)!.botao = null;
    j.dataset.estado = 'fechada';
  }
}

function inicializar(forcar = false) {
  if (forcar) {
    fecharTudo();
    porId.get('bemvindo')!.dataset.estado = 'fechada';
  }
  const deveBoot = forcar ? !reduzido() : html.classList.contains('inicializando');
  if (!deveBoot) return iniciarMesa();
  html.classList.add('inicializando');
  const bios = qs('[data-bios]', boot)!;
  const splash = qs('[data-splash]', boot)!;
  const mem = qs('[data-mem]', boot)!;
  bios.style.display = '';
  splash.classList.remove('visivel');
  const linhas = qsa('.bios-linha', bios);
  const m = { kb: 0 };
  const tl = gsap.timeline({ onComplete: terminar });
  tl.set(linhas, { visibility: 'hidden' })
    .to(linhas, { visibility: 'visible', stagger: 0.16, duration: 0.01 })
    .to(m, { kb: 65536, duration: 0.5, ease: 'steps(16)', onUpdate: () => (mem.textContent = String(Math.round(m.kb))) }, 0.3)
    .add(() => {
      bios.style.display = 'none';
      splash.classList.add('visivel');
    }, '+=0.25')
    .from(qs('[data-splash-logo]', boot), { scale: 0.85, opacity: 0, duration: 0.4, ease: 'steps(6)' })
    .fromTo(qs('[data-faixa]', boot), { backgroundPositionX: '0%' }, { backgroundPositionX: '200%', duration: 1.4, ease: 'none' }, '<')
    .to(boot, { opacity: 0, duration: 0.3, ease: 'steps(4)' }, '+=0.05');
  const pular = (e: Event) => {
    if (e instanceof KeyboardEvent && (e.key === 'Tab' || e.key === 'Shift')) return;
    tl.progress(1);
  };
  boot.addEventListener('click', pular, { once: true });
  addEventListener('keydown', pular, { once: true });
  function terminar() {
    removeEventListener('keydown', pular);
    boot.removeEventListener('click', pular);
    try {
      sessionStorage.setItem('cf-os-boot', '1');
    } catch {}
    html.classList.remove('inicializando');
    gsap.set(boot, { clearProps: 'opacity' });
    iniciarMesa();
  }
}

function iniciarMesa() {
  html.classList.remove('inicializando');
  const bv = porId.get('bemvindo')!;
  const hash = location.hash.slice(1);
  const pedida = janelas.find((j) => j.id === hash && j !== bv);
  if (bv.dataset.estado === 'aberta' && !estados.get(bv)!.posicionada) {
    // o Bem-vindo já nasce aberto no HTML: só posiciona e anima
    posicionar(bv);
    criarBotao(bv);
    ativar(bv);
    if (!reduzido()) {
      const r = bv.getBoundingClientRect();
      bv.style.visibility = 'hidden';
      zoom(new DOMRect(r.left + r.width / 2, r.top + r.height / 2, 0, 0), r).then(() => (bv.style.visibility = ''));
    }
  } else {
    abrir('bemvindo');
  }
  if (pedida) abrir(pedida.dataset.janela!, qs(`.icone[data-abre="${pedida.dataset.janela}"]`));
}

// janelas fechadas de início (o HTML deixa todas legíveis sem JS)
fecharTudo();
inicializar();
