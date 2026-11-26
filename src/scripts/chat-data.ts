/**
 * Respostas prontas e regras de reconhecimento do chat (/conversa).
 * Sem IA e sem backend. Os textos vêm de content/perfil.ts sempre que possível.
 */
import { contato, sobre, stack } from '../content/perfil';

export type Topico =
  | 'voltar'
  | 'telefone'
  | 'contato'
  | 'libralizei'
  | 'oracle'
  | 'ia'
  | 'concentrix'
  | 'projetos'
  | 'experiencia'
  | 'formacao'
  | 'stack'
  | 'idiomas'
  | 'sobre'
  | 'oi'
  | 'fallback';

/** Item de lista: texto simples ou link (ex.: canais de contato). */
export type ItemLista = string | { prefixo: string; rotulo: string; href: string; externo?: boolean };

export interface Resposta {
  sys: string;
  /** Parágrafo inicial */
  texto?: string;
  /** Lista (renderizada como <ul>) */
  lista?: ItemLista[];
  /** Parágrafo depois da lista */
  depois?: string;
}

/* ---------- Reconhecimento ---------- */

/** A ordem importa: a primeira regra que bater vence. */
export const regras: ReadonlyArray<readonly [Topico, readonly string[]]> = [
  ['voltar', ['voltar', 'portfolio', 'inicio', 'landing', 'sair']],
  ['telefone', ['telefone', 'whatsapp', 'celular', 'numero', 'ligar']],
  [
    'contato',
    [
      'contato', 'contatar', 'email', 'e-mail', 'linkedin', 'github', 'curriculo', 'cv',
      'contratar', 'vaga', 'oportunidade', 'falar', 'mensagem',
    ],
  ],
  ['libralizei', ['libralizei', 'libras', 'tcc', 'mediapipe', 'gesto', 'sinais']],
  ['oracle', ['oracle', 'dashboard', 'realidade aumentada', 'pitch', 'oac']],
  ['ia', ['ia', 'inteligencia', 'claude', 'deepseek', 'codex', 'kimi', 'opencode', 'agente', 'mcp']],
  ['concentrix', ['concentrix', 'planilha', 'powerpoint', 'operacoes']],
  ['projetos', ['projeto', 'destaque', 'fez', 'fiz']],
  [
    'experiencia',
    [
      'experiencia', 'the led', 'empresa', 'trabalho', 'trabalha', 'holerite', 'docusign', 'totvs',
      'rd station', 'ci/cd', 'pipeline', 'next', 'aprendiz', 'carreira',
    ],
  ],
  ['formacao', ['formacao', 'etec', 'escola', 'estudo', 'estuda', 'curso', 'educacao', 'faculdade']],
  [
    'stack',
    [
      'stack', 'tecnologia', 'linguage', // radical: linguagem e linguagens
      'ferramenta', 'skill', 'habilidade', 'framework', 'teste',
      'python', 'typescript', 'react', 'docker',
    ],
  ],
  ['idiomas', ['idioma', 'ingles', 'portugues']],
  ['sobre', ['sobre', 'quem', 'apresent', 'voce']],
  ['oi', ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'e ai', 'opa']],
];

/** Minúsculas e sem acentos. */
export const normalizar = (texto: string): string =>
  texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Palavras-chave com até 3 caracteres só valem como palavra inteira. */
const bate = (texto: string, chave: string): boolean =>
  chave.length <= 3 ? new RegExp(`\\b${escapeRegex(chave)}\\b`).test(texto) : texto.includes(chave);

export function reconhecer(entrada: string): Topico {
  const t = normalizar(entrada);
  for (const [topico, chaves] of regras) {
    if (chaves.some((k) => bate(t, k))) return topico;
  }
  return 'fallback';
}

/* ---------- Chips ---------- */

export const chips: ReadonlyArray<readonly [Topico, string]> = [
  ['sobre', 'Quem é você?'],
  ['experiencia', 'Experiência'],
  ['projetos', 'Projetos'],
  ['stack', 'Stack'],
  ['formacao', 'Formação'],
  ['ia', 'Uso de IA'],
  ['contato', 'Contato'],
];

/* ---------- Respostas ---------- */

const canais: ItemLista[] = [
  { prefixo: 'e-mail: ', rotulo: contato.email, href: `mailto:${contato.email}` },
  { prefixo: 'LinkedIn: ', rotulo: contato.linkedin.rotulo, href: contato.linkedin.url, externo: true },
  { prefixo: 'GitHub: ', rotulo: contato.github.rotulo, href: contato.github.url, externo: true },
];

/** "A, B e C" */
const juntar = (itens: string[]): string =>
  itens.length < 2 ? itens.join('') : `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`;

const grupo = (nome: string) => stack.find((g) => g.grupo === nome)?.itens ?? [];

