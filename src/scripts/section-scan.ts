/**
 * Caixa de varredura nos títulos de seção (spec 2, §6.3): quando o bloco do
 * título fica 60% visível, ganha a classe `scan-on` (a animação é CSS, em
 * global.css). Uma vez por título.
 */
import { prefersReducedMotion } from './pixel-text';

export function initSectionScan(heads: HTMLElement[]): void {
  if (prefersReducedMotion() || !('IntersectionObserver' in window) || !heads.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('scan-on');
        io.unobserve(e.target);
      }
    },
    { threshold: 0.6 },
  );
  heads.forEach((h) => io.observe(h));
}
