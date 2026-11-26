/**
 * Paisagem da tela de título, desenhada em baixa resolução num <canvas> e
 * ampliada com image-rendering: pixelated. Camadas com parallax (ponteiro e
 * rolagem): céu em faixas pontilhadas, estrelas, lua, nuvens, três cadeias de
 * montanhas, uma torre distante, pinheiros, chão e vaga-lumes.
 *
 * O laço só roda com o canvas visível e a aba ativa. Com movimento reduzido,
 * desenha um quadro estático.
 */

const C = {
  noite: '#1a1c2c',
  roxo: '#5d275d',
  vinho: '#b13e53',
  laranja: '#ef7d57',
  areia: '#ffcd75',
  lima: '#a7f070',
  verde: '#38b764',
  petroleo: '#257179',
  marinho: '#29366f',
  azul: '#3b5dc9',
  celeste: '#41a6f6',
  ciano: '#73eff7',
  branco: '#f4f4f4',
  nevoa: '#94b0c2',
  ardosia: '#566c86',
  grafite: '#333c57',
};

/** Faixas do céu (fração da altura onde cada cor termina). */
const CEU: [number, string][] = [
  [0.22, C.noite],
  [0.35, C.marinho],
  [0.45, C.roxo],
  [0.52, C.vinho],
  [0.58, C.laranja],
  [1, C.areia],
];


