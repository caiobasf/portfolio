/**
 * Paletas de cor — ÚNICA fonte de cores do site.
 *
 * Daqui saem: as variáveis CSS (`html[data-palette="…"]`, geradas em Base.astro),
 * o mapa de `theme-color` do script do <head> e o teste de contraste
 * (tests/unit/contrast.test.ts). Para mexer numa cor, mude só aqui e rode
 * `npm run test:unit`: o teste falha se algum par de texto cair abaixo do mínimo.
 *
 * Variáveis derivadas (grade, faixa alternada, header translúcido) ficam em
 * tokens.css e são calculadas com color-mix a partir destas.
 */

export const PALETTE_IDS = ['scanner', 'escuro', 'vermelho', 'mono'] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];

/** Sem escolha salva. */
export const DEFAULT_PALETTE: PaletteId = 'scanner';
/** Sem escolha salva e sistema em modo escuro (prefers-color-scheme: dark). */
export const DEFAULT_DARK_PALETTE: PaletteId = 'escuro';
/** Chave do localStorage. */
export const PALETTE_STORAGE_KEY = 'cf-palette';

/** Cores da tabela da spec 2 (§3.2). */
export interface PaletteColors {
  bg: string;
  surface: string;
  line: string;
  /** contorno de campos e botões (≥ 3:1) */
  'line-strong': string;
  text: string;
  'text-2': string;
  'text-3': string;
  /** fundos, bordas, texto grande */
  accent: string;
  /** vermelho de texto pequeno (≥ 4,5:1) */
  'accent-text': string;
  /** texto sobre --accent */
  'on-accent': string;
  /** blocos de pixel */
  'accent-dark': string;
  /** pixels de ruído */
  noise: string;
  'band-bg': string;
  'band-fg': string;
  'band-line': string;
  'mosaic-1': string;
  'mosaic-2': string;
  'mosaic-3': string;
  'mosaic-4': string;
  'mosaic-5': string;
}

/** Efeitos que mudam de natureza entre claro e escuro (não dá para derivar só com color-mix). */
export interface PaletteEffects {
  /** listras de 1px das scanlines */
  scanline: string;
  /** brilho do hero, canto superior direito */
  'glow-a': string;
  /** brilho do hero, canto inferior esquerdo */
  'glow-b': string;
}

export interface Palette {
  nome: string;
  scheme: 'light' | 'dark';
  cores: PaletteColors;
  efeitos: PaletteEffects;
}

const efeitosClaros: PaletteEffects = {
  scanline: 'color-mix(in srgb, var(--text) 4%, transparent)',
  'glow-a': 'color-mix(in srgb, var(--accent) 7%, transparent)',
  'glow-b': 'color-mix(in srgb, var(--line) 45%, transparent)',
};

