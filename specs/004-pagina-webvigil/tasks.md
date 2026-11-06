---
feature: Página do WebVigil — revisão completa de texto, fatos, imagens, links, botões, estrutura e formatação, em português e em inglês
status: em andamento
date: 2026-11-06
related: [002-tema, 003-medicao]
origin: conception
---

# 004 — Página do WebVigil — Tasks

Sugestão de entrega: uma branch e um PR por etapa, cada um com o portão de qualidade verde. Em toda etapa, o
portão é `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, e o resultado real
fica anotado na última tarefa. Os documentos desta spec entram num PR próprio, antes da Etapa 0. Toda mudança
no tema é conferida também no MailVigil (RF-08, RF-10), nos dois idiomas e nos dois temas; a conferência em
navegador real usa o build servido (`pnpm --filter <site> build` e `preview`), no computador e num celular real,
e o servidor de desenvolvimento serve para programar e ver. Com `PUBLIC_GA_MEASUREMENT_ID=G-TESTE12345` o
build sai com o banner; sem a variável, sem ele, e as duas formas são conferidas onde a etapa toca o rodapé ou
o banner.

A ordem segue o acordado: a estrutura fecha primeiro (Etapas 0 a 4), depois entram as imagens e a saída do
terminal (Etapa 5), e só então os textos são revistos e aprovados (Etapa 6), porque a escala e a largura mudam a
quebra das linhas. A Etapa 5 roda um scan ativo no app de teste da ferramenta e só começa com a autorização do
mantenedor na hora.

## Etapa 0 — Spike e escala tipográfica

- [x] Spike da reserva do banner: num build de teste com a CSP do deploy (`style-src 'self'`) emitida como cabeçalho ou `<meta>`, conferir em Chrome se `document.body.style.setProperty("--altura-consentimento", "123px")` é aplicado e não gera violação de CSP. Registrar a decisão aqui: se for barrado, o plano é a contingência do design (reserva por faixa de largura, valores medidos nos dois idiomas). — RF-11, ADR-6
  - **Decisão do spike (2026-11-06):** `document.body.style.setProperty("--altura-consentimento", "123px")` é aplicado (o valor volta em `getComputedStyle`) e não gera violação de CSP com a política de `scripts/csp.mjs` emitida como cabeçalho HTTP (`style-src 'self'`, build com medição, Chrome real). Controle: `setAttribute("style", ...)` no mesmo documento é barrado (`style-src-attr`). A reserva medida fica como no design; a contingência por faixa de largura é dispensada.
- [x] Medição de partida: em Chrome real, anotar nesta spec o tamanho calculado de cada papel de texto (corpo, abertura, subtítulo, código, legenda, rótulo, nome do produto, título de "O que ele não faz") e a altura da página nos dois sites a 390 e 1280 px, para comparar no fim. — RF-10, RNF-02
  - **Medição de partida (2026-11-06, Chrome real, build com medição, viewport 390 e 1280 px; tamanhos calculados, em px):**

    | Papel                                         | 390 px | 1280 px |
    | --------------------------------------------- | ------ | ------- |
    | Corpo, itens dos grupos, texto dos limites    | 15     | 15      |
    | Abertura das seções (`.lead`)                 | 15     | 15      |
    | Apoio do topo                                 | 17     | 19      |
    | Subtítulos (passos, grupos)                   | 18     | 18      |
    | Título do aviso                               | 17     | 17      |
    | Texto dos passos e do aviso                   | 14,5   | 14,5    |
    | Código dos passos (blocos e em linha)         | 12,76  | 12,76   |
    | Comando                                       | 14     | 14      |
    | Terminal                                      | 12,5   | 13,5    |
    | Legenda da captura, linha fina do topo        | 13     | 13      |
    | Rodapé                                        | 13,5   | 13,5    |
    | Rótulos em maiúsculas ("Passo N", "Opcional") | 11     | 11      |
    | Nome do produto (`.marca`)                    | 20     | 20      |
    | Título de "O que ele não faz"                 | 20     | 22      |

    Altura da página (px), 390 / 1280: WebVigil pt 5064 / 4241, en 5110 / 4263; MailVigil pt 4630 / 3634, en 4522 / 3612.
- [x] `packages/tema/src/estilos/tokens.css`: tokens de tamanho `--fs-rotulo` (12 px), `--fs-codigo` (14), `--fs-corpo` (16), `--fs-abertura` (18) e `--fs-marca` (22), com o comentário do papel de cada um. — RF-10, ADR-4
- [x] `packages/tema/src/estilos/base.css`: corpo de 16 px (`--fs-corpo`), e o código em linha a 0,875 do texto ao redor. — RF-10
- [x] Componentes do tema: trocar cada tamanho solto pelo token do papel, conforme a tabela do design (`Passos`, `Grupos`, `Aviso`, `Topo`, `Secao`, `Comando`, `Terminal`, `FiguraRelatorio`, `Rodape`, `Cabecalho`, `Limites`, `ChamadaFinal`, `SeletorIdioma`, `Consentimento` e `terminal.css`). Nenhum `font-size` com valor numérico fica de fora, salvo os títulos (`h1` e `h2` das seções), que não mudam. — RF-10, ADR-4
- [x] Conferir em Chrome real, nos dois sites, a 360, 390, 430, 768 e 1280 px, claro e escuro: o tamanho calculado de cada papel é o da tabela, nada quebra, corta ou estoura, e o MailVigil continua correto. — RF-10, RNF-02
- [x] Portão de qualidade. — Anotar o resultado real e os tamanhos medidos.
  - **Resultado (2026-11-06):** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (todos os testes passam) e `pnpm build` verdes, e o build dos dois sites com `G-TESTE12345` também. Tamanhos medidos em Chrome real em 40 combinações (dois sites, pt e en, claro e escuro, 360, 390, 430, 768 e 1280 px): todos os papéis na escala (corpo 16, abertura e subtítulos 18, código e texto fino 14, rótulos 12, marca e título de limites 22, terminal 12 no celular e 14 no desktop, código em linha 14), sem rolagem horizontal da página e sem elemento fora da tela. Altura da página (px), 390 / 1280: WebVigil pt 5323 / 4336, en 5346 / 4360; MailVigil pt 4826 / 3743, en 4730 / 3695.

## Etapa 1 — Estrutura da seção do relatório e medida dos textos

- [x] `packages/tema/src/componentes/Secao.astro`, `Topo.astro`, `Aviso.astro`, `ChamadaFinal.astro`: tirar o teto de largura em `ch` da frase de abertura, do apoio, do texto do aviso e do texto da chamada final; `text-wrap: pretty` nesses textos. — RF-08, ADR-3
- [x] `packages/tema/src/componentes/Limites.astro`: título em cima e texto na largura da caixa, em todas as larguras, sem a grade de duas colunas e sem o teto do texto. — RF-08, ADR-3
- [x] `packages/tema/src/componentes/Aviso.astro` e `FiguraRelatorio.astro`: sem o teto de 960 px; a figura e o aviso ocupam a coluna inteira. — RF-08, ADR-2
- [x] `apps/webvigil/src/componentes/Vitrine.astro`: a seção do relatório em três blocos irmãos (abertura, figura, aviso), um sob o outro, com espaçamento próprio, e a mesma ordem no celular. As imagens ainda são as atuais, provisórias até a Etapa 5. — RF-08, ADR-2
- [x] `packages/tema/src/componentes/Comando.astro`: `.comando:has(> button[hidden])` com `padding: 4px 14px` e `code` com `user-select: all`; conferir por `localhost`, `127.0.0.1` e pelo endereço de rede local, com e sem JavaScript. — RF-06, ADR-8
- [x] `packages/tema/src/componentes/Terminal.astro`: a pista de rolagem no celular (gradientes com `background-attachment: local` e `scroll`, abaixo de 720 px). Conferir no celular real que a sombra aparece só no lado em que há linha escondida. — RF-07
- [x] Conferir em Chrome real, nos dois sites e nos dois idiomas: os textos ocupam a caixa, a seção do relatório empilha em 360 a 1280 px, a caixa "O que ele não faz" empilha, e o MailVigil continua correto. — RF-08, RNF-02
- [x] Portão de qualidade. — Anotar o resultado real.
  - **Resultado (2026-11-06):** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (114 testes) e `pnpm build` verdes, e o build dos dois sites com `G-TESTE12345` também. Conferido em Chrome real no build servido, com a página em iframe de 360, 390, 430, 768 e 1280 px, nos dois sites e nos dois idiomas: sem rolagem horizontal; no WebVigil a abertura, a figura e o aviso ocupam a coluna inteira (305, 335, 375, 657 e 1024 px) e vêm na ordem abertura, figura, aviso; "O que ele não faz" empilha em todas as larguras (texto na largura da caixa); no MailVigil o apoio, a abertura, a figura e o limite seguem a mesma medida. Comando sem botão: preenchimento `4px 14px` e `user-select: all`; com botão, `4px 4px 4px 14px`. Terminal no celular: quatro camadas de fundo, sombra dos dois lados no meio da rolagem e só à direita no início. **Pendente no celular real (mantenedor):** ver a sombra do terminal e o comando em endereço de rede local (HTTP), que o Chrome do computador só simula.

## Etapa 2 — Menu do celular

- [x] `packages/tema/src/textos.ts`: o rótulo do menu em `pt` ("Seções") e em `en` ("Sections"); o teste de paridade existente cobre as duas direções. — RF-06, RF-05
- [x] `packages/tema/src/componentes/Cabecalho.astro`: abaixo de 720 px, `<nav>` com um `<details>`, o ícone de três linhas (SVG de 24 × 24 px, traço de 2 px, 44 × 44 px de alvo, a 8 px do seletor de idioma) e o painel de quatro links de 48 px sob o cabeçalho; o X no estado aberto, com `transform` e respeito a `prefers-reduced-motion`. O menu do desktop fica `display: none` abaixo de 720 px, e só um dos dois existe na árvore de acessibilidade. — RF-06, ADR-1
- [x] `packages/tema/src/scripts/menu.ts`: fecha o painel ao ativar um link, com Esc e ao clicar fora, em arquivo externo; sem ele o menu continua funcionando. — RF-06, RNF-01, ADR-1
- [x] `apps/webvigil/src/componentes/Vitrine.astro` e `apps/mailvigil/src/componentes/Vitrine.astro`: o item "Relatório" na navegação do WebVigil, na ordem da página (Como funciona, Relatório, O que ele faz, Instalar); o MailVigil só ganha o ícone. — RF-06
- [x] Conferir em Chrome real, a 360, 390, 430 e 768 px, nos dois idiomas e temas, com e sem JavaScript: abrir e fechar, fechar por link, Esc e clique fora, Tab e foco, alvo de 44 px, e sem marco `nav` duplicado (axe-core). — RF-06, RNF-02
- [x] Portão de qualidade. — Anotar o resultado real.
  - **Resultado (2026-11-06):** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (114 testes) e `pnpm build` verdes, e o build dos dois sites com `G-TESTE12345` também. Menu conferido em Chrome real (puppeteer-core) no build servido do WebVigil, em 360, 390, 430 e 768 px, em pt e en, claro e escuro, com e sem JavaScript (scripts bloqueados): abaixo de 720 px só o menu existe e só um marco "Seções" fica visível; o botão mede 44 × 44 px, a 8 px do seletor de idioma; o painel abre com os quatro links na ordem Como funciona, Relatório, O que ele faz, Instalar, cada um com 48 px; Esc fecha e devolve o foco ao botão, Enter abre, Tab vai ao primeiro link, clique fora e clique num link fecham (e o link leva ao `#relatorio`); sem JavaScript o `<details>` abre e fecha pelo botão; a 768 px aparece só a navegação em linha. O ícone vira X aberto. `axe-core` com o menu aberto: sem violação, depois de trocar o `<aside>` do aviso por um `<div>` (`landmark-complementary-is-top-level`, defeito da Etapa 1). O MailVigil usa o mesmo cabeçalho e ganha só o ícone (build verde).

