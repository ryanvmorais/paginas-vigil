---
feature: Tema compartilhado — tokens, fontes, layout bilíngue e componentes dos dois sites
status: em andamento
date: 2026-11-05
related: [001-fundacao]
origin: conception
---

# 002 — Tema — Tasks

Sugestão de entrega: uma branch e um PR por etapa, cada um com o portão de qualidade verde. Em toda etapa, o
portão é `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, e o resultado real
fica anotado na última tarefa. Para acompanhar o visual no `pnpm --filter webvigil dev` (ou `mailvigil`), a
vitrine da Etapa 2 em diante é a superfície de verificação.

## Etapa 0 — Lógica pura: ajuda de idioma e textos do tema

- [x] `packages/tema/src/caminhos.test.ts`: escrever primeiro os casos de `caminhoNoIdioma` e `outroIdioma`: `/` ↔ `/en/`, `/x/` ↔ `/en/x/`, sem barra final, `/en` sem barra, idempotência. — RF-04, RNF-04
- [x] `packages/tema/src/caminhos.ts`: `outroIdioma(idioma)` e `caminhoNoIdioma(caminho, idioma)`, funções puras, com o cabeçalho `@file` e a documentação no padrão de `idiomas.ts`. — RF-04, ADR-1
- [x] `packages/tema/src/textos.ts`: dicionários `pt` e `en` do tema (rótulos do seletor de idioma, do botão de copiar e do aviso de copiado, do rótulo da navegação), tipados com `Dicionario`. — RF-10
- [x] `packages/tema/src/textos.test.ts`: `chavesFaltantes` nas duas direções entre `pt` e `en`. — RF-10, RNF-04
- [x] `packages/tema/package.json`: mapa `exports` com `./idiomas`, `./caminhos`, `./textos`, `./layouts/*` e `./componentes/*`, e `astro` em `peerDependencies` (versão do `catalog:`). — ADR-1
- [x] Portão de qualidade. — `format:check`, `lint`, `typecheck`, `test` (21 testes em 4 arquivos) e `build` verdes.

## Etapa 1 — Estilos, fontes, sem inline e verificação do HTML

- [x] Spike do `astro check` no pacote: tentar `typecheck: astro check` em `packages/tema` (com `@astrojs/check` e `typescript` do `catalog:` e um `astro.config.mjs` mínimo); se não rodar sem páginas, manter `tsc --noEmit` e registrar a decisão aqui. — ADR-1
      **Decisão: `astro check` roda no pacote** e acusa erro de tipo dentro de um `.astro` de teste. Imprime o aviso inofensivo "Missing pages directory", e o `astro.config.mjs` do tema explica isso. O tema ganhou `astro`, `@astrojs/check` e `typescript` em `devDependencies`.
- [x] `packages/tema/src/fontes/`: gerar os subconjuntos `woff2` de Sora 800, JetBrains Mono 400 e 700 (latim, latim-1, pontuação e, na JetBrains Mono, U+2500 a U+257F), com a licença OFL e um `LEIAME.md` do procedimento de regeração. — RF-02, ADR-3
- [x] `packages/tema/src/estilos/fontes.css`: `@font-face` das três fontes com `font-display: swap` e fonte de reserva de métrica parecida. — RF-02, RNF-03
- [x] `packages/tema/src/estilos/tokens.css`: as variáveis do `:root` do mockup, claro e escuro por `prefers-color-scheme`, e `data-produto` para o acento; sem `--sev-*`. — RF-01
- [x] `packages/tema/src/estilos/base.css`: reset, corpo, `:focus-visible`, `.envoltorio`, sem rolagem horizontal da página. — RNF-02
- [x] `scripts/verificar-dist.mjs` e `scripts/verificar-dist.test.mjs`: função que recebe o HTML e devolve os problemas (`<script>` sem `src`, `<style>`, `style=`, e em página com `hreflang` a falta de `lang`, `canonical`, do trio `alternate` ou de `og:locale`), com o teste usando HTML montado no próprio teste; o executável varre `dist/` e sai com código 1 se achar algo. — RNF-01, ADR-2
- [x] `apps/*/astro.config.mjs` e `apps/*/package.json`: `build.inlineStylesheets: "never"`, `vite.build.assetsInlineLimit: 0` e o `build` como `astro build && node ../../scripts/verificar-dist.mjs dist`. — RNF-01, ADR-2
- [x] Portão de qualidade. — `format:check`, `lint`, `typecheck`, `test` (38 testes em 5 arquivos, 17 deles do `verificar-dist`) e `build` (com o `verificar-dist` rodando nos dois sites) verdes.

## Etapa 2 — Layout, cabeçalho, botão e comando (o topo da página)

- [ ] `packages/tema/src/layouts/Pagina.astro`: `<html lang data-produto>`, `<head>` com `title`, `description`, `canonical`, `alternate` (`pt-BR`, `en`, `x-default` → `/en/`), `og:*`, `og:locale` e `og:locale:alternate`, `color-scheme`, `preload` das fontes do topo, `og:image` só com `imagemSocial`; importa os três CSS globais. — RF-01, RF-03, ADR-1
- [ ] `packages/tema/src/componentes/SeletorIdioma.astro` e `Cabecalho.astro`: logo (slot) e nome, navegação só a partir de 720 px, seletor PT · EN com links reais, o atual em `aria-current="page"`, sem botão do GitHub. — RF-05, ADR-5
- [ ] `packages/tema/src/componentes/Botao.astro`: `<a>` primário e secundário, largura total até 560 px, `min-height: 48px`, rótulo centralizado. — RF-06
- [ ] `packages/tema/src/componentes/Comando.astro` e `packages/tema/src/scripts/copiar.ts`: `<code>` e botão `hidden`, que o script revela só com `navigator.clipboard`, copia e anuncia o resultado em `role="status"`. — RF-07, RNF-01
- [ ] `apps/*/src/pages/index.astro` e `en/index.astro`: vitrine do topo (título, texto de apoio, dois botões, comando, linha fina) com texto sintético, nos dois idiomas e nos dois produtos. — RF-03, RF-05, RF-06, RF-07, ADR-6
- [ ] Conferir o topo no `pnpm dev` a 390 e a 1280 px, claro e escuro, e rodar o `verificar-dist` no build. — RF-01, RNF-02
- [ ] Portão de qualidade. — _resultado a registrar_

## Etapa 3 — Terminal animado e blocos de seção

- [ ] `packages/tema/src/componentes/Terminal.astro` e `src/estilos/terminal.css`: `figure` com rótulo, `<pre>` que rola na horizontal, comando em `span.digita` e saída em `span.saida`; o componente conta os caracteres do comando e as linhas da saída (`Astro.slots.render`), escolhe as classes `.n-*` e `.l-*` por faixa e falha o build se o valor passar da faixa. — RF-08, ADR-4
- [ ] `terminal.css`: digitação por `width` em `ch` com `steps()` e revelação da saída por `clip-path` com `steps()`, só em `prefers-reduced-motion: no-preference`, uma vez, no máximo cerca de 3 s, sem deslocar o layout. — RF-08, RNF-03, ADR-4
- [ ] `packages/tema/src/componentes/Secao.astro`, `Passos.astro` e `Grupos.astro`: seção com título e `lead`, passos numerados em três colunas a partir de 720 px, dois grupos de itens sem cartões. — RF-09
- [ ] `packages/tema/src/componentes/FiguraRelatorio.astro`: `<picture>` com `source` por esquema de cor e largura, `width` e `height` vindos de `ImageMetadata`, `alt` e legenda. — RF-09, RNF-03
- [ ] `packages/tema/src/componentes/Aviso.astro`, `Limites.astro` e `ChamadaFinal.astro`: bloco de aviso opcional, bloco com borda em duas colunas a partir de 720 px, chamada final centralizada com botões em slot. — RF-09
- [ ] `packages/tema/src/componentes/Rodape.astro`: nome e licença, link do outro produto, seletor de idioma e slot para o item extra. — RF-09
- [ ] `apps/*/src/pages/index.astro` e `en/index.astro`: completar a vitrine com terminal (saída sintética com tabela de moldura), passos, relatório (imagem sintética em quatro variantes), grupos, limites, aviso, chamada final e rodapé. — RF-08, RF-09, ADR-6
- [ ] Portão de qualidade. — _resultado a registrar_

## Etapa 4 — Verificação em navegador real e fechamento

- [ ] Conferir a vitrine dos dois sites a 360, 390, 430 e 1280 px, claro e escuro, com o `axe-core` e medindo o desenho: contraste, alvos de toque, proporção dos controles, rótulo centralizado, rolagem horizontal, alinhamento da tabela de moldura. — RNF-02, RF-06, RF-08
- [ ] Conferir a leitura por leitor de tela com o NVDA: idioma, seletor, botão de copiar, rótulo do terminal. — RNF-02, RF-05, RF-07
- [ ] Rodar o Lighthouse CI localmente (ou no PR) sobre a vitrine e ajustar até os limites de erro passarem: CLS abaixo de 0,1, sem erro no console, acessibilidade, boas práticas e SEO acima de 0,95. — RNF-03
- [ ] `CLAUDE.md` (arquitetura do tema e o `verificar-dist`), `docs/stack.md`, `README.md` e `README.en.md` se descreverem a estrutura, e `specs/README.md` (linha da `002-tema` no roadmap e a nota de manutenção "sem inline"). — RNF-01
- [ ] Marcar `status: concluído` nos três arquivos da spec. — RF-01 a RF-10
- [ ] Portão de qualidade final. — _resultado a registrar_