export const palettes: Record<PaletteId, Palette> = {
  scanner: {
    nome: 'Scanner (claro)',
    scheme: 'light',
    cores: {
      bg: '#F4F5F4',
      surface: '#FFFFFF',
      line: '#C9CFD1',
      'line-strong': '#7B878C',
      text: '#0A0D0F',
      'text-2': '#30434B',
      'text-3': '#566970',
      accent: '#C0091A',
      'accent-text': '#B30814',
      'on-accent': '#F1F4F5',
      'accent-dark': '#8B0D16',
      noise: '#9AA4A8',
      'band-bg': '#0A0D0F',
      'band-fg': '#9AA4A8',
      'band-line': 'rgba(228, 233, 235, 0.88)',
      'mosaic-1': '#F4F5F4',
      'mosaic-2': '#E6E9EA',
      'mosaic-3': '#C9CFD1',
      'mosaic-4': '#F4F5F4',
      'mosaic-5': '#DADFE0',
    },
    efeitos: efeitosClaros,
  },
  escuro: {
    nome: 'Teal escuro',
    scheme: 'dark',
    cores: {
      bg: '#010204',
      surface: '#05181E',
      line: '#1A2B32',
      'line-strong': '#5B6D74',
      text: '#C5CDD1',
      'text-2': '#A8B3B8',
      'text-3': '#8B999F',
      accent: '#C0091A',
      'accent-text': '#E5484F',
      'on-accent': '#F1F4F5',
      'accent-dark': '#8B0D16',
      noise: '#5F7078',
      'band-bg': '#08232B',
      'band-fg': '#9AA8AE',
      'band-line': 'rgba(197, 205, 209, 0.9)',
      'mosaic-1': '#010204',
      'mosaic-2': '#05181E',
      'mosaic-3': '#1A2B32',
      'mosaic-4': '#010204',
      'mosaic-5': '#08232B',
    },
    efeitos: {
      scanline: 'rgb(0 0 0 / 0.16)',
      'glow-a': 'color-mix(in srgb, var(--accent-dark) 22%, transparent)',
      'glow-b': 'color-mix(in srgb, var(--band-bg) 90%, transparent)',
    },
  },
  vermelho: {
    nome: 'Vermelho escuro',
    scheme: 'dark',
    cores: {
      bg: '#0C0204',
      surface: '#1A0508',
      line: '#3A0E14',
      'line-strong': '#8A5A60',
      text: '#F1E8E8',
      'text-2': '#CDB8BA',
      'text-3': '#A88F92',
      accent: '#E01A2B',
      'accent-text': '#FF6B73',
      'on-accent': '#FFFFFF',
      'accent-dark': '#8B0D16',
      noise: '#7A3B41',
      'band-bg': '#1A0508',
      'band-fg': '#C9A5A9',
      'band-line': 'rgba(241, 200, 204, 0.85)',
      'mosaic-1': '#0C0204',
      'mosaic-2': '#1A0508',
      'mosaic-3': '#3A0E14',
      'mosaic-4': '#0C0204',
      'mosaic-5': '#240710',
    },
    efeitos: {
      scanline: 'rgb(0 0 0 / 0.2)',
      'glow-a': 'color-mix(in srgb, var(--accent-dark) 30%, transparent)',
      'glow-b': 'color-mix(in srgb, var(--surface) 90%, transparent)',
    },
  },
  mono: {
    nome: 'Monocromático',
    scheme: 'light',
    cores: {
      bg: '#ECEEEE',
      surface: '#FAFAFA',
      line: '#CBD0D2',
      'line-strong': '#7B878C',
      text: '#0A0D0F',
      'text-2': '#30434B',
      'text-3': '#566970',
      accent: '#1A2B32',
      'accent-text': '#1A2B32',
      'on-accent': '#F4F5F4',
      'accent-dark': '#30434B',
      noise: '#9AA4A8',
      'band-bg': '#1A2B32',
      'band-fg': '#B8C2C7',
      'band-line': 'rgba(228, 233, 235, 0.88)',
      'mosaic-1': '#ECEEEE',
      'mosaic-2': '#DFE2E3',
      'mosaic-3': '#CBD0D2',
      'mosaic-4': '#ECEEEE',
      'mosaic-5': '#D5D9DA',
    },
    efeitos: efeitosClaros,
  },
};

/**
 * Fundos derivados: `pct`% de `mix` dentro de `base` (color-mix in srgb).
 * Ficam aqui, e não em tokens.css, porque recebem texto: o teste de contraste
 * calcula a mesma mistura e confere o texto sobre eles também.
 */
export const derivedBackgrounds = {
  /** faixas alternadas (Projetos, Trajetória, chat, 404) */
  'bg-alt': { mix: 'text', pct: 4.5, base: 'bg' },
} as const satisfies Record<string, { mix: keyof PaletteColors; pct: number; base: keyof PaletteColors }>;

export const isPaletteId = (v: unknown): v is PaletteId =>
  typeof v === 'string' && (PALETTE_IDS as readonly string[]).includes(v);

function declarations(p: Palette): string {
  const vars = [...Object.entries(p.cores), ...Object.entries(p.efeitos)]
    .map(([k, v]) => `--${k}:${v};`)
    .join('');
  return `color-scheme:${p.scheme};${vars}`;
}

/**
 * CSS de todas as paletas. A padrão também vale sem atributo (sem JavaScript);
 * sem JavaScript e com o sistema escuro, vale a paleta escura padrão.
 */
export function paletteCss(): string {
  const derived = Object.entries(derivedBackgrounds)
    .map(([k, d]) => `--${k}:color-mix(in srgb,var(--${d.mix}) ${d.pct}%,var(--${d.base}));`)
    .join('');
  const rules = [`:root{${derived}}`];
  rules.push(...PALETTE_IDS.map((id) => {
    const sel = id === DEFAULT_PALETTE ? `:root,html[data-palette="${id}"]` : `html[data-palette="${id}"]`;
    return `${sel}{${declarations(palettes[id])}}`;
  }));
  rules.push(
    `@media (prefers-color-scheme: dark){:root:not([data-palette]){${declarations(palettes[DEFAULT_DARK_PALETTE])}}}`,
  );
  return rules.join('\n');
}

/** Fundo de cada paleta, para o <meta name="theme-color">. */
export const themeColors = (): Record<PaletteId, string> =>
  Object.fromEntries(PALETTE_IDS.map((id) => [id, palettes[id].cores.bg])) as Record<PaletteId, string>;