## Etapa 3 — Reserva de rolagem do banner

- [x] `packages/tema/src/scripts/consentimento.ts`: com o banner aberto, medir o cartão (`ResizeObserver`) e escrever a altura em `--altura-consentimento` no `<body>`; ao fechar, remover a propriedade e a classe. Usa a decisão do spike da Etapa 0. — RF-11, ADR-6
- [x] `packages/tema/src/componentes/Consentimento.astro`: a reserva passa a ser `altura do cartão + margem (12 px no celular, 20 px no desktop) + 16 px`, no lugar dos 300 e 270 px fixos. — RF-11
  - O CSS leva um valor de recuo na própria `var()` (272 px no celular, 234 px no desktop, a altura típica do cartão), usado só se o navegador não tiver `ResizeObserver`: sem ele a reserva fica próxima da de antes, nunca zero.
- [x] Conferir em Chrome real, nos dois idiomas, no celular e no desktop: com o banner aberto, os links do rodapé (incluindo "Gerenciar cookies") ficam livres do cartão e a sobra é a folga de 16 px; depois de escolher, a reserva some e o rodapé termina rente ao fim da página. — RF-11
- [x] Portão de qualidade, nos dois modos (com e sem medição). — Anotar o resultado real.
  - **Resultado (2026-11-06):** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (114 testes) e `pnpm build` verdes, e o build dos dois sites com `G-TESTE12345` também. Conferido em Chrome real (puppeteer-core) no build servido do WebVigil, em pt e en, a 360, 390, 430, 768 e 1280 px, num contexto novo (sem cookie) por combinação: a altura do cartão fica em `--altura-consentimento` (181 px a 390 px em pt, 202 px em en, que quebra uma linha a mais; 202 px a 360 px) e a reserva é a altura mais a margem e 16 px (209 px a 390 px em pt; 217 px a 768 e 1280 px). O fim do rodapé fica 16 px acima do topo do cartão, e o último link, uns 40 px (o preenchimento do próprio rodapé); a página não ganha rolagem horizontal. Ao reabrir pelo "Gerenciar cookies" o cartão cresce 31 px (linha "Sua escolha atual") e a reserva acompanha (`ResizeObserver`). Ao escolher ou fechar com Esc, a propriedade e a classe saem, o preenchimento volta a 0 e o rodapé termina rente ao fim da janela (diferença de até 0,4 px, arredondamento). Sem erro de script em nenhuma combinação. O MailVigil usa o mesmo componente e o mesmo script (build verde nos dois modos).

