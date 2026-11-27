# Estilos do portfólio

O site tem um botão flutuante (canto inferior direito) que troca o site inteiro entre 11 estilos: o original (Scanner, em `/`) e 10 linguagens visuais completas em `/estilo/<id>/`. Trocar de estilo muda layout, tipografia, interação e animação, não só as cores. O conteúdo vem sempre de `src/content/perfil.ts`.

## Como funciona

| Peça | Arquivo |
| :--- | :--- |
| Lista de estilos (nome, descrição, cores da amostra, rota) | `src/estilos/registro.ts` |
| Layout das páginas de estilo (`<head>`, SEO, botão) | `src/layouts/Estilo.astro` |
| Botão e painel de troca (Shadow DOM declarativo, `popover`, funciona sem JS) | `src/components/StyleSwitcher.astro` |
| Transição entre páginas (View Transitions entre documentos) | `src/components/EstiloTransicao.astro` |
| Fontes auto-hospedadas (ajuda `fontFace`) | `src/estilos/fontes.ts` |
| Cada estilo | `src/estilos/<id>/` + `src/pages/estilo/<id>.astro` |
| Captura de tela e diagnóstico | `scripts/captura.mjs` |

- A escolha fica em `localStorage['cf-estilo']`. A landing `/` redireciona para o estilo salvo antes da primeira pintura; escolher "Scanner" no painel volta ao original.
- As páginas de estilo têm `canonical` para `/` e ficam fora do sitemap.
- A troca pelo botão faz uma revelação circular a partir do botão (View Transition com tipo `estilo`); outras navegações só esmaecem. Com movimento reduzido, nada anima.

## Regras para todo estilo

1. **Conteúdo:** todo texto do currículo vem de `src/content/perfil.ts` (`pessoa`, `contato`, `sobre`, `construo`, `projetos`, `stack`, `trajetoria`). Microtexto de interface do próprio estilo ("PRESS START", "Iniciar", manchetes) pode ser escrito no componente, sempre em português. **Nunca** telefone.
2. **Seções obrigatórias:** apresentação (nome, cargo, local, status), sobre (parágrafo + resumo), todos os projetos (tags e itens), toda a stack, toda a trajetória e contato (e-mail com `mailto:`, LinkedIn, GitHub). Pode linkar o chat `/conversa`.
3. **Um `<h1>`** contendo o nome. Landmarks (`header`, `main`, `footer`, `nav`), títulos em ordem, link "pular para o conteúdo".
4. **Sem JS, tudo legível.** Nada fica escondido por CSS esperando o JS revelar: animações de entrada partem do JS (`gsap.from`) ou de classes postas pelo JS.
5. **Movimento reduzido:** com `prefers-reduced-motion: reduce`, sem glitch, piscadas, rolagem suave ou parallax (use `gsap.matchMedia()`).
6. **Acessibilidade:** contraste AA, foco visível, tudo operável por teclado, decoração com `aria-hidden`. O axe (`--axe`) precisa sair limpo de violações sérias e críticas.
7. **Responsivo** de 360 px a 1920 px, sem rolagem horizontal em 390 px.
8. **O botão de estilo** ocupa ~48 px no canto inferior direito. Deixe respiro no rodapé; se o estilo tiver algo fixo embaixo (barra de tarefas), mova o botão com `--estilo-switcher-bottom` / `--estilo-switcher-right` no `:root`.
9. **Sem rede externa:** nada de CDN, Google Fonts ou imagens remotas. Ilustrações em SVG, CSS ou canvas, originais.
10. **Desempenho:** canvas e loops pausam fora da tela e com a aba oculta; efeitos pesados iniciam sob demanda.
11. **Originalidade:** nada de marcas, logos, personagens ou artes de jogos e produtos existentes. Desktop 98 é um sistema genérico ("CaioOS"), o Pixel RPG tem arte e nomes próprios.
12. **CSS:** o layout `Estilo.astro` não carrega `global.css`. Cada estilo traz o próprio reset. Regras globais ficam presas a `html[data-estilo="<id>"]`.

## Bibliotecas disponíveis