function aleatorio(semente: number) {
  let s = semente >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Perfil periódico (soma de senos com período L) para as montanhas. */
function perfil(L: number, semente: number, harmonicos: number[], picos = 0) {
  const r = aleatorio(semente);
  const termos = harmonicos.map((k, i) => ({ k, fase: r() * Math.PI * 2, amp: 1 / (i + 1) ** 0.9 }));
  const soma = termos.reduce((s, t) => s + t.amp, 0);
  const alturas = new Float32Array(L);
  for (let x = 0; x < L; x++) {
    let v = 0;
    for (const t of termos) v += t.amp * Math.sin((2 * Math.PI * t.k * x) / L + t.fase);
    v = v / soma; // -1..1
    if (picos) v = Math.sign(v) * Math.abs(v) ** (1 - picos);
    alturas[x] = v;
  }
  return alturas;
}

interface Estrela {
  x: number;
  y: number;
  cor: string;
  fase: number;
  vel: number;
  grande: boolean;
}
interface Nuvem {
  x: number;
  y: number;
  w: number;
  vel: number;
  semente: number;
}
interface Vagalume {
  x: number;
  y: number;
  fase: number;
}

export function iniciarPaisagem(canvas: HTMLCanvasElement, reduzido: boolean) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return () => {};

  let W = 0;
  let H = 0;
  let escala = 4;
  let chaoPx = 88; // altura do chão em px CSS (variável --chao): o herói em HTML pisa nele
  let estrelas: Estrela[] = [];
  let nuvens: Nuvem[] = [];
  let vagalumes: Vagalume[] = [];
  let distante = new Float32Array(1);
  let meio = new Float32Array(1);
  let perto = new Float32Array(1);
  let pinheiros: number[] = [];

  // parallax
  let alvoX = 0;
  let px = 0;
  let rolagem = 0;

  function medir() {
    const r = canvas.getBoundingClientRect();
    escala = r.width < 700 ? 3 : 4;
    chaoPx = parseFloat(getComputedStyle(canvas).getPropertyValue('--chao')) || 88;
    W = Math.max(80, Math.ceil(r.width / escala));
    H = Math.max(80, Math.ceil(r.height / escala));
    canvas.width = W;
    canvas.height = H;
    const rnd = aleatorio(7);
    estrelas = Array.from({ length: Math.round((W * H) / 160) }, () => ({
      x: Math.floor(rnd() * W * 1.2),
      y: Math.floor(rnd() * H * 0.5),
      cor: [C.branco, C.nevoa, C.ciano, C.areia][Math.floor(rnd() * 4)],
      fase: rnd() * Math.PI * 2,
      vel: 0.6 + rnd() * 2.2,
      grande: rnd() < 0.08,
    }));
    nuvens = Array.from({ length: Math.max(3, Math.round(W / 70)) }, (_, i) => ({
      x: rnd() * W * 1.4,
      y: Math.floor(H * (0.12 + rnd() * 0.32)),
      w: Math.floor(18 + rnd() * 26),
      vel: 0.6 + rnd() * 1.4 + i * 0.05,
      semente: Math.floor(rnd() * 1e6),
    }));
    vagalumes = Array.from({ length: Math.max(8, Math.round(W / 22)) }, () => ({
      x: rnd() * W,
      y: H - Math.round(chaoPx / escala) - 4 - rnd() * H * 0.14,
      fase: rnd() * Math.PI * 2,
    }));
    const L = W * 2;
    distante = perfil(L, 11, [2, 3, 5, 9, 14], 0.25);
    meio = perfil(L, 23, [3, 4, 7, 11, 19]);
    perto = perfil(L, 41, [2, 5, 8, 13]);
    pinheiros = Array.from({ length: Math.round(W / 9) }, () => Math.floor(rnd() * L));
  }

  /** Céu em faixas com transição pontilhada (dithering 2×2). */
  function ceu() {
    let y0 = 0;
    for (let i = 0; i < CEU.length; i++) {
      const [fim, cor] = CEU[i];
      const y1 = Math.round(fim * H);
      ctx!.fillStyle = cor;
      ctx!.fillRect(0, y0, W, y1 - y0);
      const prox = CEU[i + 1]?.[1];
      if (prox) {
        ctx!.fillStyle = prox;
        for (let x = 0; x < W; x += 2) {
          ctx!.fillRect(x, y1 - 2, 1, 1);
          ctx!.fillRect(x + 1, y1 - 1, 1, 1);
        }
        ctx!.fillStyle = cor;
        for (let x = 0; x < W; x += 2) ctx!.fillRect(x + 1, y1, 1, 1);
      }
      y0 = y1;
    }
  }

  function astros(t: number, ox: number, oy: number) {
    for (const e of estrelas) {
      const brilho = reduzido ? 1 : Math.sin(t * e.vel + e.fase);
      if (brilho < -0.55) continue;
      const x = Math.floor((((e.x + ox) % (W * 1.2)) + W * 1.2) % (W * 1.2));
      const y = e.y + oy;
      ctx!.fillStyle = e.cor;
      ctx!.fillRect(x, y, 1, 1);
      if (e.grande && brilho > 0.4) {
        ctx!.fillRect(x - 1, y, 3, 1);
        ctx!.fillRect(x, y - 1, 1, 3);
      }
    }
    // lua crescente com crateras
    const R = Math.max(7, Math.round(H * 0.07));
    const mx = Math.round(W * 0.8 + ox * 0.6);
    const my = Math.round(H * 0.17 + oy);
    for (let y = -R; y <= R; y++) {
      for (let x = -R; x <= R; x++) {
        if (x * x + y * y > R * R) continue;
        const sombra = (x + R * 0.45) ** 2 + (y - R * 0.25) ** 2 < (R * 0.95) ** 2;
        ctx!.fillStyle = sombra ? C.nevoa : C.branco;
        if (!sombra && ((x - 2) ** 2 + (y + 2) ** 2 < 3 || (x + 3) ** 2 + (y - 3) ** 2 < 2)) ctx!.fillStyle = C.nevoa;
        ctx!.fillRect(mx + x, my + y, 1, 1);
      }
    }
  }

  function nuvem(n: Nuvem, x0: number, y0: number) {
    const rnd = aleatorio(n.semente);
    const blocos = 3 + Math.floor(rnd() * 3);
    const partes: [number, number, number][] = [];
    for (let i = 0; i < blocos; i++) {
      const r = 3 + Math.floor(rnd() * 5);
      partes.push([Math.floor((n.w / blocos) * i + r * 0.5), -Math.floor(rnd() * 4), r]);
    }
    for (const camada of [C.ardosia, C.nevoa]) {
      ctx!.fillStyle = camada;
      for (const [cx, cy, r] of partes) {
        const rr = camada === C.nevoa ? r - 1 : r;
        for (let y = -rr; y <= 0; y++) {
          const meia = Math.floor(Math.sqrt(rr * rr - y * y));
          ctx!.fillRect(x0 + cx - meia, y0 + cy + y - (camada === C.nevoa ? 1 : 0), meia * 2 + 1, 1);
        }
      }
    }
    ctx!.fillStyle = C.ardosia;
    ctx!.fillRect(x0, y0, n.w + 6, 2);
  }

  function cadeia(alt: Float32Array, base: number, amp: number, ox: number, cor: string, topo?: string, neve?: string) {
    const L = alt.length;
    for (let x = 0; x < W; x++) {
      const i = (((x + Math.round(ox)) % L) + L) % L;
      const y = Math.round(base - (alt[i] * 0.5 + 0.5) * amp);
      ctx!.fillStyle = cor;
      ctx!.fillRect(x, y, 1, H - y);
      if (topo) {
        ctx!.fillStyle = topo;
        ctx!.fillRect(x, y, 1, 1);
      }
      if (neve && alt[i] > 0.55) {
        ctx!.fillStyle = neve;
        ctx!.fillRect(x, y, 1, Math.round((alt[i] - 0.55) * amp * 0.9) + 1);
      }
    }
  }

  function torre(ox: number, base: number) {
    const L = meio.length;
    const x0 = Math.round((((W * 0.24 - ox) % L) + L) % L);
    if (x0 > W + 10) return;
    const i = (((x0 + Math.round(ox)) % L) + L) % L;
    const chao = Math.round(base - (meio[i] * 0.5 + 0.5) * H * 0.16);
    ctx!.fillStyle = C.marinho;
    ctx!.fillRect(x0, chao - 22, 7, 22);
    ctx!.fillRect(x0 - 1, chao - 24, 9, 3);
    for (let k = 0; k < 9; k += 2) ctx!.fillRect(x0 - 1 + k, chao - 26, 1, 2);
    ctx!.fillRect(x0 + 8, chao - 12, 9, 12);
    ctx!.fillRect(x0 + 7, chao - 14, 11, 2);
    ctx!.fillStyle = C.areia;
    ctx!.fillRect(x0 + 3, chao - 16, 1, 2);
    ctx!.fillRect(x0 + 12, chao - 8, 1, 2);
    // bandeirinha
    ctx!.fillStyle = C.marinho;
    ctx!.fillRect(x0 + 3, chao - 31, 1, 5);
    ctx!.fillStyle = C.vinho;
    ctx!.fillRect(x0 + 4, chao - 31, 3, 2);
  }

  function pinheiro(x: number, y: number, h: number) {
    ctx!.fillStyle = C.marinho;
    for (let k = 0; k < h; k++) {
      const meia = Math.floor((k * 0.55) % (h * 0.4)) + Math.floor(k / 4);
      ctx!.fillRect(x - meia, y - h + k, meia * 2 + 1, 1);
    }
  }

  function quadro(t: number) {
    px += (alvoX - px) * 0.06;
    const oy = rolagem / escala; // camadas distantes descem: andam mais devagar que a página
    ceu();
    astros(t, px * -3, Math.round(oy * 0.8));
    for (const n of nuvens) {
      const x = reduzido ? n.x : n.x - t * n.vel;
      const faixa = W + 80;
      const xx = Math.round((((x + px * -6) % faixa) + faixa) % faixa) - 60;
      nuvem(n, xx, n.y + Math.round(oy * 0.7));
    }
    const chao = H - Math.round(chaoPx / escala);
    cadeia(distante, H * 0.74 + oy * 0.6, H * 0.36, px * 8, C.grafite, C.ardosia, C.nevoa);
    const baseMeio = H * 0.8 + oy * 0.4;
    cadeia(meio, baseMeio, H * 0.16, px * 16, C.marinho, C.azul);
    torre(px * 16, baseMeio);
    cadeia(perto, chao + 2 + oy * 0.2, H * 0.1, px * 28, C.petroleo, C.verde);
    // pinheiros nas colinas próximas
    const L = perto.length;
    for (const p of pinheiros) {
      const x = (((p - Math.round(px * 28)) % L) + L) % L;
      if (x > W) continue;
      const i = (((x + Math.round(px * 28)) % L) + L) % L;
      const y = Math.round(chao + 2 + oy * 0.2 - (perto[i] * 0.5 + 0.5) * H * 0.1) + 2;
      pinheiro(x, y, 7 + (p % 6));
    }
    // chão: grama, borda clara e terra em degraus
    const gy = chao;
    ctx!.fillStyle = C.verde;
    ctx!.fillRect(0, gy, W, H - gy);
    ctx!.fillStyle = C.lima;
    ctx!.fillRect(0, gy, W, 1);
    for (let x = (Math.round(px * -40) % 6 + 6) % 6; x < W; x += 6) ctx!.fillRect(x, gy - 1, 1, 1);
    ctx!.fillStyle = C.petroleo;
    for (let x = (Math.round(px * -40) % 8 + 8) % 8; x < W; x += 8) {
      ctx!.fillRect(x, gy + 4, 2, 1);
      ctx!.fillRect(x + 4, gy + 8, 1, 1);
    }
    ctx!.fillRect(0, gy + Math.round((H - gy) * 0.55), W, H);
    ctx!.fillStyle = C.marinho;
    ctx!.fillRect(0, gy + Math.round((H - gy) * 0.8), W, H);
    // vaga-lumes
    if (!reduzido) {
      for (const v of vagalumes) {
        const b = Math.sin(t * 2 + v.fase);
        if (b < 0.2) continue;
        ctx!.fillStyle = b > 0.8 ? C.areia : C.lima;
        const x = Math.round(v.x + Math.sin(t * 0.7 + v.fase) * 6 + px * -20);
        const y = Math.round(v.y + Math.cos(t * 0.9 + v.fase) * 3);
        ctx!.fillRect(((x % W) + W) % W, y, 1, 1);
      }
    }
  }

  medir();
  quadro(0);

  if (reduzido) {
    const ro = new ResizeObserver(() => {
      medir();
      quadro(0);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }

  let rodando = false;
  let visivel = true;
  let raf = 0;
  let ultimo = 0;
  const t0 = performance.now();

  function laco(agora: number) {
    raf = requestAnimationFrame(laco);
    if (agora - ultimo < 1000 / 30) return; // 30 qps: mais cara de cartucho
    ultimo = agora;
    quadro((agora - t0) / 1000);
  }
  function atualizar() {
    const deve = visivel && !document.hidden;
    if (deve && !rodando) {
      rodando = true;
      raf = requestAnimationFrame(laco);
    } else if (!deve && rodando) {
      rodando = false;
      cancelAnimationFrame(raf);
    }
  }

  const io = new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    atualizar();
  });
  io.observe(canvas);
  const ro = new ResizeObserver(() => medir());
  ro.observe(canvas);
  const aoMover = (e: PointerEvent) => {
    alvoX = (e.clientX / innerWidth) * 2 - 1;
  };
  const aoRolar = () => {
    rolagem = Math.min(scrollY, innerHeight * 1.2);
  };
  addEventListener('pointermove', aoMover, { passive: true });
  addEventListener('scroll', aoRolar, { passive: true });
  document.addEventListener('visibilitychange', atualizar);
  atualizar();

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    removeEventListener('pointermove', aoMover);
    removeEventListener('scroll', aoRolar);
    document.removeEventListener('visibilitychange', atualizar);
  };
}