## Etapa 4 — Links, destinos e verificação mecânica

- [x] `scripts/verificar-dist.test.mjs`: escrever primeiro os casos novos, com HTML montado no teste: link interno para `id` inexistente reprovado; dois botões da mesma página com o mesmo destino externo reprovados, salvo o par "Ver no GitHub" do topo e do fim; página sem esses problemas aprovada. — RF-06, ADR-9
- [x] `scripts/verificar-dist.mjs`: conferir que todo link interno aponta para um `id` existente e a regra dos destinos externos repetidos. — RF-06, ADR-9
  - O par aceito é o dos dois botões primários (o "Ver no GitHub" do topo e o do fim), não "primeiro e último botão": o último botão da página é "Ler a documentação". O fragmento (`#readme`) não distingue destinos, porque a página aberta é a mesma.
- [x] `apps/webvigil/src/componentes/Vitrine.astro`: "Ler a documentação" aponta para a pasta `docs/` do repositório da ferramenta; "Ver no GitHub" e o aviso do painel mantêm os destinos de hoje no idioma da página; conferir cada destino abrindo o link. — RF-06, ADR-8
  - Destinos abertos em 2026-11-06, todos com resposta 200: README em inglês, `README.pt-BR.md`, `docs/` e a seção "Web UI" (âncora `#web-ui`, existente nos dois READMEs). O MailVigil tinha o mesmo destino repetido ("Ler a documentação" = README); a regra nova o pegaria no build, então ele também aponta para `docs/`, que existe no repositório dele.
