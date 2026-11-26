/**
 * Estilo "terminal": painel do monitor (só em telas largas).
 * Gira o globo em ASCII e mexe nos medidores. Pausa fora da tela, com a aba
 * oculta e com movimento reduzido (fica o quadro estático do servidor).
 */
import { quadroHtml, ANGULO_SP } from './globo';

const painel = document.querySelector<HTMLElement>('.t-monitor');
const globo = document.querySelector<HTMLElement>('[data-globo]');

if (painel && globo) {
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)');
  const medidores = Array.from(document.querySelectorAll<HTMLElement>('[data-medidor]'));
  let visivel = false;
  let raf = 0;
  let ultimo = 0;
  let ultimoMed = 0;
  let theta = ANGULO_SP + 0.9;

  const desenhar = (agora: number) => {
    raf = requestAnimationFrame(desenhar);
    if (agora - ultimo < 70) return; // ~14 quadros por segundo bastam para ASCII
    const dt = Math.min(200, agora - (ultimo || agora));
    ultimo = agora;
    theta -= dt * 0.00035;
    globo.innerHTML = quadroHtml(theta);
    if (agora - ultimoMed > 1400) {
      ultimoMed = agora;
      for (const m of medidores) {
        const base = Number(m.dataset.medidor);
        const v = Math.max(5, Math.min(99, Math.round(base + (Math.random() - 0.5) * 22)));
        const barra = m.querySelector('[data-barra]');
        const valor = m.querySelector('[data-valor]');
        if (barra) barra.textContent = '|'.repeat(Math.round(v / 5)).padEnd(20, ' ');
        if (valor) valor.textContent = `${v}%`;
      }
    }
  };

  const atualizar = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (visivel && !document.hidden && !reduzir.matches) {
      ultimo = 0;
      raf = requestAnimationFrame(desenhar);
    } else if (reduzir.matches) {
      globo.innerHTML = quadroHtml(ANGULO_SP);
    }
  };

  new IntersectionObserver((entradas) => {
    visivel = entradas.some((e) => e.isIntersecting);
    atualizar();
  }).observe(painel);
  document.addEventListener('visibilitychange', atualizar);
  reduzir.addEventListener('change', atualizar);
}
