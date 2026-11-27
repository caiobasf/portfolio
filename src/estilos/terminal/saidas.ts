/**
 * Estilo "terminal": saídas dos comandos em HTML.
 *
 * O mesmo código gera a sessão gravada do servidor (sem JS, para leitores e
 * buscadores) e as respostas do shell interativo no navegador. Todo texto do
 * currículo vem de src/content/perfil.ts.
 *
 * Cada linha visual tem a classe "l": o shell anima a digitação linha a linha.
 */
import { pessoa, contato, sobre, projetos, stack, trajetoria } from '../../content/perfil';
import { ESTILOS } from '../registro';

export interface Ctx {
  /** true no navegador: atalhos viram <button>; false no servidor: âncoras */
  js: boolean;
}

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** id da seção na sessão gravada, para os atalhos sem JS */
export const ancora = (cmd: string) => `cmd-${slug(cmd)}`;

/** atalho clicável que executa um comando */
export function cmd(ctx: Ctx, comando: string, rotulo = comando, extra = ''): string {
  const cls = `t-cmd${extra ? ' ' + extra : ''}`;
  if (ctx.js) return `<button type="button" class="${cls}" data-cmd="${esc(comando)}">${esc(rotulo)}</button>`;
  const alvo = comando.startsWith('projeto ') ? `proj-${slug(comando.slice(8))}` : ancora(comando.split(' ')[0]);
  return `<a class="${cls}" href="#${alvo}" data-cmd="${esc(comando)}">${esc(rotulo)}</a>`;
}

const ext = (url: string, rotulo: string) =>
  `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(rotulo)}<span class="t-sr"> (abre em nova aba)</span></a>`;
const mail = () => `<a href="mailto:${esc(contato.email)}">${esc(contato.email)}</a>`;

/** prompt: usuário, máquina e pasta */
export const ps1 = (cwd = '~') =>
  `<span class="t-u">visitante@caiobasf</span>:<span class="t-d">${esc(cwd)}</span>$`;

/** linha simples */
export const l = (html: string, cls = '') => `<p class="l${cls ? ' ' + cls : ''}">${html}</p>`;

/** hash curto e estável para o "git log" da trajetória */
function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

/* ------------------------------------------------------------------ arte */

/** monograma "CF" em ASCII puro (sem caracteres de desenho de caixa) */
export const ARTE = [
  '   .d8888b.  8888888888 ',
  '  d88P  Y88b 888        ',
  '  888    888 888        ',
  '  888        8888888    ',
  '  888        888        ',
  '  888    888 888        ',
  '  Y88b  d88P 888        ',
  '   "Y8888P"  888        ',
  '                        ',
  '  ~ caiobasf ~ sh 4.0 ~ ',
];

export function stackResumo(): string[] {
  const ling = stack.find((g) => g.grupo === 'Linguagens')?.itens ?? [];
  const fw = stack.find((g) => g.grupo === 'Frameworks')?.itens ?? [];
  return [...ling.slice(0, 2), ...fw.slice(0, 4)];
}

export function neofetch(): string {
  const agora = sobre.resumo.find((r) => r.rotulo === 'Agora');
  const idiomas = sobre.resumo.find((r) => r.rotulo === 'Idiomas');
  const kv = (k: string, v: string) => l(`<span class="t-k">${esc(k)}</span>: ${v}`);
  return `<div class="t-neo">
<pre class="t-arte l" aria-hidden="true">${esc(ARTE.join('\n'))}</pre>
<div class="t-neo-info">
${l(`<span class="t-hl">${esc(pessoa.nome.toLowerCase())}</span>@<span class="t-hl">${esc(pessoa.apelido)}</span>`)}
${l('-'.repeat(20), 't-dim')}
${kv('Nome', esc(pessoa.nomeCompleto))}
${kv('Cargo', esc(pessoa.cargo))}
${kv('Local', esc(pessoa.local))}
${kv('Status', `<span class="t-ok"><span class="t-led" aria-hidden="true"></span>${esc(pessoa.status)}</span>`)}
${agora ? kv('Agora', esc(agora.linhas[0])) : ''}
${kv('Shell', 'caiobasf-sh 4.0 (pt-BR)')}
${kv('Stack', esc(stackResumo().join(', ')))}
${idiomas ? kv('Idiomas', esc(idiomas.linhas[0])) : ''}
${kv('Contato', mail())}
<p class="l t-paleta" aria-hidden="true">${Array.from({ length: 8 }, (_, i) => `<span style="--i:${i}"></span>`).join('')}</p>
</div>
</div>`;
}