- `gsap` 3.15, todos os plugins gratuitos: ScrollTrigger, SplitText, ScrambleTextPlugin, TextPlugin, Draggable, InertiaPlugin, Flip, DrawSVGPlugin, MotionPathPlugin, Observer, CustomEase.
- `lenis` 1.3 (rolagem suave), `roughjs` 4.6 (traço à mão).
- Fontes (`@fontsource`, arquivos em `node_modules/<pacote>/files/*-latin-*.woff2`): Orbitron, Chakra Petch, Share Tech Mono, Playfair Display, Fraunces, Source Serif 4, Inter, Inter Tight, Geist, Geist Mono, JetBrains Mono, IBM Plex Mono, Press Start 2P, VT323, Pixelify Sans, Silkscreen, Space Grotesk, Archivo Black, UnifrakturMaguntia, Old Standard TT, Caveat, Patrick Hand, Rajdhani.

## Os dez estilos

A pesquisa partiu de listas de tendências de portfólio para 2026 (terminal, neo-brutalismo, retrofuturismo, portfólios "gamificados", minimalismo escuro e glassmorphism), dos portfólios premiados no Awwwards e dos movimentos de design clássicos que viraram referência para portfólios (Estilo Tipográfico Internacional, jornal impresso, interfaces dos anos 90).

| # | Estilo | Ideia central | Interação assinatura |
| :- | :- | :- | :- |
| 01 | Cyberpunk | HUD neon de uma cidade noturna: painéis chanfrados, glitch RGB, linhas de varredura | nome com glitch, texto que se decifra (ScrambleText), projetos como "contratos" |
| 02 | Executivo | Relatório anual de consultoria: serifa, azul-marinho, dourado com parcimônia | números em destaque com contagem, capítulos numerados, folha de impressão que vira CV |
| 03 | Pixel RPG | Tela de título de RPG 8/16 bits com arte original | "PRESS START", diálogo com máquina de escrever, ficha de personagem, inventário, sons opcionais |
| 04 | Terminal | Shell em fósforo verde num CRT | comandos reais (`help`, `projetos`, `neofetch`…), autocompletar, histórico, temas de fósforo |
| 05 | Neo-brutalista | Bordas pretas grossas, sombras duras, cores chapadas | adesivos arrastáveis, botões que afundam, letreiro rolante |
| 06 | Suíço | Cartaz tipográfico: grade de 12 colunas, tipo enorme, vermelho de sinalização | grade visível (tecla G), revelação linha a linha |
| 07 | Bento | Moderno escuro: grade de cartões, vidro, gradientes | brilho que segue o cursor, contagem, copiar e-mail, rolagem suave |
| 08 | Desktop 98 | Sistema operacional dos anos 90 ("CaioOS") | janelas arrastáveis, barra de tarefas, menu Iniciar, relógio |
| 09 | Jornal | Primeira página de jornal impresso | manchete, colunas justificadas, capitular, classificados, previsão do tempo |
| 10 | Caderno | Caderno pautado com letra à mão | traços rough.js que se desenham na rolagem, post-its, fita adesiva, anotações na margem |

## Verificação

Com o servidor de desenvolvimento rodando (`astro dev --background`):

```sh
node scripts/captura.mjs estilo/pixel/ saida.png --full --scroll --axe
node scripts/captura.mjs estilo/pixel/ saida-celular.png --mobile --full
node scripts/captura.mjs estilo/pixel/ saida-reduzido.png --reduced
```

`npm run test:e2e` cobre todos os estilos em `tests/e2e/estilos.spec.ts`.

## Fontes da pesquisa

- [Portfolio design trends for 2026 (Envato)](https://elements.envato.com/learn/portfolio-trends)
- [Top Web Design Trends for 2026 (Figma)](https://www.figma.com/resource-library/web-design-trends/)
- [Modern Web Design Trends Developers Should Know in 2026 (DEV)](https://dev.to/lifecraft_studio/modern-web-design-trends-developers-should-know-in-2026-52ah)
- [Portfolio Design Trends for 2026 (RemoteWorks)](https://remoteworks.pro/blog/portfolio-design-trends-2026)
- [Awwwards: categoria Portfólio](https://www.awwwards.com/websites/website_category_portfolio/)
- [GSAP 3.13: todos os plugins gratuitos](https://gsap.com/blog/3-13/)
