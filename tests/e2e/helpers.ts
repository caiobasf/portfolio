import type { BrowserContext, Page } from '@playwright/test';
import { PALETTE_IDS, PALETTE_STORAGE_KEY, type PaletteId } from '../../src/styles/palettes.ts';

export { PALETTE_IDS, type PaletteId };

export const VIEWPORTS = {
  celular: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
} as const;

/**
 * Prepara o contexto antes de qualquer página: paleta escolhida e, se
 * `boot` for falso, marca o boot como já visto nesta sessão.
 */
export async function preparar(context: BrowserContext, opts: { paleta?: PaletteId; boot?: boolean } = {}) {
  await context.addInitScript(
    ({ key, paleta, boot }) => {
      try {
        if (paleta) localStorage.setItem(key, paleta);
        if (!boot) sessionStorage.setItem('cf-boot', '1');
      } catch {
        /* página sem armazenamento */
      }
    },
    { key: PALETTE_STORAGE_KEY, paleta: opts.paleta, boot: opts.boot ?? false },
  );
}

/** Espera o título do hero parar (montagem ou troca concluída). */
export async function tituloParado(page: Page, estado: 'apelido' | 'nome') {
  await page.locator(`[data-hero-title][data-state="${estado}"][data-anim="0"]`).waitFor({ timeout: 5_000 });
}