- [x] `apps/webvigil/src/textos.test.ts` (e o equivalente do MailVigil, se cabível): teste do tamanho do título (até 60 caracteres) e da descrição (até 160) de cada idioma. — RF-09
- [x] Portão de qualidade. — Anotar o resultado real.
  - **Resultado (2026-11-06):** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (132 testes) e `pnpm build` verdes, e o build dos dois sites com `G-TESTE12345` também; o `verificar-dist` reprovou o par errado da primeira versão da regra e passou depois da correção.

## Etapa 5 — Capturas e saída do terminal regeradas

Só começa com a autorização do mantenedor na hora, porque o scan ativo escreve no app de teste.

- [x] Preparar o ambiente: instalar a versão publicada mais recente do WebVigil (`pipx` ou `uv`), registrar o número da versão aqui, subir o app de teste do repositório da ferramenta (`scripts/serve-fixture-app.py`, porta 9100) e rodar o comando mostrado no terminal da página (`webvigil scan http://127.0.0.1:9100 --mode active --authorized-by "trying WebVigil"`), gerando o JSON e o relatório HTML. — RF-07 Feito: WebVigil 1.2.0 (publicado no PyPI), instalado num ambiente isolado; app de teste do repositório da ferramenta na porta 9100; scan ativo rodado três vezes (terminal, JSON e HTML), as três com a mesma contagem: 4 críticos, 15 altos, 9 médios, 15 baixos e 2 informativos, 50 páginas, aviso do orçamento de 650 requisições.
- [x] `apps/webvigil/src/terminais.ts`: a saída real do scan, com a linha do achado crítico (injeção de comando) no trecho, na mesma contagem do relatório; conferir que a saída cabe nas faixas do `terminal.css` (120 caracteres de comando, 80 linhas). — RF-07, ADR-5 Feito: o trecho ganhou a linha do achado crítico (injeção de comando no parâmetro `host`), na ordem real da saída, com `…` entre os grupos; a tabela é a da saída real. Cabe nas faixas do `terminal.css`.
- [x] Capturas do relatório: aberto numa janela de 1024 px (desktop) e de 360 px (celular), a 2x, claro e escuro, cortado nas bordas do conteúdo do relatório e no fim do primeiro achado crítico; quatro arquivos em `apps/webvigil/src/assets/relatorio/`, substituindo os atuais. — RF-07, ADR-5 Feito: 1024 px (960 de conteúdo, 1920 × 2088) e 360 px (720 × 2174), a 2x, claro e escuro, cortadas nas bordas do `<main>` e no fim do primeiro achado crítico. No celular a captura omite a seção "Detected technologies" e os links de referência, porque a lista de CVEs e os links longos estouram a coluna do relatório a 360 px e a imagem mostraria bloco cortado.
- [x] Conferir cada captura contra a página: texto de 16 px ou mais no desktop e de 14 px ou mais no celular, sem margem vazia nem bloco cortado no meio, as contagens da legenda e do texto alternativo batendo, e o terminal contando a mesma história. Anotar o peso de cada arquivo; se o Lighthouse estourar o limite de peso, converter para WebP. — RF-07, RNF-04 Feito: a 360 px a figura aparece com 318 px de largura (escala 0,88, texto de cerca de 14 px); a 1280 px, com 1022 px de largura (escala 1,06, texto de 17 px); sem rolagem horizontal. Contagens da legenda, do texto alternativo e do terminal batem. Pesos: 194 KB e 193 KB (celular, escuro e claro), 257 KB e 259 KB (desktop); não foi preciso converter para WebP. O texto alternativo agora diz que o jQuery só aparece na versão de tela larga.
- [x] `apps/webvigil/src/componentes/Vitrine.astro`: importar as imagens novas; `width` e `height` vêm do `ImageMetadata`. — RF-07 Feito: os quatro arquivos mantêm os nomes, então os imports não mudaram; `width` e `height` vêm do `ImageMetadata`.
- [x] Portão de qualidade e Lighthouse nos quatro perfis (os dois sites, celular e desktop). — Anotar o resultado real. Feito: Prettier, ESLint, typecheck, testes e build dos dois sites passam, com `verificar-dist` sem problemas; Lighthouse CI nos quatro perfis (os dois sites, celular e desktop) sem erro nem aviso.

