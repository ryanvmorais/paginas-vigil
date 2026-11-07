---
feature: Página do WebVigil — revisão completa de texto, fatos, imagens, links, botões, estrutura e formatação, em português e em inglês
status: concluído
date: 2026-11-06
related: [002-tema, 003-medicao]
origin: conception
---

# 004 — Página do WebVigil

## Contexto e problema

A página do WebVigil existe desde a [`002-tema`](../002-tema/requirements.md), em português (`/`) e em
inglês (`/en/`). O conteúdo e a montagem vieram do mockup daquela spec e nunca passaram por uma revisão
própria de ponta a ponta: nem de fatos, nem de texto, nem do acabamento de imagens, links, botões e
estrutura. O resultado tem inconsistências, de pequenas a visíveis.

Uma inspeção inicial da versão em português, no Chrome em desktop, já achou estas (a lista **não é
exaustiva**; o inventário completo é o RF-01):

- **Fato incompleto:** o XSS armazenado aparece no modo ativo sem dizer que só roda com `--stored-xss`,
  enquanto o upload de arquivo e o XXE trazem o aviso de opt-in.
- **Botões e links redundantes ou desencontrados:** o topo tem "Ver no GitHub" e o fim da página repete o
  mesmo botão ao lado de "Ler a documentação"; os dois levam ao README. Na página em português, o primeiro
  abre o README em português e o segundo o README em inglês. O botão secundário do topo ("Como funciona")
  repete o item do menu.
- **Termos misturados:** "XSS refletido" e "injeção de comando" estão traduzidos, mas "SQL injection",
  "Template e expression language" e "Host header" não; o painel aparece como "dashboard", "painel web" e
  "Web UI" no mesmo bloco.
- **Captura do relatório:** a imagem tem margens vazias grandes dentro da moldura e termina cortada no
  meio de um achado; mostra a data da geração e um aviso de orçamento de requisições que a página não
  explica.
- **Botão de copiar ausente:** o botão "Copiar" só aparece quando o navegador oferece
  `navigator.clipboard`, que existe apenas em contexto seguro (HTTPS, `localhost` ou `127.0.0.1`) e com
  JavaScript ativo. Fora disso o bloco do comando fica sem o botão e com o espaço dele vazio: o
  preenchimento é assimétrico (14 px à esquerda, 4 px à direita) e nada avisa o visitante de que deve
  selecionar e copiar à mão.
- **Celular (emulação a 390 px, sem estouro de largura):**
  - o cabeçalho não tem navegação entre as seções, só o logo e o seletor de idioma;
  - as linhas da saída do terminal são cortadas no meio da palavra, no lado direito, sem pista de que o
    bloco rola para o lado;
  - a captura do relatório para celular tem um recorte diferente da de desktop: termina antes da
    biblioteca vulnerável e do primeiro achado, que o texto alternativo descreve.
- **Terminal:** a tabela da saída parecia desenhada com uma fonte substituta, com bordas mais pesadas que as
  da ferramenta. A conferência no build (design, "Terminal") descartou a causa: os caracteres de moldura estão
  no subconjunto da fonte da página e saem todos com a largura dela. As bordas pesadas são os traços pesados
  (`┏ ┃ ┡`) que a própria ferramenta emite.

Uma segunda inspeção, em navegador real a 1280 e a 390 px (build com medição, nos dois idiomas), achou:

- **Hierarquia de fontes:** a frase de abertura das seções tem 15 px, menos que o subtítulo (18 px) logo
  abaixo e igual ao texto corrido; o texto principal (passos, grupos, aviso) tem 14,5 px; há tamanhos
  quase iguais (14,5, 15, 17, 18, 19, 20, 22); rótulos e legendas com 11 a 13 px carregam informação; o
  subtítulo do aviso (17 px) difere dos demais (18 px).
- **Espaço não aproveitado (desktop, coluna de 1024 px):** a frase de abertura ocupa cerca de metade da
  coluna, o texto do aviso e o de "O que ele não faz" também; a captura desktop é 4:3, com margens
  laterais vazias, e o texto dela chega ao leitor com cerca de 10 a 12 px.
- **Terminal × relatório:** o relatório destaca o achado crítico (injeção de comando) e o terminal não o
  mostra; "30 page(s)" e o aviso de orçamento de requisições só aparecem no relatório; a captura do
  celular não mostra o que o texto alternativo descreve.
