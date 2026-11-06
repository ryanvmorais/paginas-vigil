---
feature: Página do WebVigil — revisão completa de texto, fatos, imagens, links, botões, estrutura e formatação, em português e em inglês
status: aprovado
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

- [ ] Spike da reserva do banner: num build de teste com a CSP do deploy (`style-src 'self'`) emitida como cabeçalho ou `<meta>`, conferir em Chrome se `document.body.style.setProperty("--altura-consentimento", "123px")` é aplicado e não gera violação de CSP. Registrar a decisão aqui: se for barrado, o plano é a contingência do design (reserva por faixa de largura, valores medidos nos dois idiomas). — RF-11, ADR-6
- [ ] Medição de partida: em Chrome real, anotar nesta spec o tamanho calculado de cada papel de texto (corpo, abertura, subtítulo, código, legenda, rótulo, nome do produto, título de "O que ele não faz") e a altura da página nos dois sites a 390 e 1280 px, para comparar no fim. — RF-10, RNF-02
- [ ] `packages/tema/src/estilos/tokens.css`: tokens de tamanho `--fs-rotulo` (12 px), `--fs-codigo` (14), `--fs-corpo` (16), `--fs-abertura` (18) e `--fs-marca` (22), com o comentário do papel de cada um. — RF-10, ADR-4
- [ ] `packages/tema/src/estilos/base.css`: corpo de 16 px (`--fs-corpo`), e o código em linha a 0,875 do texto ao redor. — RF-10
- [ ] Componentes do tema: trocar cada tamanho solto pelo token do papel, conforme a tabela do design (`Passos`, `Grupos`, `Aviso`, `Topo`, `Secao`, `Comando`, `Terminal`, `FiguraRelatorio`, `Rodape`, `Cabecalho`, `Limites`, `ChamadaFinal`, `SeletorIdioma`, `Consentimento` e `terminal.css`). Nenhum `font-size` com valor numérico fica de fora, salvo os títulos (`h1` e `h2` das seções), que não mudam. — RF-10, ADR-4
- [ ] Conferir em Chrome real, nos dois sites, a 360, 390, 430, 768 e 1280 px, claro e escuro: o tamanho calculado de cada papel é o da tabela, nada quebra, corta ou estoura, e o MailVigil continua correto. — RF-10, RNF-02
- [ ] Portão de qualidade. — Anotar o resultado real e os tamanhos medidos.

## Etapa 1 — Estrutura da seção do relatório e medida dos textos

- [ ] `packages/tema/src/componentes/Secao.astro`, `Topo.astro`, `Aviso.astro`, `ChamadaFinal.astro`: tirar o teto de largura em `ch` da frase de abertura, do apoio, do texto do aviso e do texto da chamada final; `text-wrap: pretty` nesses textos. — RF-08, ADR-3
- [ ] `packages/tema/src/componentes/Limites.astro`: título em cima e texto na largura da caixa, em todas as larguras, sem a grade de duas colunas e sem o teto do texto. — RF-08, ADR-3
- [ ] `packages/tema/src/componentes/Aviso.astro` e `FiguraRelatorio.astro`: sem o teto de 960 px; a figura e o aviso ocupam a coluna inteira. — RF-08, ADR-2
- [ ] `apps/webvigil/src/componentes/Vitrine.astro`: a seção do relatório em três blocos irmãos (abertura, figura, aviso), um sob o outro, com espaçamento próprio, e a mesma ordem no celular. As imagens ainda são as atuais, provisórias até a Etapa 5. — RF-08, ADR-2
- [ ] `packages/tema/src/componentes/Comando.astro`: `.comando:has(> button[hidden])` com `padding: 4px 14px` e `code` com `user-select: all`; conferir por `localhost`, `127.0.0.1` e pelo endereço de rede local, com e sem JavaScript. — RF-06, ADR-8
- [ ] `packages/tema/src/componentes/Terminal.astro`: a pista de rolagem no celular (gradientes com `background-attachment: local` e `scroll`, abaixo de 720 px). Conferir no celular real que a sombra aparece só no lado em que há linha escondida. — RF-07
- [ ] Conferir em Chrome real, nos dois sites e nos dois idiomas: os textos ocupam a caixa, a seção do relatório empilha em 360 a 1280 px, a caixa "O que ele não faz" empilha, e o MailVigil continua correto. — RF-08, RNF-02
- [ ] Portão de qualidade. — Anotar o resultado real.

## Etapa 2 — Menu do celular

