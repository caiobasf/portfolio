/**
 * Globo do cartão "Local": projeção ortográfica feita no build (sem JS no
 * cliente). Gera a graticule (meridianos e paralelos), o contorno aproximado da
 * América do Sul (coordenadas próprias, simplificadas) e a posição de São Paulo.
 */

const R = 84;
const C = 100;
const LAT0 = (-16 * Math.PI) / 180;
const LON0 = (-52 * Math.PI) / 180;
const rad = (g: number) => (g * Math.PI) / 180;

function projeta(lat: number, lon: number): { x: number; y: number; visivel: boolean } {
  const f = rad(lat);
  const l = rad(lon) - LON0;
  const cosc = Math.sin(LAT0) * Math.sin(f) + Math.cos(LAT0) * Math.cos(f) * Math.cos(l);
  const x = R * Math.cos(f) * Math.sin(l);
  const y = R * (Math.cos(LAT0) * Math.sin(f) - Math.sin(LAT0) * Math.cos(f) * Math.cos(l));
  return { x: C + x, y: C - y, visivel: cosc >= 0 };
}

const n = (v: number) => v.toFixed(1);

function linha(pontos: [number, number][]): string {
  let d = '';
  let aberto = false;
  for (const [lat, lon] of pontos) {
    const p = projeta(lat, lon);
    if (!p.visivel) {
      aberto = false;
      continue;
    }
    d += `${aberto ? 'L' : 'M'}${n(p.x)} ${n(p.y)}`;
    aberto = true;
  }
  return d;
}

const meridianos: string[] = [];
for (let lon = -180; lon < 180; lon += 20) {
  const pts: [number, number][] = [];
  for (let lat = -90; lat <= 90; lat += 3) pts.push([lat, lon]);
  meridianos.push(linha(pts));
}
const paralelos: string[] = [];
for (let lat = -75; lat <= 75; lat += 15) {
  const pts: [number, number][] = [];
  for (let lon = -180; lon <= 180; lon += 3) pts.push([lat, lon]);
  paralelos.push(linha(pts));
}

/** América do Sul, bem simplificada (lat, lon). */
const continente: [number, number][] = [
  [12, -72], [11, -64], [8.5, -60], [5.5, -54], [2, -50], [-1, -48], [-2.5, -42], [-5, -36],
  [-8, -35], [-13, -38.5], [-18, -39.5], [-22.5, -41.5], [-23.5, -45.5], [-26, -48.5], [-30, -50.5],
  [-34, -53], [-35.5, -57], [-38.5, -58], [-39, -62], [-41.5, -63.5], [-46, -67.5], [-50, -68.5],
  [-52.5, -69], [-55, -67.5], [-54, -71.5], [-48, -75.5], [-41, -73.8], [-33, -71.7], [-23, -70.5],
  [-18, -70.3], [-14, -76.3], [-6, -81], [-2, -80.5], [1.5, -79], [7, -77.8], [9, -76], [11.5, -72],
];

export const globo = {
  r: R,
  c: C,
  graticule: [...meridianos, ...paralelos].filter(Boolean).join(''),
  continente: linha(continente) + 'Z',
  sp: projeta(-23.55, -46.63),
};
