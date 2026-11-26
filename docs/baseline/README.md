# Linha de base — v1 (antes da spec 2)

Capturada em 2026-11-26, commit `8d96720`, a partir do build de produção (`astro preview`, localhost).

## Lighthouse (celular, Lighthouse 12.8.2, Chrome headless)

| Página | Desempenho | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 99 | **95** | 100 | 100 | 1,8 s | 0 | 0 ms |
| `/conversa` | 99 | 100 | 100 | 100 | 1,7 s | 0 | 0 ms |

- O Lighthouse abre uma sessão nova, então o boot aparece na medição da landing.
- Acessibilidade 95 na landing: `aria-allowed-role` e `listitem`, ambos causados pelo `<ol role="log">` do boot (`src/components/Boot.astro`). Problema da v1, a corrigir na spec 2.
- Relatórios completos: `lighthouse-*-mobile.report.json` (abrir em https://googlechrome.github.io/lighthouse/viewer/).

## Capturas

`landing-*` (página inteira, sem boot), `boot-*` (~2,2 s depois de abrir), `chat-*`, em 390px (DPR 2) e 1440px.