/* -------------------------------------------------------------- comandos */

export interface InfoComando {
  nome: string;
  aliases: string[];
  uso?: string;
  desc: string;
  /** aparece no help */
  ajuda?: boolean;
}

export const COMANDOS: InfoComando[] = [
  { nome: 'help', aliases: ['ajuda', 'man', '?'], desc: 'lista os comandos', ajuda: true },
  { nome: 'sobre', aliases: ['whoami', 'about'], desc: 'quem é o Caio', ajuda: true },
  { nome: 'projetos', aliases: ['projects'], desc: 'projetos em destaque', ajuda: true },
  { nome: 'projeto', aliases: ['project'], uso: 'projeto <id>', desc: 'detalhes de um projeto', ajuda: true },
  { nome: 'stack', aliases: ['skills'], desc: 'linguagens, frameworks e ferramentas', ajuda: true },
  { nome: 'trajetoria', aliases: ['trajetória', 'experiencia', 'experience', 'carreira'], desc: 'experiência e formação', ajuda: true },
  { nome: 'contato', aliases: ['contact'], desc: 'e-mail, LinkedIn e GitHub', ajuda: true },
  { nome: 'email', aliases: ['e-mail', 'mail'], desc: 'abre seu cliente de e-mail', ajuda: true },
  { nome: 'github', aliases: [], desc: 'abre o GitHub', ajuda: true },
  { nome: 'linkedin', aliases: [], desc: 'abre o LinkedIn', ajuda: true },
  { nome: 'neofetch', aliases: ['fetch'], desc: 'resumo do sistema (e do Caio)', ajuda: true },
  { nome: 'ls', aliases: ['dir'], uso: 'ls [pasta]', desc: 'lista arquivos', ajuda: true },
  { nome: 'cat', aliases: ['less', 'more'], uso: 'cat <arquivo>', desc: 'mostra um arquivo', ajuda: true },
  { nome: 'cd', aliases: [], uso: 'cd <pasta>', desc: 'muda de pasta', ajuda: true },
  { nome: 'pwd', aliases: [], desc: 'mostra a pasta atual', ajuda: true },
  { nome: 'tema', aliases: ['theme'], uso: 'tema <verde|ambar|branco>', desc: 'troca a cor do fósforo', ajuda: true },
  { nome: 'estilos', aliases: ['styles'], desc: 'outros estilos deste site', ajuda: true },
  { nome: 'historico', aliases: ['history', 'histórico'], desc: 'comandos já digitados', ajuda: true },
  { nome: 'clear', aliases: ['limpar', 'cls'], desc: 'limpa a tela (Ctrl+L)', ajuda: true },
  { nome: 'data', aliases: ['date'], desc: 'data e hora', ajuda: true },
  { nome: 'echo', aliases: [], uso: 'echo <texto>', desc: 'repete o texto', ajuda: true },
  { nome: 'conversa', aliases: ['chat'], desc: 'abre o chat do site', ajuda: true },
  { nome: 'sudo', aliases: [], desc: '', ajuda: false },
  { nome: 'exit', aliases: ['sair', 'logout', 'quit'], desc: 'encerra a sessão', ajuda: true },
];

