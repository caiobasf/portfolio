/**
 * Ícones do CaioOS: pixel art original 16×16, desenhada em texto e convertida
 * em SVG (um <rect> por trecho horizontal da mesma cor). Exibidos a 1×, 2× ou 3×
 * com shape-rendering="crispEdges" para manter o pixel duro.
 */

const PALETA: Record<string, string> = {
  k: '#000000',
  w: '#ffffff',
  l: '#c0c0c0',
  g: '#808080',
  d: '#404040',
  y: '#f6d65a',
  o: '#c8962c',
  Y: '#fff36b',
  t: '#008080',
  c: '#1c8ad8',
  b: '#000080',
  e: '#2fa84a',
  E: '#1d6e30',
  r: '#d42020',
  p: '#fffbe6',
};

type Mapa = string[];

const texto: Mapa = [
  '..kkkkkkkkk.....',
  '..kwwwwwwwkk....',
  '..kwwwwwwwkwk...',
  '..kwggggwwkwwk..',
  '..kwwwwwwwkkkkk.',
  '..kwwwwwwwwwwwk.',
  '..kwggggggggwwk.',
  '..kwwwwwwwwwwwk.',
  '..kwgggggggggwk.',
  '..kwwwwwwwwwwwk.',
  '..kwggggggwwwwk.',
  '..kwwwwwwwwwwwk.',
  '..kwgggggggggwk.',
  '..kwwwwwwwwwwwk.',
  '..kkkkkkkkkkkkk.',
  '................',
];

const pasta: Mapa = [
  '................',
  '................',
  '.kkkkk..........',
  'koooook.........',
  'kooooookkkkkkkk.',
  'koooooooooooook.',
  'kookkkkkkkkkkkkk',
  'kokwwwwwwwwwwwyk',
  'kokwyyyyyyyyyyyk',
  'kokwyyyyyyyyyyyk',
  'kokwyyyyyyyyyyyk',
  'kokwyyyyyyyyyyyk',
  'kokyyyyyyyyyyyok',
  'kkkkkkkkkkkkkkkk',
  '................',
  '................',
];

const carta: Mapa = [
  '................',
  '................',
  '................',
  'kkkkkkkkkkkkkkkk',
  'kkwwwwwwwwwwwwkk',
  'kwkwwwwwwwwwwkwk',
  'kwwkwwwwwwwwkwwk',
  'kwwwkwwwwwwkwwwk',
  'kwwwwkwwwwkwwwwk',
  'kwwwwwkkkkwwwwwk',
  'kwwwwwwwwwwwwwwk',
  'kwwwwwwwwwwwwwwk',
  'kllllllllllllllk',
  'kkkkkkkkkkkkkkkk',
  '................',
  '................',
];

const lixeira: Mapa = [
  '................',
  '................',
  '......kkkk......',
  '...kkkkkkkkkk...',
  '..kwwllllllllk..',
  '..kkkkkkkkkkkk..',
  '...kwlglglggk...',
  '...kwlglglggk...',
  '...kwlglglggk...',
  '...kwlglglggk...',
  '....kwglglgk....',
  '....kwglglgk....',
  '....kwglglgk....',
  '....kwglglgk....',
  '....kkkkkkkk....',
  '................',
];

const monitor: Mapa = [
  '................',
  '.kkkkkkkkkkkkkk.',
  '.kwwwwwwwwwwwgk.',
  '.kwkkkkkkkkkkgk.',
  '.kwkttwwwwttkgk.',
  '.kwktwwtttttkgk.',
  '.kwktwwtttttkgk.',
  '.kwktwwtttttkgk.',
  '.kwkttwwwwttkgk.',
  '.kwkkkkkkkkkkgk.',
  '.kggggggggggggk.',
  '.kkkkkkkkkkkkkk.',
  '......kggk......',
  '....kkllllkk....',
  '...kllllllllk...',
  '...kkkkkkkkkk...',
];

const lampada: Mapa = [
  '................',
  '.....kkkkk......',
  '....kYYYYYk.....',
  '...kYYwYYYYk....',
  '...kYwYYYYYk....',
  '...kYYYYYYYk....',
  '...kYYYYYYYk....',
  '....kYYYYYk.....',
  '.....kYYYk......',
  '.....kgggk......',
  '.....klllk......',
  '.....kgggk......',
  '......kkk.......',
  '................',
  '................',
  '................',
];

/** Gera um mapa a partir de uma função por pixel e contorna de preto. */
function gerar(pixel: (x: number, y: number) => string | null): Mapa {
  const cheio: (string | null)[][] = [];
  for (let y = 0; y < 16; y++) {
    cheio.push([]);
    for (let x = 0; x < 16; x++) cheio[y].push(pixel(x + 0.5, y + 0.5));
  }
  const vazio = (x: number, y: number) => x < 0 || y < 0 || x > 15 || y > 15 || cheio[y][x] === null;
  return cheio.map((linha, y) =>
    linha
      .map((c, x) => {
        if (c === null) return '.';
        if (vazio(x - 1, y) || vazio(x + 1, y) || vazio(x, y - 1) || vazio(x, y + 1)) return 'k';
        return c;
      })
      .join(''),
  );
}

const engrenagem = gerar((x, y) => {
  const dx = x - 8;
  const dy = y - 8;
  const d = Math.hypot(dx, dy);
  const a = ((Math.atan2(dy, dx) * 180) / Math.PI + 360 + 22.5) % 45;
  const dente = Math.abs(a - 22.5) < 9;
  if (d < 2.3) return null;
  if (d < 5.6 || (dente && d < 7.6)) {
    if (d < 3.4) return 'g';
    return dx + dy > 2 ? 'g' : dx + dy < -4 ? 'w' : 'l';
  }
  return null;
});

const globo = gerar((x, y) => {
  const dx = x - 8;
  const dy = y - 8;
  if (Math.hypot(dx, dy) > 7.2) return null;
  const terra =
    Math.hypot(x - 5, y - 5.5) < 2.6 ||
    Math.hypot(x - 6.5, y - 8) < 1.6 ||
    Math.hypot(x - 11, y - 9.5) < 2.4 ||
    Math.hypot(x - 7, y - 12.5) < 1.3;
  const sombra = dx + dy > 5;
  if (Math.hypot(x - 4.2, y - 3.6) < 1) return 'w';
  if (terra) return sombra ? 'E' : 'e';
  return sombra ? 'b' : 'c';
});

export const MAPAS = {
  texto,
  pasta,
  carta,
  lixeira,
  monitor,
  lampada,
  engrenagem,
  globo,
} as const;

export type NomeIcone = keyof typeof MAPAS;

/** SVG (string) do ícone, com rects agrupados por trecho horizontal. */
export function iconeSvg(nome: NomeIcone, tamanho = 32): string {
  const mapa = MAPAS[nome];
  let rects = '';
  mapa.forEach((linha, y) => {
    let x = 0;
    while (x < linha.length) {
      const c = linha[x];
      let fim = x + 1;
      while (fim < linha.length && linha[fim] === c) fim++;
      if (c !== '.' && PALETA[c]) rects += `<rect x="${x}" y="${y}" width="${fim - x}" height="1" fill="${PALETA[c]}"/>`;
      x = fim;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${tamanho}" height="${tamanho}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}</svg>`;
}