## Etapa 6 — Fatos e textos

- [ ] `specs/004-pagina-webvigil/fatos.md`: o inventário das afirmações factuais de `textos.ts` e `terminais.ts` (pré-requisito de Python, comandos e flags, formatos de relatório, o que cada modo faz e exige, itens de cada grupo, limites, o painel e onde se obtém), cada uma com a fonte consultada e o resultado: confere, corrigida ou removida. Registrar a versão consultada da ferramenta e o resultado de cada comando copiável (o pacote existe com esse nome e a flag existe). — RF-02, RF-06
- [ ] Opt-ins: listar no inventário os itens que só rodam com flag (`--stored-xss`, `--file-upload`, XXE e os demais que a fonte mostrar), e deixar o texto de cada um dizendo que é opt-in, com a mesma clareza; o modo ativo diz o que exige e que é para desenvolvimento e homologação; a afirmação do modo seguro vale para tudo o que a página lista sob ele. — RF-03
- [ ] Inventário de achados de texto (RF-01): a lista dos problemas de redação e de termos (nomes diferentes para o painel, termos em inglês sem regra, ausência de aviso de opt-in, legenda sobre o idioma do relatório), cada um corrigido, descartado com o motivo ou levado ao mantenedor. — RF-01, RF-04
- [ ] Revisão em português, bloco a bloco (título e descrição, topo, passos, relatório e aviso do painel, grupos "Modo seguro" e "Modo ativo", limites e chamada final, legenda e texto alternativo da captura, rótulo de "Ler a documentação" dizendo que a documentação está em inglês): o mantenedor corrige e aprova cada bloco, e o resultado fica registrado aqui. — RF-04, RF-06
- [ ] Revisão em inglês, depois do português aprovado: diz o mesmo, nada a mais e nada a menos, em inglês natural; o mantenedor aprova bloco a bloco. A versão em português legenda a saída do terminal e o relatório como estando em inglês. — RF-05
- [ ] `apps/webvigil/src/textos.ts`: os textos aprovados; a paridade nas duas direções, inclusive a quantidade de itens de cada lista, passa. — RF-05, RF-09
- [ ] Portão de qualidade. — Anotar o resultado real e conferir que as quebras de linha finais não deixam palavra solta nem corte feio nos dois idiomas, em 360 a 1280 px.