- **Rodapé:** com o banner de consentimento aberto, a reserva de rolagem (270 px no desktop, 300 px no
  celular) é maior que o cartão (180 a 201 px mais a margem), e o rodapé fica com um vazio de 70 a 90 px
  a mais que o necessário. Depois de o visitante escolher, a reserva some.
- **Destinos:** o botão "Ler a documentação" leva ao README em inglês, que no inglês é o mesmo destino do
  botão "Ver no GitHub"; o repositório tem uma pasta `docs/` com a documentação.

Esta spec fecha a página do WebVigil inteira: cada afirmação factual com fonte e resultado, cada bloco de
texto aprovado nos dois idiomas, e cada imagem, link, botão e trecho de estrutura ou formatação coerente
com o resto da página e do tema. Mudança de interface segue o fluxo de interface do projeto: mockup
aprovado no `design.md` antes de qualquer código.

## Objetivos

- **Nenhuma inconsistência conhecida fica de fora**: um inventário completo, por eixo e por combinação de
  idioma, tema e largura, classifica cada achado, e cada um é corrigido, descartado com motivo ou levado
  ao mantenedor como decisão.
- **Cada afirmação factual tem fonte e confere** com a versão publicada da ferramenta, e o resultado fica
  registrado na spec.
- **A página não promete mais do que a ferramenta entrega**: o que é opt-in diz que é opt-in, e o que a
  ferramenta não faz está dito como limite factual, sem promessa.
- **Texto aprovado bloco a bloco**, em português e em inglês, pelo mantenedor; o inglês diz o mesmo e lê
  como inglês natural.
- **Cada botão e link tem uma função clara e um destino certo**, no idioma da página quando o destino tem
  versão nele, sem duplicar o que o menu ou outro botão já faz.
- **Imagens e saída do terminal reais, limpas e coerentes** com o texto que as acompanha.
- **Nada regride**: paridade de idiomas, ausência de inline, CSP, acessibilidade, a página do MailVigil
  que compartilha o tema e o portão de qualidade.

## Não-objetivos

- O conteúdo da página do MailVigil: é assunto de uma spec própria, aberta depois desta. Um ajuste num
  bloco do tema vale para os dois sites, mas o texto e as imagens do MailVigil não são revistos aqui.
- A medição e o banner de consentimento: ficam como na [`003-medicao`](../003-medicao/requirements.md).
- Logos, favicon, imagem social, o domínio e o deploy: são das fases seguintes.
- Tabela comparativa com outras ferramentas (ZAP, Nuclei): fica fora da página; os dois nomes aparecem só
  no texto dos limites, como indicação de uso conjunto.
- Traduzir a saída do terminal e o relatório em HTML: a ferramenta só os emite em inglês, e a página os
  mostra como são.
- Mudar a ferramenta ou a documentação dela: se a conferência achar erro lá, o assunto é do repositório
  da ferramenta.

## Personas

- Como **desenvolvedor ou profissional de segurança**, quero saber o que o WebVigil faz, o que exige e o
  que não faz, para decidir se vale instalá-lo e com que cuidado apontá-lo para um sistema.
- Como **visitante que lê em inglês**, quero a mesma informação de quem lê em português, em texto que não
  pareça traduzido, para confiar na ferramenta do mesmo jeito.
- Como **visitante que copia um comando ou segue um link**, quero que funcione como está e que me leve ao
  que o rótulo promete, para chegar ao primeiro scan sem tropeçar.
- Como **visitante de celular, teclado ou leitor de tela**, quero a mesma página sem cortes, sobreposições
  nem armadilhas, para ter a mesma experiência dos demais.
- Como **mantenedor**, quero aprovar cada trecho de texto e cada mudança de interface, e saber que cada
  afirmação foi conferida, para publicar a página sem medo de desmentido.

## Requisitos funcionais

### RF-01 — Inventário completo das inconsistências

- **Given** a página nos dois idiomas, nos dois temas e em 360, 390, 430, 768 e 1280 px
  **When** a auditoria roda, em navegador real (viewport real, não headless), com o servidor de
  desenvolvimento e com o build, com e sem JavaScript, abrindo a página por `localhost` e por outro
  endereço, com leitura do código e do HTML gerado
  **Then** existe um inventário de achados cobrindo texto, fatos, imagens, links, botões, estrutura,
  formatação, preenchimento (espaços, alinhamentos, margens, cortes) e consistência entre os idiomas, cada
  um com o local, a combinação em que aparece e a classificação: falha objetiva, regra do projeto ou
  decisão de gosto.
