/**
 * Boot: overlay de tela cheia que roda uma vez por sessão.
 *
 * Quem decide se ele aparece é o script inline do <head> (Base.astro), que
 * marca <html class="boot-on"> antes da primeira pintura. Sem JavaScript, o
 * overlay nunca aparece e a landing fica legível normalmente.
 */

export const BOOT_CLASS = 'boot-on';
export const BOOT_KEY = 'cf-boot';

const LINE_INTERVAL = 520;
const CLOSE_DELAY = 900;
const FADE_OUT = 300;

/** Executa `cb` quando o boot não está (ou deixou de estar) na tela. */
export function afterBoot(cb: () => void): void {
  const html = document.documentElement;
  if (!html.classList.contains(BOOT_CLASS)) {
    cb();
    return;
  }
  const mo = new MutationObserver(() => {
    if (!html.classList.contains(BOOT_CLASS)) {
      mo.disconnect();
      cb();
    }
  });
  mo.observe(html, { attributes: true, attributeFilter: ['class'] });
}

export function initBoot(overlay: HTMLElement): void {
  const html = document.documentElement;
  if (!html.classList.contains(BOOT_CLASS)) return;

  const lines = Array.from(overlay.querySelectorAll<HTMLElement>('[data-boot-line]'));
  const bar = overlay.querySelector<HTMLElement>('[data-boot-bar]');
  const pct = overlay.querySelector<HTMLElement>('[data-boot-pct]');
  const skip = overlay.querySelector<HTMLButtonElement>('[data-boot-skip]');

  // a landing por baixo fica inerte enquanto o boot está aberto
  const behind = Array.from(document.body.children).filter((el) => el !== overlay) as HTMLElement[];
  behind.forEach((el) => (el.inert = true));

  const timers: number[] = [];
  let closed = false;

  const setProgress = (shown: number) => {
    const value = Math.round((shown / lines.length) * 100);
    if (bar) bar.style.transform = `scaleX(${value / 100})`;
    if (pct) pct.textContent = `${value}%`;
  };

  const close = () => {
    if (closed) return;
    closed = true;
    timers.forEach((t) => window.clearTimeout(t));
    document.removeEventListener('keydown', onKey);
    overlay.classList.add('is-closing');
    window.setTimeout(() => {
      behind.forEach((el) => (el.inert = false));
      html.classList.remove(BOOT_CLASS);
      overlay.remove();
      // devolve o foco ao começo do conteúdo, sem rolar
      document.getElementById('conteudo')?.focus({ preventScroll: true });
    }, FADE_OUT);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  document.addEventListener('keydown', onKey);
  skip?.addEventListener('click', close);
  skip?.focus();

  lines.forEach((line, i) => {
    timers.push(
      window.setTimeout(() => {
        line.hidden = false;
        setProgress(i + 1);
        if (i === lines.length - 1) {
          if (skip) skip.hidden = true;
          timers.push(window.setTimeout(close, CLOSE_DELAY));
        }
      }, LINE_INTERVAL * (i + 1)),
    );
  });
}
