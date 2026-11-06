---
feature: Página do MailVigil — revisão completa de fatos, texto, imagens, links, botões e estrutura, em português e em inglês
status: em andamento
date: 2026-11-06
related: [002-tema, 003-medicao, 004-pagina-webvigil]
origin: conception
---

# 005 — Página do MailVigil — Tasks

Sugestão de entrega: uma branch e um PR por etapa, cada um com o portão de qualidade verde. Em toda etapa, o
portão é `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, e o resultado real
fica anotado na última tarefa. Os documentos desta spec entram num PR próprio, antes da Etapa 0. O tema não
deve mudar nesta spec; se uma tarefa o tocar, ela é conferida também no WebVigil (RF-08), nos dois idiomas e nos
dois temas. A conferência em navegador real usa o build servido (`pnpm --filter <site> build` e `preview`), no
computador e num celular real, e o servidor de desenvolvimento serve para programar e ver. Com
`PUBLIC_GA_MEASUREMENT_ID=G-TESTE12345` o build sai com o banner; sem a variável, sem ele, e as duas formas são
conferidas onde a etapa toca o rodapé ou o banner.

A ordem segue a dependência (design, "Visão geral"): primeiro os fatos e a versão consultada (Etapa 0), depois o
menu (Etapa 1), a saída do terminal e as capturas (Etapa 2) e, por fim, os textos revistos e aprovados (Etapa 3),
porque a quebra das linhas depende do que já está na página. Nenhuma etapa escreve em alvo nenhum: os relatórios
são sintéticos (ADR-3). Uma tarefa que proponha interface nova para e abre mockup em 390 e 1280 px antes do
código (design, "Mockup").

## Etapa 0 — Fatos e versão consultada

- [x] Registrar a versão consultada: a mais recente do MailVigil publicada no PyPI no momento, igual à tag do repositório da ferramenta, com `requires-python` e licença. Executar o pacote de forma efêmera (`uvx --from mailvigil==<versão> mailvigil …`) e conferir o `--help` de `summary`, `verdict` e `fetch`. — RF-02
- [x] Preparar os relatórios sintéticos: extrair a tag da versão consultada numa pasta temporária fora dos repositórios (`git archive`), rodar o gerador `docs/demo/build_demo.py` e deixar a pasta de relatórios de `example.com` (o período não pronto e o pronto) e o `mailvigil.toml` do exemplo. O repositório da ferramenta não é alterado. — RF-07, ADR-3
- [x] Executar cada comando copiável da página na ordem dos passos, contra a pasta sintética, e anotar o resultado: o pacote existe com esse nome, cada flag existe, o comando funciona. Incluir: o passo 2 sem `mailvigil.toml` na pasta (com `--config` e, como alternativa, com `--domain`), o código de saída de cada resposta (0, 3 e 4) e o `--html` do passo 3, com e sem `--lang pt-BR`. — RF-06, ADR-1
- [x] Executar o passo 2 em português e em inglês num terminal UTF-8 e anotar os rótulos reais do veredito e das colunas das regras em cada idioma, com e sem acentos (saída para terminal e para pipe). — RF-04, RF-05, ADR-2, ADR-5
- [x] `specs/005-pagina-mailvigil/fatos.md`: o inventário das afirmações factuais de `textos.ts` e `terminais.ts` (pré-requisito de Python, instalação, comandos e flags, formatos lidos, idioma e acentos da saída, as cinco regras e seus limites, códigos de saída, o que usa a rede, os limites contra arquivos hostis, o contrato de estabilidade, o que a ferramenta não faz, licença), cada uma com a fonte consultada e o resultado: confere, corrigida ou removida, mais a versão consultada e o resultado de cada comando. As correções propostas não entram nos textos antes da revisão. — RF-02, RF-03
- [x] Destinos externos: conferir cada link da página (README de cada idioma, `docs/`, o DMARC Fácil em cada idioma, o outro produto) e anotar o que ainda não existe como não verificável até o deploy. — RF-06
- [x] Inventário de achados de texto e de estrutura (RF-01), por leitura do código e da página, em Chrome real, a 360, 390, 430, 768 e 1280 px, claro e escuro, nos dois idiomas, comparando com a página do WebVigil: cada achado com local, combinação e classificação (falha objetiva, regra do projeto ou gosto), levado à revisão. — RF-01, RF-08
- [x] Impessoalidade e formatação dos arquivos da spec: `pnpm format:check` e `test/impessoalidade.test.ts`. — RNF-05 — Resultado (2026-11-06): `pnpm format:check` limpo, `pnpm lint` sem erro, `pnpm typecheck` sem erro, `pnpm test` com 11 arquivos e 132 testes passando (inclui `test/impessoalidade.test.ts`). Versão consultada: MailVigil 1.7.0. Achados em `fatos.md`: 14 de texto e estrutura (A-01 a A-14) e 44 afirmações e destinos (F-01 a F-44), levados à revisão.

## Etapa 1 — Menu

- [x] `apps/mailvigil/src/textos.ts`: `navegacao.relatorio` em português ("Relatório") e em inglês ("Report"), com a paridade passando. — RF-06
- [x] `apps/mailvigil/src/componentes/Vitrine.astro`: o item "Relatório" na navegação, na ordem da página (Como funciona, Relatório, O que ele faz, Instalar), apontando para o `id` da seção do relatório, que precisa existir. — RF-06
- [x] Conferir em Chrome real, a 390 e 1280 px, nos dois idiomas: o menu do desktop com quatro itens e o painel do celular com quatro links, cada um levando à seção certa, visível abaixo do cabeçalho. — RF-06 — Resultado (2026-11-06, build servido, Chrome real, 390 e 1280 px, pt e en): quatro itens em cada combinação, cada âncora leva ao topo da seção certa e o painel do celular fecha depois do toque; o cabeçalho não é fixo, então nada o sobrepõe.
- [x] Portão de qualidade e `verificar-dist` (âncoras) nos dois sites. — Resultado (2026-11-06): `pnpm format:check`, `pnpm lint` e `pnpm typecheck` sem erro; `pnpm test` com 11 arquivos e 132 testes passando; `pnpm build` dos dois sites com `verificar-dist: dist sem problemas`.

## Etapa 2 — Saída do terminal e capturas

- [x] `apps/mailvigil/src/terminais.ts`: a saída real do `mailvigil verdict` em cada idioma (`--lang pt-BR` e o padrão), tirada num terminal UTF-8, do mesmo período não pronto do relatório, com as quebras de 80 colunas da ferramenta e o código de saída; conferir que cabe nas faixas do `terminal.css` (120 caracteres de comando, 80 linhas). — RF-07, ADR-2 — Resultado (2026-11-06): saída do `mailvigil verdict` 1.7.0 sobre o período `before` (29 dias) do gerador, em terminal UTF-8, nos dois idiomas; o inglês já era idêntico e o português ganhou os acentos. A página mostra um recorte (veredito, motivo, origem e regras) e a legenda do terminal é revista na Etapa 3; os números (29 dias, 7056 mensagens, 56, 0,8%, `203.0.113.5`) e o código de saída 4 conferem.
- [x] Acentos na fonte do terminal: conferir no build servido que os glifos acentuados saem na fonte da página e com a largura dela, como se fez com a moldura na 004. Se faltar glifo no subconjunto, registrar aqui e tratar numa tarefa própria no tema, conferida nos dois sites. — RF-07, ADR-2 — Resultado (2026-11-06, build servido, Chrome real, 1280 e 390 px): o subconjunto da JetBrains Mono (latim-1) tem todos os acentos do português; no terminal, as linhas acentuadas têm o mesmo avanço do ASCII (8,4 px a 14 px e 7,2 px a 12 px), sem rolagem lateral da página. Nada a tratar no tema.
- [x] Capturas do relatório: o `--html` de cada idioma aberto numa janela de 1024 px (desktop) e de 360 px (celular), a 2x, nos dois temas (`emulateMediaFeatures`, sem alterar o relatório), cortado nas bordas do conteúdo e no fim de um bloco completo; oito arquivos em `apps/mailvigil/src/assets/relatorio/`, nos nomes atuais, substituindo os atuais. — RF-07, ADR-3 — Resultado (2026-11-06): geradas com `puppeteer-core` e o Chrome instalado a partir dos `--html` de `before` (`--lang pt-BR` e padrão), a 1024 e 360 px, a 2x, com `prefers-color-scheme` emulado; corte no fim do cartão das cinco regras (o gráfico dia a dia fica de fora). As anteriores eram de 1280 e 390 px e terminavam no meio do bloco seguinte.
- [x] Conferir cada captura contra a página: texto de 14 px ou mais, sem margem vazia nem bloco cortado no meio, legenda e texto alternativo batendo com o que a imagem mostra, e o terminal contando a mesma história (mesmo veredito, motivo, contagens e alvo), nos dois idiomas. Anotar o peso de cada arquivo; se o Lighthouse estourar o limite, converter para WebP. — RF-07, RNF-04 — Resultado (2026-11-06): o texto de leitura do relatório tem de 14 a 17 px e o veredito 34 px; só os rótulos de apoio ficam abaixo de 14 px (13 px: "Pronto para p=reject?", títulos de grupo e "passa"/"falha"; 12 px: `p`, `sp` e `pct`), tamanhos que são da ferramenta (`html_style.py`), não da página, e a figura sai a 1:1 no desktop e a 0,97x no celular (12 a 12,6 px). Fica como achado de gosto para o mantenedor decidir, junto com a revisão da Etapa 3 (a ferramenta não é alterada nesta spec); sem margem vazia nem bloco cortado; legenda e texto alternativo batem (veredito e cinco regras). Pesos: 182 a 208 KB cada (1,5 MB os oito; a página carrega um por vez, por `picture`), Lighthouse sem aviso de peso. Pendência para a Etapa 3: o `lead` ainda promete "o que aconteceu dia a dia", que a captura não mostra.
- [x] `apps/mailvigil/src/componentes/Vitrine.astro`: conferir os imports das imagens; `width` e `height` vêm do `ImageMetadata`. — RF-07 — Resultado (2026-11-06): os oito imports seguem os nomes; as imagens saem com `width` e `height` do arquivo (2048x1354 no desktop; 720x2752 e 720x2706 no celular), sem deslocamento de layout no Lighthouse.
- [x] Portão de qualidade e Lighthouse nos quatro perfis (os dois sites, celular e desktop). — Anotar o resultado real. — Resultado (2026-11-06): `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` sem erro, `verificar-dist: dist sem problemas` nos dois sites (com medição); Lighthouse CI nos quatro perfis (webvigil e mailvigil, celular e desktop) sem erro e sem aviso.

## Etapa 3 — Fatos e textos

- [ ] Opt-ins e exigências: o que a página diz de `fetch` (única parte que usa a rede, pede a senha), de arquivos hostis e do contrato fica conforme o `fatos.md`, sem contradição com "roda offline". — RF-03
- [ ] Revisão em português, bloco a bloco, com o resultado registrado aqui: o mantenedor corrige e aprova cada bloco. — RF-04, RF-06
  - [ ] Regra de termos (ADR-5) proposta e aprovada no primeiro bloco: o que fica em inglês, o que vai para o português, os rótulos do veredito no idioma da página e um nome por conceito.
  - [ ] Bloco 1: título, descrição e topo.
  - [ ] Bloco 2: passos, com a decisão da ADR-1 sobre o passo 2 (opção A recomendada, B ou C) e o `--lang` e o código de saída do passo 3.
  - [ ] Bloco 3: relatório, legenda e texto alternativo das capturas, no que a imagem regerada mostra.
  - [ ] Bloco 4: grupos "O que ele responde" e "O que ele garante".
  - [ ] Bloco 5: limites, convite ao DMARC Fácil, chamada final e título do terminal.
- [ ] Revisão em inglês, depois do português aprovado: diz o mesmo, nada a mais e nada a menos, em inglês natural; o mantenedor aprova bloco a bloco. — RF-05
- [ ] `apps/mailvigil/src/textos.ts`: os textos aprovados (e o convite ao DMARC Fácil, se mudar); a paridade nas duas direções, inclusive a quantidade de itens de cada lista, e os limites de título e descrição passam. — RF-05, RF-09
- [ ] Portão de qualidade. — Anotar o resultado real e conferir que as quebras de linha finais não deixam palavra solta nem corte feio nos dois idiomas, em 360 a 1280 px.

## Etapa 4 — Verificação final e fechamento

- [ ] Inventário final (RF-01): em Chrome real, nas larguras 360, 390, 430, 768 e 1280 px, claro e escuro, nos dois idiomas, com o servidor de desenvolvimento e com o build, com e sem JavaScript, por `localhost` e pelo endereço de rede, e num celular real: cada achado fica corrigido, descartado com o motivo ou levado ao mantenedor. — RF-01, RNF-02
- [ ] axe-core em todas as combinações (os dois sites, dois idiomas, dois temas, as larguras), sem violação; contraste de 4,5:1 e alvos de toque; Tab e foco do menu; leitor de tela (NVDA, depois de avisar o mantenedor) na página do MailVigil, dizendo a cobertura real. — RNF-02
- [ ] Lighthouse CI nos quatro perfis, dentro dos limites do projeto; peso e desempenho das oito capturas. — RNF-02, RNF-04
- [ ] `verificar-dist` com e sem medição, nos dois sites: sem inline, sem `style=`, dentro da CSP, âncoras e destinos. — RNF-01
- [ ] `/auditoria-interface` nos arquivos tocados, e conferência das regras de desenho (rótulo do botão no centro, proporção, alinhamento). — RNF-02
- [ ] Documentação: `CLAUDE.md`, `docs/stack.md` e os READMEs, só no que a mudança tocar; `specs/README.md` com a linha da 005 em `concluído`. — RNF-05
- [ ] Marcar a spec como `concluído` (requisitos, design e tasks) e conferir o teste de impessoalidade. — RNF-05
- [ ] Portão de qualidade completo. — Anotar o resultado real.
