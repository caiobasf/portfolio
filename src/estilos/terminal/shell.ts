/**
 * Estilo "terminal": o shell interativo.
 *
 * Liga o monitor (efeito CRT), faz um boot rápido e pulável, troca a sessão
 * gravada pelo neofetch e passa a aceitar comandos: autocompletar com Tab,
 * histórico com setas, Ctrl+L, atalhos clicáveis e temas de fósforo.
 * Com movimento reduzido: sem boot, sem digitação, sem desligar o monitor.
 */
import { gsap } from 'gsap';
import { contato, projetos, stack } from '../../content/perfil';
import * as S from './saidas';

const TEMA_KEY = 'cf-terminal-tema';
const HIST_KEY = 'cf-terminal-hist';
const BOOT_KEY = 'cf-terminal-boot';

const TEMAS: Record<string, string> = {
  verde: 'verde',
  green: 'verde',
  ambar: 'ambar',
  âmbar: 'ambar',
  amber: 'ambar',
  branco: 'branco',
  white: 'branco',
};

const html = document.documentElement;
const log = document.getElementById('t-log') as HTMLElement | null;
const form = document.getElementById('t-form') as HTMLFormElement | null;
const input = document.getElementById('t-entrada') as HTMLInputElement | null;
const ps1El = document.getElementById('t-ps1');
const cursorEl = document.getElementById('t-cursor');
const raiz = document.querySelector<HTMLElement>('.t-raiz');
const tela = document.querySelector<HTMLElement>('.t-tela');
const tmux = document.querySelector<HTMLElement>('.t-tmux');

if (log && form && input && ps1El && cursorEl && raiz && tela && tmux) iniciar(log, form, input, ps1El, cursorEl, raiz, tela, tmux);