- **Given** um achado do inventário
  **When** a spec conclui
  **Then** ele está corrigido, descartado com o motivo registrado, ou levado ao mantenedor como decisão
  explícita.
- **Given** um achado de gosto (preferência visual sem falha objetiva)
  **When** ele é apresentado
  **Then** o mantenedor decide; nada é mudado por preferência do autor.

### RF-02 — Afirmações factuais conferidas contra a ferramenta

- **Given** o texto da página em `textos.ts` e as saídas em `terminais.ts`
  **When** o conteúdo é revisado
  **Then** existe um inventário das afirmações factuais sobre a ferramenta (pré-requisito de Python,
  comandos e flags, formatos de relatório, o que cada modo faz e exige, itens listados em cada grupo,
  limites, o painel e onde ele se obtém), cada uma com a fonte consultada e o resultado: confere, corrigida
  ou removida.
- **Given** uma afirmação que não confere com a versão publicada da ferramenta
  **When** a revisão termina
  **Then** o texto está corrigido nos dois idiomas, ou a afirmação saiu da página.
- **Given** a versão publicada da ferramenta no momento da conferência
  **When** o inventário é registrado
  **Then** ele traz a versão consultada.

### RF-03 — Opt-ins e exigências ditos como são

- **Given** um item da página que a ferramenta só executa com uma flag explícita (por exemplo XSS
  armazenado, upload de arquivo e XXE)
  **When** o item aparece na página
  **Then** o texto diz que é opt-in, com o mesmo grau de clareza para todos os itens do mesmo tipo.
- **Given** o modo ativo
  **When** a página o descreve
  **Then** diz o que ele exige (`--mode active` e `--authorized-by`) e que é para desenvolvimento e
  homologação, sem sugerir que é seguro para produção.
- **Given** o modo seguro
  **When** a página o descreve
  **Then** a afirmação de que pode apontar para produção vale para tudo o que a página lista sob ele.

### RF-04 — Texto em português aprovado e consistente

- **Given** cada bloco de texto da página (título e descrição da página, topo, passos, relatório e aviso do
  painel, grupos "Modo seguro" e "Modo ativo", limites e chamada final)
  **When** o mantenedor o revisa
  **Then** o bloco fica aprovado, ou é reescrito e aprovado, antes de a spec concluir.
- **Given** os termos técnicos da página
  **When** o texto é revisado
  **Then** cada conceito tem um único nome em toda a página (por exemplo, o painel não aparece sob três
  nomes), e a regra de quais termos ficam em inglês é uma só, aplicada a todos os itens.
- **Given** um texto de qualquer bloco
  **When** ele aparece na página
  **Then** é claro para quem conhece segurança web mas nunca viu a ferramenta, sem jargão sem explicação,
  sem promessa ("em breve", "nesta versão", "planejado") e sem comparação não demonstrada.

### RF-05 — Texto em inglês equivalente

- **Given** o texto aprovado em português
  **When** o texto em inglês é revisado
  **Then** diz o mesmo, nada a mais e nada a menos, e foi aprovado pelo mantenedor como inglês natural, não
  como tradução palavra por palavra.
- **Given** os dois dicionários
  **When** o teste de paridade roda
  **Then** `pt` e `en` têm as mesmas chaves, nas duas direções, inclusive a quantidade de itens de cada
  lista.
- **Given** um rótulo que a página mostra só em inglês (a saída do terminal e o relatório)
  **When** a versão em português o apresenta
  **Then** a legenda diz que está em inglês.

### RF-06 — Botões e links com função e destino certos

- **Given** cada botão e link da página (menu, topo, aviso do painel, chamada final, rodapé)
  **When** o inventário de ações é feito
  **Then** cada um tem uma função distinta na página: nenhum repete outro botão da mesma tela sem motivo,
  e o rótulo diz o que acontece ao ativá-lo.
