/**
 * Paleta ativa no navegador.
 *
 * - `getPalette()` lê as cores do <html> (canvases não leem variáveis CSS) e
 *   guarda em cache até a próxima troca.
 * - `setPalette(id)` troca a paleta, salva a escolha e dispara `palette-change`
 *   no window; cada canvas escuta e redesenha.
 *
 * A paleta inicial é aplicada antes da primeira pintura pelo script inline de
 * Base.astro, não por este módulo.
 */
import { PALETTE_STORAGE_KEY, isPaletteId, type PaletteColors, type PaletteId } from '../styles/palettes';

export const PALETTE_EVENT = 'palette-change';

export type PaletteChangeEvent = CustomEvent<{ id: PaletteId }>;

const KEYS: ReadonlyArray<keyof PaletteColors> = [
  'bg', 'surface', 'line', 'line-strong', 'text', 'text-2', 'text-3',
  'accent', 'accent-text', 'on-accent', 'accent-dark', 'noise',
  'band-bg', 'band-fg', 'band-line',
  'mosaic-1', 'mosaic-2', 'mosaic-3', 'mosaic-4', 'mosaic-5',
];

let cache: PaletteColors | null = null;

export function getPalette(): PaletteColors {
  if (cache) return cache;
  const cs = getComputedStyle(document.documentElement);
  const out = {} as PaletteColors;
  for (const k of KEYS) out[k] = cs.getPropertyValue(`--${k}`).trim();
  cache = out;
  return out;
}

export function currentPalette(): PaletteId | null {
  const id = document.documentElement.dataset.palette;
  return isPaletteId(id) ? id : null;
}

/** Troca a paleta e salva a escolha. O evento sai do observador abaixo. */
export function setPalette(id: PaletteId): void {
  document.documentElement.dataset.palette = id;
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, id);
  } catch {
    /* sem armazenamento: a escolha vale só nesta página */
  }
}

/*
 * Qualquer mudança em <html data-palette> (seletor ou edição à mão no
 * DevTools) limpa o cache, atualiza o theme-color e avisa os canvases.
 */
if (typeof window !== 'undefined') {
  new MutationObserver(() => {
    const id = currentPalette();
    if (!id) return;
    cache = null;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getPalette().bg);
    window.dispatchEvent(new CustomEvent(PALETTE_EVENT, { detail: { id } }) as PaletteChangeEvent);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-palette'] });
}

/** Registra `cb` para cada troca de paleta; devolve a função que cancela. */
export function onPaletteChange(cb: (id: PaletteId) => void): () => void {
  const h = (e: Event) => cb((e as PaletteChangeEvent).detail.id);
  window.addEventListener(PALETTE_EVENT, h);
  return () => window.removeEventListener(PALETTE_EVENT, h);
}
