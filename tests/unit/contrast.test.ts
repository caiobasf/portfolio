/**
 * Contraste WCAG das quatro paletas (spec 2, §3.2).
 * Falha se qualquer par cair abaixo do mínimo — rodar depois de mexer em
 * qualquer cor de src/styles/palettes.ts:  npm run test:unit
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PALETTE_IDS,
  palettes,
  derivedBackgrounds,
  type PaletteColors,
} from '../../src/styles/palettes.ts';

type Rgb = [number, number, number];

function parseHex(hex: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`cor não é #RRGGBB: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** color-mix(in srgb, a pct%, b): interpolação nos valores sRGB (não lineares). */
const mix = (a: Rgb, b: Rgb, pct: number): Rgb =>
  a.map((v, i) => v * (pct / 100) + b[i] * (1 - pct / 100)) as Rgb;

function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

type Fundo = keyof PaletteColors | keyof typeof derivedBackgrounds;

const TEXTO: ReadonlyArray<keyof PaletteColors> = ['text', 'text-2', 'text-3', 'accent-text'];
const FUNDOS_DE_TEXTO: ReadonlyArray<Fundo> = ['bg', 'surface', 'bg-alt'];

/** [cor, fundo, mínimo] */
const pares: Array<[keyof PaletteColors, Fundo, number]> = [
  ...TEXTO.flatMap((t) => FUNDOS_DE_TEXTO.map((f): [keyof PaletteColors, Fundo, number] => [t, f, 4.5])),
  ['on-accent', 'accent', 4.5],
  // componentes (bordas de campo, barras, contornos): 3:1.
  // --accent só é exigido sobre --bg: no escuro, sobre --surface fica em 2,85:1,
  // então em card a cor vermelha nunca pode ser o único indicador.
  ['accent', 'bg', 3],
  ['line-strong', 'bg', 3],
  ['line-strong', 'surface', 3],
];

for (const id of PALETTE_IDS) {
  const p = palettes[id];
  const cor = (k: Fundo): Rgb => {
    if (k in derivedBackgrounds) {
      const d = derivedBackgrounds[k as keyof typeof derivedBackgrounds];
      return mix(parseHex(p.cores[d.mix]), parseHex(p.cores[d.base]), d.pct);
    }
    return parseHex(p.cores[k as keyof PaletteColors]);
  };

  test(`paleta "${id}": contraste mínimo`, () => {
    const falhas = pares
      .map(([a, b, min]) => ({ a, b, min, r: ratio(cor(a), cor(b)) }))
      .filter((x) => x.r < x.min)
      .map((x) => `--${x.a} sobre --${x.b}: ${x.r.toFixed(2)}:1 (mínimo ${x.min}:1)`);
    assert.deepEqual(falhas, [], `paleta ${id}:\n  ${falhas.join('\n  ')}`);
  });
}

test('todas as cores sólidas são #RRGGBB válidas', () => {
  for (const id of PALETTE_IDS) {
    for (const [k, v] of Object.entries(palettes[id].cores)) {
      if (k === 'band-line') continue; // rgba de propósito (linhas translúcidas)
      assert.doesNotThrow(() => parseHex(v), `${id} --${k}: ${v}`);
    }
  }
});
