/**
 * Guilhoché (o padrão de linhas finas de cédulas e títulos) gerado no build.
 * Cada faixa é um conjunto de ondas senoidais sobre um círculo, defasadas
 * entre si, o que produz o entrelaçado. Coordenadas inteiras para manter o
 * SVG leve.
 */
interface Faixa {
  raio: number;
  amplitude: number;
  ondas: number;
  curvas: number;
  pontos: number;
}

const FAIXAS: Faixa[] = [
  { raio: 262, amplitude: 22, ondas: 30, curvas: 6, pontos: 300 },
  { raio: 190, amplitude: 34, ondas: 18, curvas: 6, pontos: 220 },
  { raio: 112, amplitude: 30, ondas: 10, curvas: 6, pontos: 160 },
];

export const GUILHOCHE_TAMANHO = 600;

export function guilhoche(): string[] {
  const c = GUILHOCHE_TAMANHO / 2;
  const caminhos: string[] = [];
  for (const f of FAIXAS) {
    for (let k = 0; k < f.curvas; k++) {
      const fase = (k / f.curvas) * 2 * Math.PI;
      let d = '';
      for (let i = 0; i <= f.pontos; i++) {
        const t = (i / f.pontos) * Math.PI * 2;
        const r =
          f.raio + f.amplitude * Math.sin(f.ondas * t + fase) + f.amplitude * 0.18 * Math.sin(3 * t + fase / 2);
        const x = Math.round((c + r * Math.cos(t)) * 2) / 2;
        const y = Math.round((c + r * Math.sin(t)) * 2) / 2;
        d += (i ? 'L' : 'M') + x + ' ' + y;
      }
      caminhos.push(d + 'Z');
    }
  }
  return caminhos;
}