export function help(ctx: Ctx): string {
  const linhas = COMANDOS.filter((c) => c.ajuda).map((c) => {
    const nome = c.uso ?? c.nome;
    const pad = ' '.repeat(Math.max(1, 26 - nome.length));
    const alias = c.aliases.filter((a) => /^[a-z?-]+$/.test(a)).slice(0, 2);
    return l(
      `${cmd(ctx, c.nome, nome)}<span class="t-pad">${pad}</span><span class="t-desc">${esc(c.desc)}${
        alias.length ? ` <span class="t-dim">(${esc(alias.join(', '))})</span>` : ''
      }</span>`,
      't-tab',
    );
  });
  return [
    l('<span class="t-hl">caiobasf-sh</span>, versão 4.0. Comandos disponíveis:'),
    `<div class="t-grade">${linhas.join('')}</div>`,
    l(
      'Atalhos: <kbd>Tab</kbd> completa · <kbd>↑</kbd><kbd>↓</kbd> histórico · <kbd>Ctrl</kbd>+<kbd>L</kbd> limpa · <kbd>Esc</kbd> pula a animação',
      't-dim',
    ),
  ].join('\n');
}

export function sobreSaida(): string {
  return [
    l(esc(sobre.paragrafo), 't-par'),
    `<dl class="t-dl">${sobre.resumo
      .map(
        (r) =>
          `<div class="l"><dt>${esc(r.rotulo)}</dt><dd>${r.linhas.map((x) => esc(x)).join('<br />')}</dd></div>`,
      )
      .join('')}</dl>`,
  ].join('\n');
}

function projetoCorpo(p: (typeof projetos)[number]): string {
  return [
    l(`<span class="t-dim">${esc(p.meta.join(' · '))}</span>`),
    l(p.tags.map((t) => `<span class="t-tag">${esc(t)}</span>`).join(' '), 't-tags'),
    `<ul class="t-lista">${p.itens.map((i) => `<li class="l">${esc(i)}</li>`).join('')}</ul>`,
    p.links.length ? l(p.links.map((x) => ext(x.url, x.rotulo)).join(' · ')) : '',
  ].join('\n');
}

/** detalhe completo de um projeto */
export function projeto(id: string, nivel = 3): string {
  const p = projetos.find((x) => x.id === id);
  if (!p) return '';
  return `<article class="t-proj" id="proj-${esc(p.id)}">
<h${nivel} class="l t-proj-tit"><span class="t-amb">[${esc(p.codigo)}]</span> ${esc(p.nome)}</h${nivel}>
${projetoCorpo(p)}
</article>`;
}

/** lista compacta (shell) ou completa (sessão gravada) */
export function projetosSaida(ctx: Ctx, completo = false): string {
  if (completo) return projetos.map((p) => projeto(p.id)).join('\n');
  return [
    l(`${projetos.length} projetos encontrados em <span class="t-d">~/projetos</span>:`, 't-dim'),
    ...projetos.map(
      (p) => `<article class="t-proj">
<h3 class="l t-proj-tit"><span class="t-amb">[${esc(p.codigo)}]</span> ${esc(p.nome)}</h3>
${l(`<span class="t-dim">${esc(p.meta.join(' · '))}</span>`)}
${l(p.tags.map((t) => `<span class="t-tag">${esc(t)}</span>`).join(' '), 't-tags')}
${l(esc(p.itens[0]), 't-par')}
${l(`detalhes: ${cmd(ctx, `projeto ${p.id}`)}`)}
</article>`,
    ),
  ].join('\n');
}

export function stackSaida(): string {
  const total = stack.reduce((n, g) => n + g.itens.length, 0);
  return [
    l(`${total} pacotes instalados em ${stack.length} grupos.`, 't-dim'),
    ...stack.map(
      (g) => `<div class="t-grupo">
${l(`<span class="t-amb">${esc(g.grupo)}</span> <span class="t-dim">(${g.itens.length})</span>`, 't-grupo-tit')}
<ul class="t-pacotes l">${g.itens.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
</div>`,
    ),
  ].join('\n');
}

