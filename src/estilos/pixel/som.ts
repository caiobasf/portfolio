/**
 * Efeitos sonoros chiptune gerados na hora (WebAudio, onda quadrada).
 * Começa MUDO; só toca depois que a pessoa liga o som no HUD.
 */
let ligado = false;
let ctx: AudioContext | null = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function nota(freq: number, inicio: number, dur: number, vol = 0.05, tipo: OscillatorType = 'square') {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + inicio;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.setValueAtTime(vol, t + dur * 0.7);
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const som = {
  get ligado() {
    return ligado;
  },
  alternar() {
    ligado = !ligado;
    if (ligado) {
      nota(523, 0, 0.07);
      nota(784, 0.07, 0.1);
    }
    return ligado;
  },
  mover() {
    if (ligado) nota(880, 0, 0.04, 0.035);
  },
  confirmar() {
    if (!ligado) return;
    nota(523, 0, 0.06);
    nota(659, 0.06, 0.06);
    nota(784, 0.12, 0.06);
    nota(1047, 0.18, 0.14);
  },
  digitar() {
    if (ligado) nota(1200 + Math.random() * 300, 0, 0.018, 0.018);
  },
  start() {
    if (!ligado) return;
    [392, 523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.07, 0.09, 0.045));
    nota(1568, 0.38, 0.25, 0.03, 'triangle');
  },
};
