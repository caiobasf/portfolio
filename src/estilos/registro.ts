/**
 * Registro dos estilos do site. Cada estilo é uma página completa com layout,
 * tipografia e animações próprios, lendo o mesmo conteúdo de src/content/perfil.ts.
 *
 * O botão de troca (StyleSwitcher) lê esta lista. A escolha fica salva em
 * localStorage (ESTILO_STORAGE_KEY); a landing "/" redireciona para o estilo salvo.
 */

export interface Estilo {
  id: string;
  /** número exibido no seletor */
  numero: string;
  nome: string;
  /** uma linha: o que é o estilo */
  descricao: string;
  /** referência de onde a linguagem vem */
  referencia: string;
  href: string;
  /** cores para a amostra no seletor: [fundo, texto, destaque] */
  amostra: readonly [string, string, string];
  /** cor da barra do navegador */
  themeColor: string;
}

export const ESTILO_STORAGE_KEY = 'cf-estilo';
export const ESTILO_ORIGINAL = 'scanner';

export const ESTILOS: readonly Estilo[] = [
  {
    id: 'scanner',
    numero: '00',
    nome: 'Scanner',
    descricao: 'O original: grade técnica, marcas de calibração e chat.',
    referencia: 'Design de impressão técnica',
    href: '/',
    amostra: ['#f4f3ef', '#16161a', '#e5322d'],
    themeColor: '#f4f3ef',
  },
  {
    id: 'cyberpunk',
    numero: '01',
    nome: 'Cyberpunk',
    descricao: 'HUD neon, glitch, painéis chanfrados e chuva de dados.',
    referencia: 'Ficção cyberpunk, interfaces de HUD',
    href: '/estilo/cyberpunk/',
    amostra: ['#07060d', '#f5f0ff', '#fcee0a'],
    themeColor: '#07060d',
  },
  {
    id: 'executivo',
    numero: '02',
    nome: 'Executivo',
    descricao: 'Relatório anual: serifa, azul-marinho, números em destaque.',
    referencia: 'Relatórios de consultoria e bancos',
    href: '/estilo/executivo/',
    amostra: ['#f7f5f0', '#0d1b2a', '#b08d57'],
    themeColor: '#0d1b2a',
  },
  {
    id: 'pixel',
    numero: '03',
    nome: 'Pixel RPG',
    descricao: 'Tela de título, caixas de diálogo, atributos e inventário em 8 bits.',
    referencia: 'RPGs de 8 e 16 bits',
    href: '/estilo/pixel/',
    amostra: ['#1a1c2c', '#f4f4f4', '#ffcd75'],
    themeColor: '#1a1c2c',
  },
  {
    id: 'terminal',
    numero: '04',
    nome: 'Terminal',
    descricao: 'Shell interativo em fósforo verde: digite help.',
    referencia: 'Terminais CRT e linha de comando',
    href: '/estilo/terminal/',
    amostra: ['#030a04', '#7dff9b', '#ffb000'],
    themeColor: '#030a04',
  },
  {
    id: 'brutalista',
    numero: '05',
    nome: 'Neo-brutalista',
    descricao: 'Bordas grossas, sombras duras, cores berrantes e adesivos.',
    referencia: 'Neo-brutalismo / anti-design',
    href: '/estilo/brutalista/',
    amostra: ['#fffbea', '#000000', '#ff5ca8'],
    themeColor: '#ffd23f',
  },
  {
    id: 'suico',
    numero: '06',
    nome: 'Suíço',
    descricao: 'Estilo Tipográfico Internacional: grade, tipo gigante, vermelho.',
    referencia: 'Müller-Brockmann, design suíço dos anos 50–60',
    href: '/estilo/suico/',
    amostra: ['#f2f0eb', '#111111', '#e30613'],
    themeColor: '#f2f0eb',
  },
  {
    id: 'bento',
    numero: '07',
    nome: 'Bento',
    descricao: 'Moderno: grade de cartões, vidro, gradientes e rolagem suave.',
    referencia: 'Páginas de produto modernas, bento grids',
    href: '/estilo/bento/',
    amostra: ['#0a0a0b', '#ededed', '#8b7bff'],
    themeColor: '#0a0a0b',
  },
  {
    id: 'desktop',
    numero: '08',
    nome: 'Desktop 98',
    descricao: 'Um sistema operacional dos anos 90 com janelas que se arrastam.',
    referencia: 'Interfaces de desktop dos anos 90',
    href: '/estilo/desktop/',
    amostra: ['#008080', '#000000', '#c0c0c0'],
    themeColor: '#008080',
  },
  {
    id: 'jornal',
    numero: '09',
    nome: 'Jornal',
    descricao: 'Primeira página de jornal impresso: manchete, colunas e capitulares.',
    referencia: 'Jornais broadsheet',
    href: '/estilo/jornal/',
    amostra: ['#f1ead8', '#1b1712', '#8a1c1c'],
    themeColor: '#f1ead8',
  },
  {
    id: 'caderno',
    numero: '10',
    nome: 'Caderno',
    descricao: 'Folha pautada, letra à mão, rabiscos e post-its.',
    referencia: 'Cadernos de esboço e anotações',
    href: '/estilo/caderno/',
    amostra: ['#fdfbf4', '#22304a', '#ffe066'],
    themeColor: '#fdfbf4',
  },
];

export const ESTILO_IDS = ESTILOS.map((e) => e.id);

export function estiloPorId(id: string): Estilo {
  const e = ESTILOS.find((x) => x.id === id);
  if (!e) throw new Error(`Estilo desconhecido: ${id}`);
  return e;
}
