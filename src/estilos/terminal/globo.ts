/**
 * Globo em ASCII com meridianos, paralelos e um marcador em São Paulo.
 * Puro cálculo: o servidor desenha o primeiro quadro, o navegador gira.
 */

const RAMPA = '  ..,,:;';
const SP = { lat: (-23.55 * Math.PI) / 180, lon: (-46.63 * Math.PI) / 180 };
const INCLINACAO = -0.3;

export const LARGURA = 44;
export const ALTURA = 27;

/** ângulo que deixa São Paulo de frente */
export const ANGULO_SP = -SP.lon;

export function quadro(theta: number, w = LARGURA, h = ALTURA): string {
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rx = w / 2 - 0.5;
  const ry = h / 2 - 0.5;
  // luz vinda de cima à esquerda, um pouco à frente
  const lx = -0.55,
    ly = 0.55,
    lz = 0.63;
  const ct = Math.cos(theta),
    st = Math.sin(theta);
  const ci = Math.cos(INCLINACAO),
    si = Math.sin(INCLINACAO);
  // posição do marcador em coordenadas do mundo
  const sx = Math.cos(SP.lat) * Math.sin(SP.lon);
  const sy = Math.sin(SP.lat);
  const sz = Math.cos(SP.lat) * Math.cos(SP.lon);

  let out = '';
  for (let y = 0; y < h; y++) {
    let linha = '';
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / rx;
      const ny = -(y - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) {
        linha += ' ';
        continue;
      }
      const nz = Math.sqrt(1 - d);
      // desfaz a inclinação (eixo X) e a rotação (eixo Y)
      const y1 = ny * ci + nz * si;
      const z1 = -ny * si + nz * ci;
      const wx = nx * ct - z1 * st;
      const wz = nx * st + z1 * ct;
      const wy = y1;
      const lat = Math.asin(Math.max(-1, Math.min(1, wy)));
      const lon = Math.atan2(wx, wz);

      const dist = Math.acos(Math.max(-1, Math.min(1, wx * sx + wy * sy + wz * sz)));
      if (dist < 0.075) {
        linha += '@';
        continue;
      }
      if (dist < 0.16) {
        linha += 'o';
        continue;
      }

      const luz = Math.max(0, nx * lx + ny * ly + nz * lz);
      const passoLat = (Math.PI / 180) * 30;
      const passoLon = (Math.PI / 180) * 30;
      const mLat = (((lat + Math.PI / 2) % passoLat) + passoLat) % passoLat;
      const gLat = Math.min(mLat, passoLat - mLat) < 0.05;
      const mLon = ((lon % passoLon) + passoLon) % passoLon;
      const gLon = Math.min(mLon, passoLon - mLon) * Math.cos(lat) < 0.034 / Math.max(0.3, nz);
      if (gLat || gLon) {
        linha += luz > 0.6 ? '#' : luz > 0.35 ? '*' : luz > 0.15 ? '+' : ':';
        continue;
      }
      const i = Math.min(RAMPA.length - 1, Math.round(Math.pow(luz, 1.3) * (RAMPA.length - 1)));
      linha += RAMPA[i];
    }
    out += linha.replace(/\s+$/, '') + (y < h - 1 ? '\n' : '');
  }
  return out;
}

/** HTML do quadro: o marcador ganha a cor de destaque */
export function quadroHtml(theta: number): string {
  return quadro(theta)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/(@+|o+)/g, '<b>$1</b>');
}