export function trajetoriaSaida(): string {
  return [
    l('<span class="t-dim">$ git log --carreira</span>'),
    ...trajetoria.map(
      (t, i) => `<article class="t-commit">
<h3 class="l t-commit-tit"><span class="t-amb">commit ${hash(t.cargo + t.periodo)}</span>${
        i === 0 ? ' <span class="t-hl">(HEAD -&gt; carreira)</span>' : ''
      }</h3>
${l(`<span class="t-k">Período</span>: ${esc(t.periodo)}`)}
${l(`<span class="t-k">Onde</span>:    ${esc(t.lugar)}`)}
${l(`<strong class="t-cargo">${esc(t.cargo)}</strong>`, 't-ind')}
${t.itens.length ? `<ul class="t-lista t-ind">${t.itens.map((x) => `<li class="l">${esc(x)}</li>`).join('')}</ul>` : ''}
</article>`,
    ),
  ].join('\n');
}

export function contatoSaida(ctx: Ctx): string {
  const linha = (k: string, v: string) =>
    l(`<span class="t-k t-k-larg">${esc(k)}</span>${v}`, 't-tab');
  return [
    linha('E-mail', mail()),
    linha('LinkedIn', ext(contato.linkedin.url, contato.linkedin.rotulo)),
    linha('GitHub', ext(contato.github.url, contato.github.rotulo)),
    linha('Conversa', `<a href="/conversa">/conversa</a> <span class="t-dim">(chat sobre o currículo)</span>`),
    l(`Dica: ${cmd(ctx, 'email')} abre seu cliente de e-mail já endereçado.`, 't-dim'),
  ].join('\n');
}

export function estilosSaida(atual = 'terminal'): string {
  return [
    l('Este site troca de pele inteira. Estilos disponíveis:', 't-dim'),
    ...ESTILOS.map((e) => {
      const marca = e.id === atual ? ' <span class="t-hl">(você está aqui)</span>' : '';
      return l(
        `<span class="t-dim">${esc(e.numero)}</span> <a href="${esc(e.href)}">${esc(e.nome)}</a>${marca} <span class="t-dim">· ${esc(
          e.descricao,
        )}</span>`,
      );
    }),
  ].join('\n');
}

/* ------------------------------------------------- sistema de arquivos */

export interface Arquivo {
  nome: string;
  /** comando equivalente cuja saída é o conteúdo */
  conteudo: (ctx: Ctx) => string;
  oculto?: boolean;
}

export const ARQUIVOS: Record<string, Arquivo[]> = {
  '~': [
    { nome: 'leia-me.txt', conteudo: () => l('Bem-vindo! Comece por <span class="t-hl">help</span>. Os arquivos aqui são o currículo do Caio em texto puro.') },
    { nome: 'sobre.txt', conteudo: () => sobreSaida() },
    { nome: 'contato.txt', conteudo: (c) => contatoSaida(c) },
    { nome: 'stack.txt', conteudo: () => stackSaida() },
    { nome: 'trajetoria.log', conteudo: () => trajetoriaSaida() },
    { nome: '.segredo', oculto: true, conteudo: () => l('Café é uma dependência de produção. Não conte para ninguém.', 't-amb') },
  ],
  '~/projetos': projetos.map((p) => ({ nome: `${p.id}.md`, conteudo: () => projeto(p.id) })),
};

export const PASTAS = ['~', '~/projetos'];

/* ---------------------------------------------- sessão gravada (sem JS) */

export function blocoGravado(comando: string, corpo: string, id = ancora(comando)): string {
  return `<section class="t-bloco" aria-labelledby="${id}">
<h2 class="t-eco" id="${id}">${ps1()} <span class="t-eco-cmd">${esc(comando)}</span></h2>
<div class="t-out">${corpo}</div>
</section>`;
}

export function sessaoGravada(): string {
  const ctx: Ctx = { js: false };
  return [
    blocoGravado('neofetch', neofetch()),
    blocoGravado('whoami', sobreSaida(), ancora('sobre')),
    blocoGravado('projetos', projetosSaida(ctx, true)),
    blocoGravado('stack', stackSaida()),
    blocoGravado('trajetoria', trajetoriaSaida()),
    blocoGravado('contato', contatoSaida(ctx)),
  ].join('\n');
}
