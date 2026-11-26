# Portfólio — Caio Ferreira

Site pessoal estático em Astro + TypeScript: landing (`/`) com boot, chat de respostas prontas (`/conversa`) e `404`.

## Comandos

Requer Node ≥ 22.23.4.

| Comando           | O que faz                                                       |
| :---------------- | :-------------------------------------------------------------- |
| `npm install`     | Instala as dependências                                          |
| `npm run dev`     | Servidor de desenvolvimento em `localhost:4321`                  |
| `npm run build`   | Gera o site estático em `dist/`                                  |
| `npm run preview` | Serve o `dist/` localmente                                       |
| `npm run check`   | Verificação de tipos (`astro check`)                             |
| `npm run test:unit` | Teste de contraste das paletas (falha se alguma cor cair do mínimo WCAG) |
| `npm run test:e2e` | Testes de navegador (Playwright + axe, Chrome do sistema): título do hero, paletas, efeitos, sem JS, capturas em `test-results/telas/` |
| `npm test`        | Os dois acima                                                    |
| `npm run images`  | Regera `public/og-image.png` e `public/apple-touch-icon.png` (precisa de Chrome ou Edge) |

Para rever o boot de novo na mesma aba: `sessionStorage.removeItem('cf-boot')` no console e recarregar.

## Onde mexer

- **Texto do currículo:** `src/content/perfil.ts`, fonte única lida pela landing e pelo chat.
- **Cores:** `src/styles/palettes.ts`, as quatro paletas (scanner, escuro, vermelho, mono). Depois de mexer, rode `npm run test:unit`. Nenhum componente escreve cor direto.
- **Fontes, medidas e efeitos derivados da paleta:** `src/styles/tokens.css`.
- **Troca de paleta no navegador:** `src/scripts/palette.ts` (`getPalette()` para canvases, evento `palette-change`) e o seletor `src/components/PaletteSwitcher.astro`. Para testar à mão: `document.documentElement.dataset.palette = 'mono'` no console; para limpar a escolha: `localStorage.removeItem('cf-palette')`.
- **Respostas e palavras-chave do chat:** `src/scripts/chat-data.ts`.
- **Animações de pixel:** `src/scripts/pixel-text.ts` (subtítulo e apelido).
- **Boot:** `src/components/Boot.astro` + `src/scripts/boot.ts`. O script inline em `src/layouts/Base.astro` decide se ele aparece.

## Publicação

O site usa `SITE_URL` para canonical, Open Graph, sitemap e robots. Sem essa variável, usa `http://localhost:4321`:

```sh
SITE_URL=https://seu-dominio npm run build
```

## Pendências antes de publicar

- **Domínio:** definir e passar em `SITE_URL`.
- **PDF do currículo:** colocar em `public/curriculo-caio-ferreira.pdf` uma versão **sem telefone**. O botão "Baixar currículo" só aparece quando o arquivo existe.
- **THE LED:** confirmar se os números e sistemas citados (100+ usuários, 400+ holerites, TOTVS, RD Station) podem ficar públicos.
- **Projetos:** se houver repositório ou demo, adicionar em `links` do projeto em `perfil.ts`.
- **Formulário:** hoje abre o aplicativo de e-mail (`mailto:`). Numa segunda fase, trocar por um serviço de envio (ex.: Resend).
- **Teste em aparelho real:** Safari/iOS e Chrome Android.
