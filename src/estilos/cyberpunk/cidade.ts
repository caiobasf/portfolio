/**
 * Canvas do hero: horizonte de cidade noturna, grade neon em perspectiva e
 * chuva fina. Pausa fora da tela e com a aba oculta. Com `animar: false`
 * desenha um único quadro estático (movimento reduzido).
 */

interface Predio {
  x: number;
  w: number;
  h: number;
  camada: 0 | 1;
  janelas: { x: number; y: number; cor: string; fase: number }[];
  antena: boolean;
}
interface Gota {
  x: number;
  y: number;
  v: number;
  l: number;
}

const COR_JANELA = ['rgba(252,238,10,', 'rgba(0,240,255,', 'rgba(255,42,109,'];

/** gerador pseudoaleatório com semente fixa: o horizonte é sempre o mesmo */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function iniciarCidade(canvas: HTMLCanvasElement, opcoes: { animar: boolean }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let W = 0;
  let H = 0;
  let dpr = 1;
  let predios: Predio[] = [];
  let gotas: Gota[] = [];
  let raf = 0;
  let visivel = true;
  let rodando = false;
  let t0 = performance.now();
  let alvoX = 0;
  let px = 0;

  function gerar() {
    const r = rng(7);
    predios = [];
    for (const camada of [0, 1] as const) {
      let x = -20;
      while (x < W + 20) {
        const w = (camada ? 40 : 28) + r() * (camada ? 90 : 60);
        const base = camada ? 0.16 : 0.26;
        const h = H * (base * (0.35 + r() * (camada ? 0.9 : 0.8)));
        const janelas: Predio['janelas'] = [];
        const cols = Math.floor(w / 9);
        const linhas = Math.floor(h / 11);
        for (let i = 0; i < cols; i++)
          for (let j = 0; j < linhas; j++)
            if (r() < (camada ? 0.16 : 0.1))
              janelas.push({
                x: 4 + i * 9,
                y: 6 + j * 11,
                cor: COR_JANELA[Math.floor(r() * (r() < 0.6 ? 1 : 3))],
                fase: r() * 1000,
              });
        predios.push({ x, w, h, camada, janelas, antena: r() < 0.22 });
        x += w + (camada ? 2 + r() * 10 : r() * 6);
      }
    }
    const n = Math.round((W * H) / 22000);
    gotas = Array.from({ length: n }, () => ({
      x: r() * W,
      y: r() * H,
      v: 6 + r() * 9,
      l: 8 + r() * 18,
    }));
  }

  function medir() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    gerar();
  }

  function desenhar(t: number) {
    const c = ctx!;
    const hz = H * 0.6;
    const vx = W * 0.62 + px * 60;

    // céu
    const ceu = c.createLinearGradient(0, 0, 0, hz);
    ceu.addColorStop(0, '#07060d');
    ceu.addColorStop(0.65, '#160a24');
    ceu.addColorStop(1, '#3a0b34');
    c.fillStyle = ceu;
    c.fillRect(0, 0, W, hz);

    // brilho do horizonte
    const brilho = c.createRadialGradient(vx, hz, 0, vx, hz, W * 0.55);
    brilho.addColorStop(0, 'rgba(255,42,109,0.45)');
    brilho.addColorStop(0.4, 'rgba(255,42,109,0.12)');
    brilho.addColorStop(1, 'rgba(255,42,109,0)');
    c.fillStyle = brilho;
    c.fillRect(0, 0, W, H);

    // prédios: camada de fundo primeiro
    for (const camada of [1, 0] as const) {
      const desl = px * (camada ? -10 : -24);
      c.fillStyle = camada ? '#1b0f2e' : '#0c0818';
      for (const p of predios) {
        if (p.camada !== camada) continue;
        const x = p.x + desl;
        c.fillRect(x, hz - p.h, p.w, p.h);
        if (p.antena) {
          c.fillRect(x + p.w / 2 - 1, hz - p.h - 18, 2, 18);
          const on = Math.sin(t / 400 + p.x) > 0.2;
          c.fillStyle = on ? 'rgba(255,42,109,0.95)' : 'rgba(255,42,109,0.25)';
          c.fillRect(x + p.w / 2 - 2, hz - p.h - 21, 4, 4);
          c.fillStyle = camada ? '#1b0f2e' : '#0c0818';
        }
      }
      for (const p of predios) {
        if (p.camada !== camada) continue;
        const x = p.x + desl;
        for (const j of p.janelas) {
          const pisca = Math.sin(t / 900 + j.fase) > -0.85 ? 1 : 0.15;
          c.fillStyle = j.cor + (camada ? 0.35 : 0.75) * pisca + ')';
          c.fillRect(x + j.x, hz - p.h + j.y, 4, 5);
        }
      }
    }

    // linha do horizonte
    c.fillStyle = 'rgba(255,42,109,0.9)';
    c.fillRect(0, hz - 1, W, 2);

    // chão
    const chao = c.createLinearGradient(0, hz, 0, H);
    chao.addColorStop(0, '#1a0620');
    chao.addColorStop(1, '#07060d');
    c.fillStyle = chao;
    c.fillRect(0, hz + 1, W, H - hz);

    // grade em perspectiva
    c.lineWidth = 1;
    const fase = opcoes.animar ? (t / 1600) % 1 : 0.35;
    const N = 18;
    for (let k = 0; k < N; k++) {
      const z = (k + fase) / N;
      const y = hz + (H - hz) * Math.pow(z, 2.6);
      c.strokeStyle = `rgba(255,42,109,${0.15 + z * 0.65})`;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
    }
    const colunas = 22;
    for (let i = -colunas; i <= colunas; i++) {
      const xb = vx + i * (W / 9);
      c.strokeStyle = i === 0 ? 'rgba(0,240,255,0.6)' : 'rgba(0,240,255,0.28)';
      c.beginPath();
      c.moveTo(vx + i * 6, hz);
      c.lineTo(xb, H);
      c.stroke();
    }

    // chuva
    c.strokeStyle = 'rgba(160,220,255,0.18)';
    c.beginPath();
    for (const g of gotas) {
      c.moveTo(g.x, g.y);
      c.lineTo(g.x - g.l * 0.18, g.y + g.l);
    }
    c.stroke();
  }

  function passo(agora: number) {
    if (!rodando) return;
    const dt = Math.min(50, agora - t0);
    t0 = agora;
    px += (alvoX - px) * 0.05;
    for (const g of gotas) {
      g.y += g.v * (dt / 16);
      g.x -= g.v * 0.18 * (dt / 16);
      if (g.y > H) {
        g.y = -g.l;
        g.x = Math.random() * (W + 60);
      }
    }
    desenhar(agora);
    raf = requestAnimationFrame(passo);
  }

  function ligar() {
    if (!opcoes.animar || rodando || !visivel || document.hidden) return;
    rodando = true;
    t0 = performance.now();
    raf = requestAnimationFrame(passo);
  }
  function desligar() {
    rodando = false;
    cancelAnimationFrame(raf);
  }

  medir();
  desenhar(0);

  const ro = new ResizeObserver(() => {
    medir();
    desenhar(performance.now());
  });
  ro.observe(canvas);

  const io = new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel) ligar();
    else desligar();
  });
  io.observe(canvas);

  const vis = () => (document.hidden ? desligar() : ligar());
  document.addEventListener('visibilitychange', vis);

  const mover = (e: PointerEvent) => {
    alvoX = e.clientX / window.innerWidth - 0.5;
  };
  if (opcoes.animar) window.addEventListener('pointermove', mover, { passive: true });

  ligar();

  return () => {
    desligar();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', vis);
    window.removeEventListener('pointermove', mover);
  };
}
