/**
 * Arte original do estilo "pixel": paleta de 16 cores (Sweetie 16) e sprites
 * desenhados como matrizes de caracteres. Cada caractere é um índice da paleta;
 * "." é transparente e "o" é o olho (mesma cor do contorno, com classe própria
 * para piscar).
 */

export const PALETA: Record<string, string> = {
  '0': '#1a1c2c',
  '1': '#5d275d',
  '2': '#b13e53',
  '3': '#ef7d57',
  '4': '#ffcd75',
  '5': '#a7f070',
  '6': '#38b764',
  '7': '#257179',
  '8': '#29366f',
  '9': '#3b5dc9',
  a: '#41a6f6',
  b: '#73eff7',
  c: '#f4f4f4',
  d: '#94b0c2',
  e: '#566c86',
  f: '#333c57',
  o: '#1a1c2c',
};

/** O herói: um dev de moletom segurando o notebook (16×24). */
export const HEROI = [
  '......0000......',
  '....00ffff00....',
  '...0ffffffff0...',
  '..0ffefffffff0..',
  '..0fffffffffe0..',
  '..0f44444444f0..',
  '..0f4o4444o4f0..',
  '..0f4o4444o4f0..',
  '...0424444240...',
  '...0444224440...',
  '....03444430....',
  '.....003300.....',
  '...0229999220...',
  '..099999999990..',
  '.09eeeeeeeeee90.',
  '.09edddddddde90.',
  '.09edddbbddde90.',
  '.09edddddddde90.',
  '.04eeeeeeeeee40.',
  '..099999999990..',
  '..088888888880..',
  '...0fff00fff0...',
  '...0fff00fff0...',
  '..00cc0..0cc00..',
];

/** Só a cabeça (retrato do diálogo e do HUD). */
export const RETRATO = HEROI.slice(0, 13);

/** Ícones 12×12 dos grupos do inventário. */
export const ICONES: Record<string, string[]> = {
  grimorio: [
    '..000000000.',
    '.01222222220',
    '.01222442220',
    '.01224224220',
    '.01224224220',
    '.01222442220',
    '.01222222220',
    '.01222222220',
    '.01cccccccc0',
    '.01dddddddd0',
    '.00000000000',
    '............',
  ],
  espada: [
    '..........00',
    '.........0c0',
    '........0cd0',
    '.......0cd0.',
    '......0cd0..',
    '.....0cd0...',
    '.0..0cd0....',
    '.040cd0.....',
    '..4440......',
    '.0f040......',
    '0f0.40......',
    '00..........',
  ],
  escudo: [
    '.0000000000.',
    '.0a99999990.',
    '.0a99999550.',
    '.0a59995590.',
    '.0a55955990.',
    '.0a95559990.',
    '.0a99599990.',
    '..0a999990..',
    '..0a999990..',
    '...0a9990...',
    '....0990....',
    '.....00.....',
  ],
  martelo: [
    '............',
    '.0000000000.',
    '.0cdddddde0.',
    '.0ddddddde0.',
    '.0eeeeeeee0.',
    '.0000330000.',
    '....0320....',
    '....0320....',
    '....0320....',
    '....0320....',
    '....0320....',
    '.....00.....',
  ],
  orbe: [
    '....0000....',
    '..00bbbb00..',
    '.0bccbbbba0.',
    '.0bcbbbbaa0.',
    '0bbbbbbaaa90',
    '0bbbbbaaa990',
    '.0bbaaaa990.',
    '..00a99900..',
    '....0000....',
    '...011110...',
    '..01111110..',
    '..00000000..',
  ],
  pergaminho: [
    '.0000000000.',
    '034444444430',
    '.0333333330.',
    '..0cccccc0..',
    '..0cffffc0..',
    '..0cccccc0..',
    '..0cfffcc0..',
    '..0cccccc0..',
    '..0cffcfc0..',
    '.0333333330.',
    '034444444430',
    '.0000000000.',
  ],
  carta: [
    '............',
    '............',
    '000000000000',
    '0c0cccccc0c0',
    '0cc0cccc0cc0',
    '0ccc0cc0ccc0',
    '0cccc00cccc0',
    '0cccc22cccc0',
    '0cccccccccc0',
    '0dddddddddd0',
    '000000000000',
    '............',
  ],
  bandeira: [
    '00..........',
    '0400000000..',
    '0d09999990..',
    '0d09a99a90..',
    '0d099aa990..',
    '0d09a99a90..',
    '0d09999990..',
    '0d09900990..',
    '0d00....00..',
    '0d0.........',
    '0d0.........',
    '000.........',
  ],
  bau: [
    '............',
    '............',
    '..00000000..',
    '.0333333330.',
    '033333333330',
    '000004400000',
    '023324423320',
    '023332233320',
    '022222222220',
    '000000000000',
    '............',
    '............',
  ],
  balao: [
    '............',
    '.0000000000.',
    '0cccccccccc0',
    '0c00c00c00c0',
    '0cccccccccc0',
    '0cccccccccc0',
    '.0000cc0000.',
    '....0c0.....',
    '....00......',
    '............',
    '............',
    '............',
  ],
};

/** Pequenos: caixa marcada (8×8), gema de recompensa (7×7) e cursor ▶ (6×7). */
export const MARCADO = [
  '00000000',
  '0cccccc0',
  '0ccccc60',
  '0cccc660',
  '06c66cc0',
  '0c666cc0',
  '0cc6ccc0',
  '00000000',
];
export const GEMA = ['..000..', '.0bba0.', '0bcba90', '0ba9990', '.0a990.', '..090..', '...0...'];
export const CURSOR = ['0.....', '040...', '04440.', '044440', '04440.', '040...', '0.....'];

/** Grupo da stack → ícone e descrição curta (microtexto do inventário). */
export const ITEM_GRUPO: Record<string, { icone: string; texto: string }> = {
  Linguagens: { icone: 'grimorio', texto: 'Grimório de linguagem. Ensina a conversar com as máquinas.' },
  Frameworks: { icone: 'espada', texto: 'Lâmina forjada para construir rápido e com estrutura.' },
  Testes: { icone: 'escudo', texto: 'Escudo que barra os bugs antes do deploy.' },
  Ferramentas: { icone: 'martelo', texto: 'Ferramenta da oficina, usada todo dia na jornada.' },
  IAs: { icone: 'orbe', texto: 'Orbe arcano. Conjura agentes e revisões automáticas.' },
  Idiomas: { icone: 'pergaminho', texto: 'Pergaminho de tradução. Abre portas em outras terras.' },
};

/** Junta pixels vizinhos da mesma cor em retângulos (SVG menor). */
export function retangulos(sprite: string[]) {
  const out: { x: number; y: number; w: number; c: string; olho: boolean }[] = [];
  sprite.forEach((linha, y) => {
    let x = 0;
    while (x < linha.length) {
      const ch = linha[x];
      if (ch === '.') {
        x++;
        continue;
      }
      let w = 1;
      while (linha[x + w] === ch) w++;
      out.push({ x, y, w, c: PALETA[ch] ?? '#ff00ff', olho: ch === 'o' });
      x += w;
    }
  });
  return out;
}
