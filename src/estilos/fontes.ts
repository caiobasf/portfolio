/**
 * Ajuda para declarar fontes auto-hospedadas (só o subconjunto latino).
 * Uso num estilo:
 *
 *   import vt from '@fontsource/vt323/files/vt323-latin-400-normal.woff2?url';
 *   import { fontFace } from '../fontes';
 *   const css = fontFace('VT323', '400', vt);
 *   ...
 *   <style is:inline set:html={css}></style>
 *
 * Fontes variáveis: fontFace('Geist Variable', '100 900', url, true).
 */
export const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

export function fontFace(family: string, weight: string, src: string, variable = false, style = 'normal'): string {
  return (
    `@font-face{font-family:'${family}';font-style:${style};font-display:swap;font-weight:${weight};` +
    `src:url(${src}) format('${variable ? 'woff2-variations' : 'woff2'}');unicode-range:${LATIN}}`
  );
}