- [ ] `packages/tema/src/textos.ts`: o rótulo do menu em `pt` ("Seções") e em `en` ("Sections"); o teste de paridade existente cobre as duas direções. — RF-06, RF-05
- [ ] `packages/tema/src/componentes/Cabecalho.astro`: abaixo de 720 px, `<nav>` com um `<details>`, o ícone de três linhas (SVG de 24 × 24 px, traço de 2 px, 44 × 44 px de alvo, a 8 px do seletor de idioma) e o painel de quatro links de 48 px sob o cabeçalho; o X no estado aberto, com `transform` e respeito a `prefers-reduced-motion`. O menu do desktop fica `display: none` abaixo de 720 px, e só um dos dois existe na árvore de acessibilidade. — RF-06, ADR-1
- [ ] `packages/tema/src/scripts/menu.ts`: fecha o painel ao ativar um link, com Esc e ao clicar fora, em arquivo externo; sem ele o menu continua funcionando. — RF-06, RNF-01, ADR-1
- [ ] `apps/webvigil/src/componentes/Vitrine.astro` e `apps/mailvigil/src/componentes/Vitrine.astro`: o item "Relatório" na navegação do WebVigil, na ordem da página (Como funciona, Relatório, O que ele faz, Instalar); o MailVigil só ganha o ícone. — RF-06
- [ ] Conferir em Chrome real, a 360, 390, 430 e 768 px, nos dois idiomas e temas, com e sem JavaScript: abrir e fechar, fechar por link, Esc e clique fora, Tab e foco, alvo de 44 px, e sem marco `nav` duplicado (axe-core). — RF-06, RNF-02
- [ ] Portão de qualidade. — Anotar o resultado real.

## Etapa 3 — Reserva de rolagem do banner

- [ ] `packages/tema/src/scripts/consentimento.ts`: com o banner aberto, medir o cartão (`ResizeObserver`) e escrever a altura em `--altura-consentimento` no `<body>`; ao fechar, remover a propriedade e a classe. Usa a decisão do spike da Etapa 0. — RF-11, ADR-6
- [ ] `packages/tema/src/componentes/Consentimento.astro`: a reserva passa a ser `altura do cartão + margem (12 px no celular, 20 px no desktop) + 16 px`, no lugar dos 300 e 270 px fixos. — RF-11
- [ ] Conferir em Chrome real, nos dois idiomas, no celular e no desktop: com o banner aberto, os links do rodapé (incluindo "Gerenciar cookies") ficam livres do cartão e a sobra é a folga de 16 px; depois de escolher, a reserva some e o rodapé termina rente ao fim da página. — RF-11
- [ ] Portão de qualidade, nos dois modos (com e sem medição). — Anotar o resultado real.

## Etapa 4 — Links, destinos e verificação mecânica

- [ ] `scripts/verificar-dist.test.mjs`: escrever primeiro os casos novos, com HTML montado no teste: link interno para `id` inexistente reprovado; dois botões da mesma página com o mesmo destino externo reprovados, salvo o par "Ver no GitHub" do topo e do fim; página sem esses problemas aprovada. — RF-06, ADR-9
- [ ] `scripts/verificar-dist.mjs`: conferir que todo link interno aponta para um `id` existente e a regra dos destinos externos repetidos. — RF-06, ADR-9
- [ ] `apps/webvigil/src/componentes/Vitrine.astro`: "Ler a documentação" aponta para a pasta `docs/` do repositório da ferramenta; "Ver no GitHub" e o aviso do painel mantêm os destinos de hoje no idioma da página; conferir cada destino abrindo o link. — RF-06, ADR-8
- [ ] `apps/webvigil/src/textos.test.ts` (e o equivalente do MailVigil, se cabível): teste do tamanho do título (até 60 caracteres) e da descrição (até 160) de cada idioma. — RF-09
- [ ] Portão de qualidade. — Anotar o resultado real.

## Etapa 5 — Capturas e saída do terminal regeradas

Só começa com a autorização do mantenedor na hora, porque o scan ativo escreve no app de teste.

- [ ] Preparar o ambiente: instalar a versão publicada mais recente do WebVigil (`pipx` ou `uv`), registrar o número da versão aqui, subir o app de teste do repositório da ferramenta (`scripts/serve-fixture-app.py`, porta 9100) e rodar o comando mostrado no terminal da página (`webvigil scan http://127.0.0.1:9100 --mode active --authorized-by "trying WebVigil"`), gerando o JSON e o relatório HTML. — RF-07
- [ ] `apps/webvigil/src/terminais.ts`: a saída real do scan, com a linha do achado crítico (injeção de comando) no trecho, na mesma contagem do relatório; conferir que a saída cabe nas faixas do `terminal.css` (120 caracteres de comando, 80 linhas). — RF-07, ADR-5
- [ ] Capturas do relatório: aberto numa janela de 1024 px (desktop) e de 360 px (celular), a 2x, claro e escuro, cortado nas bordas do conteúdo do relatório e no fim do primeiro achado crítico; quatro arquivos em `apps/webvigil/src/assets/relatorio/`, substituindo os atuais. — RF-07, ADR-5
- [ ] Conferir cada captura contra a página: texto de 16 px ou mais no desktop e de 14 px ou mais no celular, sem margem vazia nem bloco cortado no meio, as contagens da legenda e do texto alternativo batendo, e o terminal contando a mesma história. Anotar o peso de cada arquivo; se o Lighthouse estourar o limite de peso, converter para WebP. — RF-07, RNF-04
- [ ] `apps/webvigil/src/componentes/Vitrine.astro`: importar as imagens novas; `width` e `height` vêm do `ImageMetadata`. — RF-07
- [ ] Portão de qualidade e Lighthouse nos quatro perfis (os dois sites, celular e desktop). — Anotar o resultado real.

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
