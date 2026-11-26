/**
 * Fonte única de todo o texto do currículo.
 * Landing e chat leem daqui; não duplicar texto em componentes.
 *
 * PRIVACIDADE: nenhum telefone neste arquivo nem em lugar nenhum do site.
 */

export const pessoa = {
  nome: 'Caio',
  sobrenome: 'Ferreira',
  nomeCompleto: 'Caio Ferreira',
  apelido: 'caiobasf',
  cargo: 'Desenvolvedor Full Stack',
  local: 'São Paulo, SP',
  status: 'Aberto a oportunidades',
} as const;

export const contato = {
  email: 'caiobasff@gmail.com',
  linkedin: {
    url: 'https://linkedin.com/in/caiobasf',
    rotulo: 'linkedin.com/in/caiobasf',
  },
  github: {
    url: 'https://github.com/caiobasf',
    rotulo: 'github.com/caiobasf',
  },
} as const;

/**
 * Caminho do PDF do currículo em public/.
 * O botão só aparece se o arquivo existir (ver Sobre). O PDF precisa ser uma
 * versão SEM telefone; nunca copiar o curriculo-1.pdf original para public/.
 */
export const curriculoPdf = '/curriculo-caio-ferreira.pdf';

export const sobre = {
  paragrafo:
    'Sou o Caio, desenvolvedor de São Paulo. Fiz o Ensino Médio Técnico em Desenvolvimento de Sistemas na ETEC Abdias do Nascimento e hoje sou Jovem Aprendiz de TI na THE LED, onde arquiteto e desenvolvo sistemas e integrações para os principais setores da empresa.',
  resumo: [
    { rotulo: 'Agora', linhas: ['Jovem Aprendiz de TI · THE LED', 'Mai 2026 – Presente'] },
    {
      rotulo: 'Formação',
      linhas: ['Técnico em Desenvolvimento de Sistemas', 'ETEC Abdias do Nascimento · 2023 – 2025'],
    },
    { rotulo: 'Idiomas', linhas: ['Inglês (avançado) · Português (nativo)'] },
  ],
} as const;

/** Pares do subtítulo animado "Eu construo [A] para [B]." */
export const construo: ReadonlyArray<readonly [string, string]> = [
  ['plataformas', 'equipes'],
  ['integrações', 'empresas'],
  ['automações', 'setores'],
  ['pipelines', 'desenvolvedores'],
  ['dashboards', 'decisões'],
];

export interface Projeto {
  id: string;
  codigo: string;
  meta: string[];
  nome: string;
  tags: string[];
  itens: string[];
  /** Links opcionais (repositório, demo). Vazio enquanto o Caio não informar. */
  links: { rotulo: string; url: string }[];
}

export const projetos: Projeto[] = [
  {
    id: 'libralizei',
    codigo: 'PROJ.01',
    meta: ['TCC', 'Jan – Dez 2025', 'Em equipe'],
    nome: 'Libralizei',
    tags: ['TypeScript', 'Next.js', 'Node.js', 'React', 'PostgreSQL', 'MediaPipe'],
    itens: [
      'Plataforma web full stack voltada ao ensino básico de LIBRAS (Língua Brasileira de Sinais).',
      'Banco de dados modelado em PostgreSQL com queries SQL puras, guardando o conteúdo didático e o progresso dos usuários.',
      'MediaPipe integrado para reconhecer gestos em LIBRAS pela câmera em tempo real, melhorando a precisão do reconhecimento de sinais em até 75% dos casos.',
    ],
    links: [],
  },
  {
    id: 'oracle',
    codigo: 'PROJ.02',
    meta: ['Set 2024'],
    nome: 'Oracle Discovery Data',
    tags: ['Python', 'OAC', 'MySQL'],
    itens: [
      'Python integrado ao Oracle Analytics Cloud (OAC) para criar dashboards interativos com mais de 1.000 dados reais.',
      'Apoio a um protótipo de aplicativo de realidade aumentada para auxiliar em exercícios físicos.',
      'Pitch do protótipo apresentado no palco da Oracle, para representantes da empresa.',
    ],
    links: [],
  },
];

export const stack: { grupo: string; itens: string[] }[] = [
  {
    grupo: 'Linguagens',
    itens: ['Python', 'TypeScript', 'C/C++', 'SQL (Postgres, MySQL)', 'JavaScript', 'HTML/CSS'],
  },
  { grupo: 'Frameworks', itens: ['React', 'Node.js', 'Express', 'Next.js', 'MediaPipe'] },
  { grupo: 'Testes', itens: ['Playwright', 'React Testing Library'] },
  {
    grupo: 'Ferramentas',
    itens: ['Git', 'GitHub', 'GitHub Actions', 'Docker', 'VS Code', 'Visual Studio', 'PyCharm'],
  },
  { grupo: 'IAs', itens: ['Claude Code', 'DeepSeek', 'Codex', 'Kimi', 'OpenCode'] },
  { grupo: 'Idiomas', itens: ['Inglês (avançado)', 'Português (nativo)'] },
];

export interface EtapaTrajetoria {
  periodo: string;
  cargo: string;
  lugar: string;
  itens: string[];
}

export const trajetoria: EtapaTrajetoria[] = [
  {
    periodo: 'Mai 2026 – Presente',
    cargo: 'Jovem Aprendiz de TI',
    lugar: 'THE LED Oficial, São Paulo, SP',
    itens: [
      'Arquitetei e desenvolvi uma plataforma web em Next.js, TypeScript e PostgreSQL, com mais de 100 usuários ativos simultâneos.',
      'Automatizei o processamento e o envio de mais de 400 holerites por mês pela API do Microsoft Graph.',
      'Integrei a API da DocuSign para documentos e contratos e centralizei dados do ERP (TOTVS) e do RD Station para os principais setores.',
      'Implementei um pipeline de CI/CD com validação automática antes do deploy e documentei a arquitetura e os fluxos de integração.',
      'Desenvolvi um revisor automático de Pull Requests com o DeepSeek e construí workflows de agentes e MCPs com o Claude Code.',
    ],
  },
  {
    periodo: 'Fev 2026 – Mai 2026',
    cargo: 'Jovem Aprendiz de Operações',
    lugar: 'Concentrix, São Paulo, SP',
    itens: [
      'Estruturei e automatizei planilhas com fórmulas avançadas, validação de dados e recursos de visualização para apoiar decisões.',
      'Desenvolvi apresentações executivas em PowerPoint seguindo as diretrizes de comunicação da empresa.',
      'Desenvolvi projetos internos para melhorar a comunicação e a colaboração entre equipes.',
    ],
  },
  {
    periodo: 'Jan 2023 – Dez 2025',
    cargo: 'Ensino Médio Técnico em Desenvolvimento de Sistemas',
    lugar: 'ETEC Abdias do Nascimento, São Paulo, SP',
    itens: [],
  },
];

/** Âncoras da navegação (rótulos em caixa alta via CSS). */
export const navegacao = [
  { href: '/#projetos', rotulo: 'Projetos' },
  { href: '/#stack', rotulo: 'Stack' },
  { href: '/#trajetoria', rotulo: 'Trajetória' },
  { href: '/#contato', rotulo: 'Contato' },
] as const;

export const seo = {
  titulo: 'Caio Ferreira — Desenvolvedor Full Stack',
  descricao:
    'Portfólio do Caio Ferreira, desenvolvedor full stack de São Paulo: projetos, stack, trajetória e contato.',
} as const;