- **Given** os botões do topo ("Ver no GitHub" e "Como funciona") e da chamada final ("Ver no GitHub" e
  "Ler a documentação")
  **When** a página é montada
  **Then** os quatro botões continuam, e o "Ver no GitHub" do fim é a repetição aceita do topo, um convite
  a ler o código depois da leitura; muda só o destino de "Ler a documentação", que passa a ser a pasta
  `docs/` do repositório (no idioma em que existir), distinto do README aberto por "Ver no GitHub".
- **Given** o menu do cabeçalho no desktop
  **When** a página é montada
  **Then** ele lista "Como funciona", "Relatório", "O que ele faz" e "Instalar", nesta ordem de página, e
  cada item leva à seção certa.
- **Given** a página no celular, onde o menu do cabeçalho não aparece
  **When** o visitante procura uma seção
  **Then** há um jeito de chegar às seções sem rolar a página inteira; a forma (ícone de menu com painel
  recolhível) foi decidida no mockup do `design.md`.
- **Given** um link para fora (o repositório, a documentação, o painel, o outro produto)
  **When** ele é aberto
  **Then** chega ao destino que o rótulo promete e, quando o destino existe no idioma da página, abre
  nesse idioma; destino que só existe em inglês é dito no rótulo ou no texto ao lado.
- **Given** um link interno (âncora)
  **When** é ativado
  **Then** rola até o alvo certo, que fica visível abaixo do cabeçalho.
- **Given** cada comando copiável da página
  **When** ele é executado como está, no ambiente descrito no passo
  **Then** é válido para a versão consultada (o pacote existe com esse nome, e a flag existe), e o botão de
  copiar coloca na área de transferência exatamente o que está visível.
- **Given** um navegador sem `navigator.clipboard` (página fora de contexto seguro) ou sem JavaScript
  **When** o bloco do comando é exibido
  **Then** o bloco tem boa aparência sem o botão (preenchimento simétrico), o comando se seleciona com um
  clique ou toque e nada sugere uma ação que não está disponível; a página funciona igual aberta por
  `localhost`, `127.0.0.1` e pelo endereço de rede local.

### RF-07 — Imagens e saída do terminal reais, limpas e coerentes

- **Given** o comando mostrado no terminal da página
  **When** ele é executado contra o app de teste que acompanha o repositório da ferramenta, na versão
  consultada
  **Then** a saída mostrada é a que a ferramenta produz: as contagens por severidade, os achados do trecho
  e o formato.
- **Given** o trecho de saída do terminal
  **When** ele é regerado
  **Then** inclui a linha do achado crítico que abre o relatório mostrado na página (injeção de comando),
  de modo que o terminal e a captura contem a mesma história, com as mesmas contagens e o mesmo alvo.
- **Given** a captura do relatório HTML
  **When** ela é regerada, com o viewport e o recorte escolhidos no `design.md`
  **Then** o conteúdo ocupa a moldura sem margens laterais vazias, de modo que o texto da imagem chegue ao
  leitor com tamanho legível (cerca de 14 px ou mais na largura em que é mostrada), no desktop e no
  celular.
- **Given** a captura do relatório HTML
  **When** ela é comparada com o relatório da versão consultada e com a página
  **Then** o recorte é limpo (sem margens vazias desproporcionais e sem cortar um bloco no meio), a
  legenda, o texto alternativo e as contagens citados batem com a imagem, nos dois idiomas, e há uma
  versão adequada a cada largura e a cada tema.
- **Given** a saída ou a captura divergir da versão consultada, ou for recortada de forma inadequada
  **When** a revisão termina
  **Then** foram regeradas pelo procedimento do repositório da ferramenta, ou a página deixou de citar o
  que mudou.
- **Given** a tabela da saída do terminal
  **When** ela é exibida
  **Then** os caracteres de moldura são desenhados com a fonte da página e alinhados, e a conferência no
  build fica registrada no design; o peso das bordas é o do traço pesado que a ferramenta emite, e manter
  assim é decisão registrada.
- **Given** qualquer número na página
  **When** a origem dele é perguntada
  **Then** vem da saída real da ferramenta; a página não traz contagem de verificações, versão fixa nem
  depoimento.

### RF-08 — Estrutura, formatação e preenchimento coerentes

- **Given** as seções da página e os blocos do tema que elas usam
  **When** a estrutura é revisada
  **Then** a ordem das seções, os títulos, os espaçamentos, os alinhamentos, os tamanhos e a hierarquia de
  títulos seguem uma regra única em toda a página, nos dois idiomas, e o menu cobre as seções que o
  visitante procura.