## Etapa 7 — Verificação final e fechamento

- [ ] Inventário final (RF-01): em Chrome real, nas larguras 360, 390, 430, 768 e 1280 px, claro e escuro, nos dois idiomas, com o servidor de desenvolvimento e com o build, com e sem JavaScript, por `localhost` e pelo endereço de rede, e num celular real: cada achado fica corrigido, descartado com o motivo ou levado ao mantenedor. — RF-01, RNF-02
- [ ] axe-core em todas as combinações (os dois sites, dois idiomas, dois temas, as larguras), sem violação; contraste de 4,5:1 e alvos de toque; Tab e foco do menu; leitor de tela (NVDA) nas páginas alteradas, dizendo a cobertura real. — RNF-02
- [ ] Lighthouse CI nos quatro perfis, dentro dos limites do projeto; peso e desempenho das imagens novas. — RNF-02, RNF-04
- [ ] `verificar-dist` com e sem medição, nos dois sites: sem inline, sem `style=`, dentro da CSP, âncoras e destinos. — RNF-01
- [ ] `/auditoria-interface` nos arquivos tocados, e conferência das regras de desenho (rótulo do botão no centro, proporção, alinhamento). — RNF-02
- [ ] Documentação: `CLAUDE.md` (lista de componentes e scripts, o `menu.ts`, a escala), `docs/stack.md`, os dois READMEs, e `specs/README.md` com a linha da 004 em `concluído`. — RNF-05
- [ ] Marcar a spec como `concluído` (requisitos, design e tasks) e conferir o teste de impessoalidade. — RNF-05
- [ ] Portão de qualidade completo. — Anotar o resultado real.