function iniciar(
  log: HTMLElement,
  form: HTMLFormElement,
  input: HTMLInputElement,
  ps1El: HTMLElement,
  cursorEl: HTMLElement,
  raiz: HTMLElement,
  tela: HTMLElement,
  tmux: HTMLElement,
) {
  const ctx: S.Ctx = { js: true };
  const toque = matchMedia('(pointer: coarse)').matches;

  let reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mm = gsap.matchMedia();
  mm.add({ reduzir: '(prefers-reduced-motion: reduce)' }, (c) => {
    reduzido = Boolean(c.conditions?.reduzir);
  });

  let cwd = '~';
  let n = 0;
  let hist: string[] = [];
  try {
    hist = JSON.parse(sessionStorage.getItem(HIST_KEY) ?? '[]');
    if (!Array.isArray(hist)) hist = [];
  } catch {
    hist = [];
  }
  let hIdx = hist.length;
  let rascunho = '';
  let anim: gsap.core.Timeline | null = null;
  let ocupado = false; // boot ou desligamento em curso

  /* ------------------------------------------------------------ util */

  const salvarHist = () => {
    try {
      sessionStorage.setItem(HIST_KEY, JSON.stringify(hist.slice(-60)));
    } catch {}
  };

  const atualizarPs1 = () => {
    ps1El.innerHTML = S.ps1(cwd);
  };

  function pular() {
    if (anim) {
      const a = anim;
      anim = null;
      a.progress(1);
      a.kill();
    }
  }

  /** digitação linha a linha: o texto já está no DOM, só o recorte anima */
  function revelar(el: HTMLElement) {
    if (reduzido) return;
    const linhas = Array.from(el.querySelectorAll<HTMLElement>('.l'));
    if (!linhas.length) return;
    const tl = gsap.timeline({
      onComplete: () => {
        if (anim === tl) anim = null;
      },
    });
    let t = 0;
    for (const ln of linhas) {
      const len = (ln.textContent ?? '').length;
      const dur = Math.min(0.34, 0.05 + len * 0.0045);
      tl.fromTo(
        ln,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: dur,
          ease: `steps(${Math.max(2, Math.min(40, Math.ceil(len / 2)))})`,
          clearProps: 'clipPath',
        },
        t,
      );
      t += dur * 0.6;
    }
    const total = tl.duration();
    if (total > 1.8) tl.timeScale(total / 1.8);
    anim = tl;
  }

  function rolar(bloco: HTMLElement) {
    const topo = bloco.getBoundingClientRect().top + scrollY - tmux.offsetHeight - 24;
    const fim = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: Math.max(0, Math.min(topo, fim)), behavior: 'auto' });
  }

  function novoBloco(linha: string, eco = true): HTMLElement {
    const id = `t-b${++n}`;
    const bloco = document.createElement('section');
    bloco.className = 't-bloco';
    if (eco) {
      bloco.setAttribute('aria-labelledby', id);
      bloco.innerHTML = `<h2 class="t-eco" id="${id}">${S.ps1(cwd)} <span class="t-eco-cmd">${S.esc(linha)}</span></h2>`;
    }
    const out = document.createElement('div');
    out.className = 't-out';
    bloco.append(out);
    log.append(bloco);
    return bloco;
  }

  function imprimir(linha: string, corpo: string) {
    const bloco = novoBloco(linha);
    const out = bloco.querySelector<HTMLElement>('.t-out')!;
    out.innerHTML = corpo;
    rolar(bloco);
    revelar(out);
  }

  function limpar() {
    pular();
    log.replaceChildren();
    scrollTo({ top: 0, behavior: 'auto' });
  }

  function marcarJanela(nome: string) {
    tmux.querySelectorAll<HTMLElement>('[data-janela]').forEach((a) => {
      if (a.dataset.janela === nome) a.setAttribute('data-ativa', '');
      else a.removeAttribute('data-ativa');
    });
  }

  /* ------------------------------------------------ sistema de arquivos */

  function caminho(arg: string): string | null {
    let p = arg.replace(/\/+$/, '');
    if (p === '' || p === '~' || p === '/home/visitante') return '~';
    p = p.replace(/^\/home\/visitante/, '~').replace(/^\.\//, '');
    if (p === '..') return cwd === '~' ? '..' : '~';
    if (p.startsWith('~/')) return p;
    if (p.startsWith('../')) return cwd === '~' ? null : `~/${p.slice(3)}`.replace(/^~\/$/, '~');
    if (p.startsWith('/')) return p;
    return cwd === '~' ? `~/${p}` : `${cwd}/${p}`;
  }

  function pasta(p: string) {
    return S.PASTAS.includes(p) ? p : null;
  }

  function arquivo(p: string) {
    const i = p.lastIndexOf('/');
    const dir = i < 0 ? '~' : p.slice(0, i);
    const nome = p.slice(i + 1);
    return S.ARQUIVOS[dir]?.find((a) => a.nome === nome) ?? null;
  }

  function listar(dir: string, todos: boolean): string {
    const rel = (nome: string) => (dir === cwd ? nome : `${dir.replace(/^~\/?/, '')}${dir === '~' ? '' : '/'}${nome}`);
    const itens: string[] = [];
    if (todos) itens.push('<span class="t-dim">./</span>', '<span class="t-dim">../</span>');
    for (const sub of S.PASTAS.filter((p) => p !== dir && p.startsWith(dir === '~' ? '~/' : `${dir}/`))) {
      const nome = sub.split('/').pop()!;
      itens.push(S.cmd(ctx, `cd ${rel(nome)}`, `${nome}/`, 't-pasta'));
    }
    for (const a of S.ARQUIVOS[dir] ?? []) {
      if (a.oculto && !todos) continue;
      itens.push(S.cmd(ctx, `cat ${rel(a.nome)}`, a.nome));
    }
    return `<p class="l t-ls">${itens.join('<span class="t-pad">  </span>')}</p>`;
  }

  /* --------------------------------------------------------- comandos */

  const nomes = new Map<string, string>();
  for (const c of S.COMANDOS) {
    nomes.set(c.nome, c.nome);
    for (const a of c.aliases) nomes.set(a, c.nome);
  }
  const extras = ['rm', 'vim', 'vi', 'nano', 'emacs', 'ping', 'cowsay', 'hack', 'make', 'git'];

  function distancia(a: string, b: string) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  const erro = (t: string) => S.l(`<span class="t-amb">${t}</span>`);

  function acharProjeto(arg: string) {
    const a = arg.toLowerCase().replace(/\.md$/, '');
    return projetos.find(
      (p, i) =>
        p.id === a ||
        p.codigo.toLowerCase() === a ||
        String(i + 1) === a.replace(/^0+/, '') ||
        p.nome.toLowerCase().startsWith(a),
    );
  }

  function abrir(url: string) {
    try {
      window.open(url, '_blank', 'noopener');
    } catch {}
  }

  function executar(bruto: string) {
    if (ocupado) return;
    pular();
    const linha = bruto.trim();
    if (linha && hist[hist.length - 1] !== linha) {
      hist.push(linha);
      salvarHist();
    }
    hIdx = hist.length;
    rascunho = '';
    input.value = '';
    atualizarCursor();

    if (!linha) {
      const b = novoBloco('');
      rolar(b);
      return;
    }
    const [c0, ...args] = linha.split(/\s+/);
    const nome = nomes.get(c0.toLowerCase()) ?? c0.toLowerCase();
    const resto = linha.slice(c0.length).trim();

    if (nome === 'clear') {
      limpar();
      marcarJanela('');
      return;
    }

    const eco = linha;
    let corpo = '';
    let depois: (() => void) | null = null;
    marcarJanela(nome === 'help' || nome === 'neofetch' ? 'neofetch' : nome);

    switch (nome) {
      case 'help':
        corpo = S.help(ctx);
        break;
      case 'sobre':
        corpo = S.sobreSaida();
        break;
      case 'projetos':
        corpo = S.projetosSaida(ctx);
        break;
      case 'projeto': {
        if (!args[0]) {
          corpo = [
            S.l('uso: projeto &lt;id&gt;', 't-dim'),
            S.l(`ids: ${projetos.map((p) => S.cmd(ctx, `projeto ${p.id}`, p.id)).join(' · ')}`),
          ].join('');
          break;
        }
        const p = acharProjeto(args[0]);
        corpo = p
          ? S.projeto(p.id)
          : erro(`projeto: "${S.esc(args[0])}" não encontrado.`) +
            S.l(`tente: ${projetos.map((x) => S.cmd(ctx, `projeto ${x.id}`, x.id)).join(' · ')}`);
        break;
      }
      case 'stack':
        corpo = S.stackSaida();
        break;
      case 'trajetoria':
        corpo = S.trajetoriaSaida();
        break;
      case 'contato':
        corpo = S.contatoSaida(ctx);
        break;
      case 'email':
        corpo = S.l(
          `Abrindo seu cliente de e-mail para <a href="mailto:${contato.email}">${contato.email}</a>…`,
        );
        depois = () => {
          location.href = `mailto:${contato.email}`;
        };
        break;
      case 'github':
      case 'linkedin': {
        const r = nome === 'github' ? contato.github : contato.linkedin;
        corpo =
          S.l(`Abrindo ${S.esc(r.rotulo)} numa nova aba…`) +
          S.l(
            `Se nada abriu: <a href="${r.url}" target="_blank" rel="noopener noreferrer">${S.esc(r.rotulo)}<span class="t-sr"> (abre em nova aba)</span></a>`,
            't-dim',
          );
        depois = () => abrir(r.url);
        break;
      }
      case 'neofetch':
        corpo = S.neofetch();
        break;
      case 'ls': {
        const todos = args.some((a) => /^-\w*a/.test(a));
        const alvo = args.find((a) => !a.startsWith('-'));
        const p = alvo ? caminho(alvo) : cwd;
        const dir = p ? pasta(p) : null;
        if (dir) corpo = listar(dir, todos);
        else if (p && arquivo(p)) corpo = S.l(S.esc(alvo ?? ''));
        else corpo = erro(`ls: não foi possível acessar '${S.esc(alvo ?? '')}': Arquivo ou diretório inexistente`);
        break;
      }
      case 'cat': {
        if (!args[0]) {
          corpo = S.l('uso: cat &lt;arquivo&gt;', 't-dim') + listar(cwd, false);
          break;
        }
        const p = caminho(args[0]);
        const a = p ? arquivo(p) : null;
        if (a) corpo = a.conteudo(ctx);
        else if (p && pasta(p)) corpo = erro(`cat: ${S.esc(args[0])}: É um diretório`);
        else corpo = erro(`cat: ${S.esc(args[0])}: Arquivo ou diretório inexistente`) + S.l(`veja com ${S.cmd(ctx, 'ls')}`);
        break;
      }
      case 'cd': {
        const p = caminho(args[0] ?? '~');
        if (p === '..') corpo = erro('cd: daqui não dá para subir. O resto do disco é confidencial.');
        else if (p && pasta(p)) {
          cwd = p;
          atualizarPs1();
        } else if (p && arquivo(p)) corpo = erro(`cd: ${S.esc(args[0])}: Não é um diretório`);
        else corpo = erro(`cd: ${S.esc(args[0] ?? '')}: Arquivo ou diretório inexistente`);
        break;
      }
      case 'pwd':
        corpo = S.l(`/home/visitante${cwd.slice(1)}`);
        break;
      case 'tema': {
        const atual = html.dataset.fosforo ?? 'verde';
        const pedido = args[0] ? TEMAS[args[0].toLowerCase()] : undefined;
        if (!args[0]) {
          corpo =
            S.l(`fósforo atual: <span class="t-hl">${atual}</span>`) +
            S.l(`opções: ${['verde', 'ambar', 'branco'].map((t) => S.cmd(ctx, `tema ${t}`, t)).join(' · ')}`);
        } else if (!pedido) {
          corpo = erro(`tema: "${S.esc(args[0])}" não existe.`) + S.l('use verde, ambar ou branco.', 't-dim');
        } else {
          if (pedido === 'verde') delete html.dataset.fosforo;
          else html.dataset.fosforo = pedido;
          try {
            localStorage.setItem(TEMA_KEY, pedido);
          } catch {}
          const meta = document.querySelector('meta[name="theme-color"]');
          meta?.setAttribute('content', getComputedStyle(html).getPropertyValue('--bg').trim());
          corpo = S.l(`Fósforo trocado para <span class="t-hl">${pedido}</span>. Salvo para a próxima visita.`);
        }
        break;
      }
      case 'estilos':
        corpo = S.estilosSaida();
        break;
      case 'historico':
        corpo = hist.length
          ? `<ol class="t-hist">${hist
              .map(
                (h, i) =>
                  `<li class="l"><span class="t-dim">${String(i + 1).padStart(4, ' ')}</span>  ${S.cmd(ctx, h)}</li>`,
              )
              .join('')}</ol>`
          : S.l('histórico vazio.', 't-dim');
        break;
      case 'data':
        corpo = S.l(
          S.esc(
            new Date().toLocaleString('pt-BR', {
              dateStyle: 'full',
              timeStyle: 'medium',
              timeZone: 'America/Sao_Paulo',
            }),
          ) + ' <span class="t-dim">(horário de São Paulo)</span>',
        );
        break;
      case 'echo':
        corpo = S.l(S.esc(resto) || '&nbsp;');
        break;
      case 'conversa':
        corpo = S.l('Abrindo o chat… <a href="/conversa">/conversa</a>');
        depois = () => setTimeout(() => (location.href = '/conversa'), reduzido ? 0 : 700);
        break;
      case 'sudo':
        if (/contrat|hire|emprega/i.test(resto)) {
          corpo = S.l('[sudo] senha para visitante: ********', 't-dim') +
            S.l('<span class="t-hl">Permissão concedida.</span> Executando: contato') +
            S.contatoSaida(ctx);
        } else {
          corpo =
            S.l('[sudo] senha para visitante: ********', 't-dim') +
            erro('visitante não está no arquivo sudoers. Este incidente será reportado.') +
            S.l(`(Dica: ${S.cmd(ctx, 'sudo contratar')} funciona.)`, 't-dim');
        }
        break;
      case 'exit':
        corpo = S.l('Encerrando a sessão…', 't-dim');
        depois = () => desligar();
        break;
      default:
        if (c0 === 'rm') corpo = erro('rm: operação não permitida. Os projetos têm backup e advogado.');
        else if (['vim', 'vi', 'nano', 'emacs'].includes(c0))
          corpo = S.l(`${S.esc(c0)}: nenhum editor por aqui, só leitura. Tente ${S.cmd(ctx, 'cat sobre.txt')}.`);
        else if (c0 === 'git') corpo = S.l(`Para o log da carreira, use ${S.cmd(ctx, 'trajetoria')}.`);
        else if (c0 === 'ping') corpo = S.l(`PONG. Para falar com o Caio de verdade: ${S.cmd(ctx, 'contato')}.`);
        else if (c0 === 'cowsay' || c0 === 'hack' || c0 === 'make')
          corpo = S.l(`${S.esc(c0)}: pacote não instalado. Veja o que está em ${S.cmd(ctx, 'stack')}.`);
        else {
          const lista = [...nomes.keys(), ...extras].filter((x) => /^[a-z-]+$/.test(x));
          const perto = lista
            .map((x) => [x, distancia(c0.toLowerCase(), x)] as const)
            .sort((a, b) => a[1] - b[1])[0];
          corpo =
            erro(`caiobasf-sh: comando não encontrado: ${S.esc(c0)}`) +
            (perto && perto[1] <= 2 ? S.l(`Você quis dizer ${S.cmd(ctx, nomes.get(perto[0]) ?? perto[0])}?`) : '') +
            S.l(`Digite ${S.cmd(ctx, 'help')} para ver os comandos.`, 't-dim');
        }
    }

    imprimir(eco, corpo);
    depois?.();
  }

  /* ------------------------------------------------------ autocompletar */

  function candidatos(v: string): { base: string; opcoes: string[]; final: string } {
    const m = v.match(/^(\s*)(\S*)(\s+)?(.*)$/)!;
    const [, , c0, sep] = m;
    const arg = m[4] ?? '';
    if (!sep) {
      const todos = [...new Set([...S.COMANDOS.map((c) => c.nome), ...S.COMANDOS.flatMap((c) => c.aliases)])].filter(
        (x) => /^[a-z]/.test(x),
      );
      return { base: '', opcoes: todos.filter((x) => x.startsWith(c0.toLowerCase())).sort(), final: ' ' };
    }
    const nome = nomes.get(c0.toLowerCase()) ?? c0;
    const base = `${c0} `;
    let pool: string[] = [];
    if (nome === 'projeto') pool = projetos.map((p) => p.id);
    else if (nome === 'tema') pool = ['verde', 'ambar', 'branco'];
    else if (nome === 'cat' || nome === 'cd' || nome === 'ls') {
      const i = arg.lastIndexOf('/');
      const prefixo = i < 0 ? '' : arg.slice(0, i + 1);
      const dir = i < 0 ? cwd : caminho(arg.slice(0, i));
      if (dir && pasta(dir)) {
        const subs = S.PASTAS.filter((p) => p !== dir && p.startsWith(dir === '~' ? '~/' : `${dir}/`)).map(
          (p) => `${prefixo}${p.split('/').pop()}/`,
        );
        const arqs =
          nome === 'cat'
            ? (S.ARQUIVOS[dir] ?? []).filter((a) => !a.oculto || arg.includes('.')).map((a) => `${prefixo}${a.nome}`)
            : [];
        pool = [...subs, ...arqs];
      }
    }
    return { base, opcoes: pool.filter((x) => x.startsWith(arg)), final: '' };
  }

  function completar(): boolean {
    const v = input.value;
    if (!v.trim()) return false;
    const { base, opcoes, final } = candidatos(v);
    if (!opcoes.length) return true;
    if (opcoes.length === 1) {
      const o = opcoes[0];
      input.value = base + o + (o.endsWith('/') ? '' : final || ' ');
    } else {
      let comum = opcoes[0];
      for (const o of opcoes) while (!o.startsWith(comum)) comum = comum.slice(0, -1);
      const atual = v.slice(base.length);
      if (comum.length > atual.length) input.value = base + comum;
      else {
        const bloco = novoBloco(v);
        const out = bloco.querySelector<HTMLElement>('.t-out')!;
        out.innerHTML = S.l(
          opcoes
            .map((o) => S.cmd(ctx, base ? `${base}${o}` : o, o))
            .join('<span class="t-pad">  </span>'),
          't-ls',
        );
        rolar(bloco);
      }
    }
    atualizarCursor();
    return true;
  }

  /* ------------------------------------------------------------- cursor */

  function atualizarCursor() {
    const pos = input.selectionStart ?? input.value.length;
    cursorEl.style.setProperty('--c', String(pos));
    cursorEl.style.transform = input.scrollLeft ? `translateX(${-input.scrollLeft}px)` : '';
    cursorEl.textContent = input.value[pos] ?? ' ';
  }
  for (const ev of ['input', 'keyup', 'click', 'select', 'focus', 'scroll']) input.addEventListener(ev, atualizarCursor);
  document.addEventListener('selectionchange', () => {
    if (document.activeElement === input) atualizarCursor();
  });

  /* -------------------------------------------------------------- eventos */

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    executar(input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
      if (completar()) e.preventDefault();
      return;
    }
    if (e.key === 'ArrowUp') {
      if (!hist.length) return;
      e.preventDefault();
      if (hIdx === hist.length) rascunho = input.value;
      hIdx = Math.max(0, hIdx - 1);
      input.value = hist[hIdx];
    } else if (e.key === 'ArrowDown') {
      if (hIdx >= hist.length) return;
      e.preventDefault();
      hIdx++;
      input.value = hIdx === hist.length ? rascunho : hist[hIdx];
    } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      limpar();
    } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && !input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? 0)) {
      e.preventDefault();
      if (anim) pular();
      else {
        novoBloco(`${input.value}^C`);
        input.value = '';
      }
    } else if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      input.value = '';
    } else return;
    requestAnimationFrame(() => {
      input.setSelectionRange(input.value.length, input.value.length);
      atualizarCursor();
    });
  });

  const editavel = (el: EventTarget | null) =>
    el instanceof HTMLElement && el.closest('a, button, input, textarea, select, summary, [contenteditable], estilo-switcher');

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || (anim && !['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key))) pular();
    if (ocupado || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    if (editavel(e.target)) return;
    input.focus({ preventScroll: true });
  });

  // clicar na tela foca o prompt (no toque, só a área do prompt)
  tela.addEventListener('click', (e) => {
    pular();
    if (editavel(e.target) || form.hidden || ocupado) return;
    if (String(getSelection() ?? '').length) return;
    if (toque && !(e.target as HTMLElement).closest('.t-painel')) return;
    input.focus({ preventScroll: true });
  });

  // atalhos: digita o comando no prompt e executa
  let digitando: gsap.core.Tween | null = null;
  document.addEventListener('click', (e) => {
    const alvo = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cmd]');
    if (!alvo || form.hidden) return;
    e.preventDefault();
    const c = alvo.dataset.cmd ?? '';
    const doMouse = e.detail > 0;
    pular();
    digitando?.kill();
    if (doMouse && !toque) input.focus({ preventScroll: true });
    if (reduzido || ocupado) {
      executar(c);
      return;
    }
    const obj = { p: 0 };
    digitando = gsap.to(obj, {
      p: 1,
      duration: Math.min(0.45, 0.04 * c.length + 0.08),
      ease: `steps(${Math.max(1, c.length)})`,
      onUpdate: () => {
        input.value = c.slice(0, Math.round(obj.p * c.length));
        atualizarCursor();
      },
      onComplete: () => {
        digitando = null;
        executar(c);
      },
    });
  });

  /* ------------------------------------------------------------ relógio */

  const relogio = document.querySelector<HTMLElement>('[data-relogio]');
  const fmt = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
  let relogioId = 0;
  const tic = () => {
    if (relogio) relogio.textContent = `SP ${fmt.format(new Date()).replace(/\./g, '').replace(',', ' ·')}`;
  };
  const ligarRelogio = () => {
    clearInterval(relogioId);
    if (document.hidden) return;
    tic();
    relogioId = window.setInterval(tic, 15000);
  };
  document.addEventListener('visibilitychange', ligarRelogio);
  ligarRelogio();

  /* ---------------------------------------------------- boot e boas-vindas */

  function boasVindas() {
    const bloco = novoBloco('neofetch');
    const out = bloco.querySelector<HTMLElement>('.t-out')!;
    out.innerHTML =
      S.neofetch() +
      `<div class="t-bemvindo">${S.l(
        `Bem-vindo, visitante. Este é o portfólio do Caio em forma de shell. Digite ${S.cmd(ctx, 'help')} ou toque num atalho abaixo.`,
      )}${S.l(
        `Não sabe por onde começar? ${S.cmd(ctx, 'sobre')}, ${S.cmd(ctx, 'projetos')} e ${S.cmd(ctx, 'contato')} são um bom roteiro.`,
        't-dim',
      )}</div>`;
    marcarJanela('neofetch');
    revelar(out);
  }

  const BOOT: [string, string?][] = [
    ['CAIO-BIOS v4.04 · (C) 2026 oficina do caiobasf', 'b-tit'],
    ['Processador: café expresso @ 3,2 GHz .......... OK'],
    ['Memória: 640K (deve bastar) .................... OK'],
    ['Unidade 0: /dev/portfolio ....................... OK'],
    [''],
    [`[ OK ] Montando /home/visitante`],
    [`[ OK ] Carregando ${projetos.length} projetos`],
    [`[ OK ] Carregando ${stack.reduce((n, g) => n + g.itens.length, 0)} pacotes da stack`],
    ['[ OK ] Sincronizando relógio com São Paulo, SP'],
    ['[ OK ] Iniciando caiobasf-sh 4.0'],
    [''],
    ['login: visitante (automático)'],
  ];

  function boot(fim: () => void) {
    ocupado = true;
    log.setAttribute('aria-busy', 'true');
    const caixa = document.createElement('div');
    caixa.className = 't-boot';
    caixa.setAttribute('aria-hidden', 'true');
    caixa.innerHTML =
      BOOT.map(([t, c]) =>
        `<p class="b-ln ${c ?? ''}">${S.esc(t).replace('[ OK ]', '[<span class="b-ok"> OK </span>]') || '&nbsp;'}</p>`,
      ).join('') + `<p class="t-boot-dica">pressione qualquer tecla para pular</p>`;
    log.append(caixa);

    const linhas = caixa.querySelectorAll('.b-ln');
    const tl = gsap.timeline({
      onComplete: () => {
        caixa.remove();
        log.removeAttribute('aria-busy');
        ocupado = false;
        if (anim === tl) anim = null;
        fim();
      },
    });
    tl.from(raiz, {
      scaleY: 0.006,
      scaleX: 0.7,
      filter: 'brightness(3)',
      transformOrigin: `50% ${innerHeight / 2}px`,
      duration: 0.42,
      ease: 'power3.out',
      clearProps: 'transform,filter',
    });
    tl.from(linhas, { autoAlpha: 0, duration: 0.01, stagger: 0.085 }, 0.25);
    tl.to({}, { duration: 0.35 });
    anim = tl;
    const pularBoot = () => {
      if (anim === tl) pular();
    };
    addEventListener('pointerdown', pularBoot, { once: true });
  }

  function desligar() {
    if (reduzido) {
      limpar();
      imprimir('exit', S.l('Sessão encerrada. Brincadeira: daqui não se sai, só se contrata.') + S.l(`Digite ${S.cmd(ctx, 'contato')}.`));
      return;
    }
    ocupado = true;
    pular();
    const tl = gsap.timeline();
    tl.to(raiz, {
      scaleY: 0.004,
      filter: 'brightness(4)',
      transformOrigin: `50% ${scrollY + innerHeight / 2}px`,
      duration: 0.28,
      ease: 'power3.in',
      delay: 0.3,
    })
      .to(raiz, { scaleX: 0, duration: 0.22, ease: 'power2.in' })
      .to({}, { duration: 0.7 })
      .add(() => {
        gsap.set(raiz, { clearProps: 'transform,filter' });
        limpar();
        cwd = '~';
        atualizarPs1();
        ocupado = false;
        boot(() => {
          boasVindas();
          const b = novoBloco('', false);
          b.querySelector('.t-out')!.innerHTML = S.l(
            `Sessão reiniciada. Daqui não se sai, só se contrata: ${S.cmd(ctx, 'contato')}.`,
            't-amb',
          );
        });
      });
  }

  /* -------------------------------------------------------------- ligar */

  // troca a sessão gravada pelo shell vivo
  log.replaceChildren();
  form.hidden = false;
  document.querySelector('[data-sem-js]')?.remove();
  atualizarPs1();
  atualizarCursor();

  let jaBootou = false;
  try {
    jaBootou = sessionStorage.getItem(BOOT_KEY) === '1';
    sessionStorage.setItem(BOOT_KEY, '1');
  } catch {}

  if (reduzido || jaBootou) boasVindas();
  else boot(boasVindas);

  if (!toque && !location.hash) input.focus({ preventScroll: true });
}