- **Given** uma mudança de estrutura ou de interface (bloco novo, outra ordem, outro layout, ajuste visual)
  **When** ela é proposta
  **Then** o `design.md` traz o mockup aprovado pelo mantenedor, em 390 e 1280 px, com a decisão e o
  motivo, antes de qualquer código de interface.
- **Given** um ajuste em bloco do tema compartilhado
  **When** ele é aplicado
  **Then** a página do MailVigil continua correta, nos dois idiomas e nos dois temas.
- **Given** a seção do relatório
  **When** a página é montada, no desktop e no celular
  **Then** é formada por três blocos independentes, um sob o outro, cada um na largura inteira da coluna da
  página: o título com a frase de abertura, a captura e o aviso do painel; a ordem é a mesma nas duas larguras.
- **Given** os blocos de texto de leitura (apoio do topo, frase de abertura das seções, texto do aviso, dos
  limites e da chamada final)
  **When** a página é aberta no desktop
  **Then** cada texto ocupa a largura inteira da caixa que o contém, sem teto de medida e sem deixar metade
  dela vazia; a caixa "O que ele não faz" tem o título em cima e o texto na largura dela.

### RF-09 — Metadados da página

- **Given** o título e a descrição de cada idioma
  **When** são conferidos
  **Then** refletem o texto aprovado, o título tem até 60 caracteres e a descrição até 160, e os links
  entre as versões e o `x-default` seguem corretos.

### RF-10 — Escala tipográfica legível

- **Given** o texto corrido da página (passos, itens dos grupos, aviso, limites e chamada final)
  **When** a página é aberta em qualquer largura
  **Then** ele tem 16 px, e a frase de abertura das seções tem 17 a 18 px, nunca menos que o subtítulo
  (h3) que a segue.
- **Given** os rótulos, legendas, linha fina e código de apoio
  **When** a escala é aplicada
  **Then** a página usa uma escala curta e única (aproximadamente 12 px para rótulos e legendas, 14 px para
  código, 16 px para o corpo, 18 px para abertura e subtítulos, e os tamanhos de título), sem tamanhos
  quase iguais e sem subtítulo que destoe dos demais; informação que o visitante precisa ler (por
  exemplo, a legenda que diz que o relatório está em inglês) não fica abaixo de 12 px.
- **Given** a escala nova
  **When** ela é aplicada ao tema compartilhado
  **Then** a página do MailVigil continua correta e a escala é decidida no `design.md` com o mockup
  aprovado.

### RF-11 — Sem reserva de rolagem para o banner (revisto em 2026-11-06)

A versão aprovada pedia uma reserva proporcional ao cartão; o mantenedor a retirou por desnecessária.

- **Given** o banner de consentimento aberto, nos dois idiomas, no desktop e no celular
  **When** o visitante rola até o fim
  **Then** a página termina onde termina sem o banner, sem espaço reservado: o cartão pode cobrir o fim do
  rodapé, e o visitante o fecha pelo X ou escolhendo.
- **Given** o visitante que aceitou ou recusou
  **When** o banner fecha
  **Then** o rodapé fica à mostra, com o "Gerenciar Cookies" para reabri-lo.

## Requisitos não-funcionais

### RNF-01 — Invariantes preservados