const linhaStack = (nome: string, rotulo = nome) =>
  `${rotulo}: ${juntar(grupo(nome).map((i) => i.replace('SQL (Postgres, MySQL)', 'SQL (Postgres e MySQL)')))}.`;

export const respostas: Record<Topico, Resposta> = {
  sobre: {
    sys: 'consultando: perfil',
    texto: sobre.paragrafo,
  },
  experiencia: {
    sys: 'consultando: experiência',
    texto: 'Desde maio de 2026 sou Jovem Aprendiz de TI na THE LED. Por lá:',
    lista: [
      'arquitetei uma plataforma web em Next.js, TypeScript e PostgreSQL, com mais de 100 usuários ativos simultâneos;',
      'automatizei o envio de mais de 400 holerites por mês pela API do Microsoft Graph;',
      'integrei DocuSign, TOTVS e RD Station;',
      'montei um pipeline de CI/CD e um revisor automático de Pull Requests com DeepSeek.',
    ],
    depois: 'Se quiser, pergunta também da Concentrix.',
  },
  concentrix: {
    sys: 'consultando: experiência anterior',
    texto:
      'De fevereiro a maio de 2026 fui Jovem Aprendiz de Operações na Concentrix. Estruturei e automatizei planilhas com fórmulas avançadas, fiz apresentações executivas em PowerPoint e desenvolvi projetos internos para melhorar a comunicação entre equipes.',
  },
  projetos: {
    sys: 'consultando: projetos',
    texto: 'Tenho dois projetos em destaque:',
    lista: [
      'Libralizei, meu TCC: plataforma web para o ensino básico de LIBRAS, com reconhecimento de gestos pela câmera.',
      'Oracle Discovery Data: dashboards em Python e Oracle Analytics Cloud para um protótipo de app de realidade aumentada.',
    ],
    depois: 'Pergunta por um deles para ver os detalhes.',
  },
  libralizei: {
    sys: 'consultando: projeto Libralizei',
    texto:
      'O Libralizei é uma plataforma web full stack, feita em equipe, para o ensino básico de LIBRAS. Modelei o banco em PostgreSQL com queries SQL puras e integrei o MediaPipe para reconhecer gestos pela câmera em tempo real, melhorando a precisão do reconhecimento de sinais em até 75% dos casos.',
    depois: 'Stack: TypeScript, Next.js, Node.js, React e PostgreSQL.',
  },
  oracle: {
    sys: 'consultando: projeto Oracle Discovery Data',
    texto:
      'No Oracle Discovery Data, em setembro de 2024, integrei Python ao Oracle Analytics Cloud para criar dashboards interativos com mais de 1.000 dados reais, apoiando um protótipo de app de realidade aumentada para exercícios físicos. Também apresentei o pitch no palco da Oracle, para representantes da empresa.',
  },
  stack: {
    sys: 'consultando: stack',
    lista: [linhaStack('Linguagens'), linhaStack('Frameworks'), linhaStack('Testes'), linhaStack('Ferramentas')],
  },
  ia: {
    sys: 'consultando: uso de IA',
    texto: `Uso ${juntar(grupo('IAs'))} no dia a dia. Na THE LED, construí workflows de agentes e MCPs com o Claude Code e um revisor automático de Pull Requests com DeepSeek.`,
  },
  formacao: {
    sys: 'consultando: formação',
    texto:
      'Fiz o Ensino Médio Técnico em Desenvolvimento de Sistemas na ETEC Abdias do Nascimento, em São Paulo, de janeiro de 2023 a dezembro de 2025.',
  },
  idiomas: {
    sys: 'consultando: idiomas',
    texto: 'Inglês avançado e português nativo.',
  },
  contato: {
    sys: 'consultando: contato',
    texto: 'Me chama por:',
    lista: canais,
  },
  telefone: {
    sys: 'consultando: contato',
    texto: 'Telefone eu prefiro não deixar aberto por aqui. Pelos canais abaixo eu respondo:',
    lista: canais,
  },
  voltar: {
    sys: 'abrindo: portfólio',
    texto: 'Beleza, te levando de volta ao portfólio.',
  },
  oi: {
    sys: 'saudação detectada',
    texto: 'Oi! Pergunta pelos botões ou escreve algo como “projetos”, “stack” ou “experiência”.',
  },
  fallback: {
    sys: 'comando não reconhecido',
    texto: 'Essa eu ainda não sei responder por aqui. Tenta um dos botões ou escreve algo como “projetos”, “stack” ou “contato”.',
  },
};

export const mensagensIniciais = {
  sys: 'conexão aberta. interface de conversa pronta.',
  caio: 'Oi! Eu sou o Caio. Pergunta pelos botões aqui embaixo ou escreve o que quiser, tipo “projetos”, “stack” ou “experiência”.',
};