- **Given** as mudanças desta spec
  **When** o portão de qualidade e o build rodam
  **Then** passam `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, e o
  `verificar-dist` confirma as duas páginas sem script inline, sem `style=` e dentro da CSP, com e sem
  medição, nos dois sites.

### RNF-02 — Layout e acessibilidade

- **Given** a página corrigida
  **When** é aberta de 360 a 1280 px, nos dois temas e nos dois idiomas
  **Then** nada quebra, corta ou estoura, a verificação com axe-core não acusa violação, o contraste
  cumpre 4,5:1, os alvos de toque e de clique têm tamanho adequado e os limites do Lighthouse CI seguem
  cumpridos.
- **Given** um trecho de texto ou de estrutura alterado
  **When** o leitor de tela o lê
  **Then** a ordem e os rótulos continuam compreensíveis, e toda imagem tem texto alternativo fiel ao que
  mostra.

### RNF-03 — Sem lacuna nem plano na página

- **Given** o texto dos limites e de qualquer bloco
  **When** ele descreve algo que a ferramenta não faz
  **Then** o diz como limite factual, sem promessa de que virá, sem roteiro e sem citar lacuna interna.

### RNF-04 — Desempenho preservado

- **Given** as imagens regeradas ou novas
  **When** a página é medida
  **Then** o peso e o desempenho continuam dentro dos limites do Lighthouse CI, com as imagens
  dimensionadas e no formato adequado a cada largura.

### RNF-05 — Spec impessoal

- **Given** os arquivos desta spec
  **When** o teste de impessoalidade roda
  **Then** passam: sem o nome do mantenedor, sem link para repositório ou artefato privado, sem caminho de
  máquina pessoal.

## Dependências externas

- **O repositório do WebVigil é a fonte da verdade** dos fatos: o `README`, a documentação e o próprio
  comando. A conferência usa a versão publicada mais recente no momento em que ela é feita.
- **O app de teste e o procedimento de captura** do repositório da ferramenta, para regerar a saída e as
  capturas (RF-07).

## Perguntas em aberto

Nenhuma.

## Decisões resolvidas

- **Escopo ampliado (2026-11-06):** a spec cobre a página inteira (texto, fatos, imagens, links, botões,
  estrutura, formatação e preenchimento), não só o texto. Decisão do mantenedor, depois de ver que a
  página tem inconsistências em mais de um eixo.
- **Estrutura (2026-11-06):** escala tipográfica com corpo de 16 px e abertura de 17 a 18 px (RF-10); seção
  do relatório com a captura regerada (RF-07, RF-08); terminal regerado com o achado crítico (RF-07); reserva
  do banner ajustada ao cartão, depois retirada (RF-11).
- **Revisão no design (2026-11-06):** depois do mockup, o mantenedor trocou a seção do relatório em duas
  colunas por três blocos empilhados na largura inteira, com os textos de leitura também em largura inteira e
  a caixa "O que ele não faz" empilhada (RF-08); a navegação do celular é o ícone de menu (RF-06); e o item da
  fonte substituta do terminal saiu, porque a conferência no build mostrou que a moldura já usa a fonte da
  página (RF-07). A escala tipográfica passa a ser de 12, 14, 16 e 18 px, com 22 para o nome do produto e o
  título de "O que ele não faz", e a abertura fica em 18 px (RF-10).
- **Botões e menu (2026-11-06):** os quatro botões continuam como estão, e só o destino de "Ler a
  documentação" muda, para a pasta `docs/` do repositório; "Instalar" fica no menu e "Relatório" entra
  nele; a navegação no celular sai do mockup do `design.md` (RF-06).
- **Ordem do trabalho (2026-11-06):** a estrutura fecha primeiro (mockup aprovado no `design.md`, depois
  implementada), e os textos são revistos e aprovados pelo mantenedor a seguir, em português e em inglês
  (RF-04, RF-05); como a escala tipográfica muda a quebra das linhas, a revisão final dos textos vem depois
  da estrutura aplicada.
- **Conteúdo novo (2026-11-06):** a revisão só corrige e aprova. Um acréscimo entra só se o mantenedor pedir
  durante a revisão, item a item, e cada um passa pelo RF-02 como qualquer outro fato.
- **Aprovação (2026-11-06):** o inventário (RF-01) é apresentado inteiro, o mantenedor decide o que é
  gosto, e o texto é aprovado bloco a bloco, em português e depois em inglês, com o resultado registrado no
  `design.md`.

## Testes

- Os testes existentes seguem: paridade de `textos.ts` e `terminais.ts` nos dois sentidos, `verificar-dist`
  e CSP.
- Teste novo, onde houver regra mecânica: por exemplo, todo link interno aponta para um `id` existente na
  página, e nenhum destino externo da página se repete entre botões da mesma tela, salvo a repetição
  aceita de "Ver no GitHub" no topo e no fim (RF-06).
- A conferência de fatos (RF-02, RF-03 e RF-06) é manual e fica registrada na spec, com a versão da
  ferramenta consultada.
- O resultado real do portão de qualidade, da verificação em navegador (todas as larguras e temas), do
  axe-core e do Lighthouse fica registrado no fim de cada etapa do `tasks.md`.
