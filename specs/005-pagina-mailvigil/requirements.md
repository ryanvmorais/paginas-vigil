---
feature: Página do MailVigil — revisão completa de fatos, texto, imagens, links, botões e estrutura, em português e em inglês
status: aprovado
date: 2026-11-06
related: [002-tema, 003-medicao, 004-pagina-webvigil]
origin: conception
---

# 005 — Página do MailVigil

## Contexto e problema

A página do MailVigil existe desde a [`002-tema`](../002-tema/requirements.md), em português (`/`) e em
inglês (`/en/`). Os textos, os passos, a saída do terminal e as capturas do relatório vieram do mockup daquela
spec e nunca passaram por uma revisão própria de ponta a ponta. A ferramenta, entretanto, seguiu: a versão
publicada mais recente é a **1.7.0** (2026-10-31).

A [`004-pagina-webvigil`](../004-pagina-webvigil/requirements.md) fez essa revisão para a página do WebVigil e
deixou pronto o que as duas páginas compartilham: o menu do celular, a seção do relatório em blocos
empilhados, a escala tipográfica `--fs-*`, o bloco do comando sem botão, o banner sem reserva de rolagem e a
verificação mecânica do HTML (`verificar-dist`). As duas páginas são praticamente iguais no formato, então
esta spec **parte do que a 004 fez** e aplica ao MailVigil o mesmo método: inventário, afirmações conferidas
com a versão consultada, saída e capturas regeradas pela ferramenta e texto aprovado bloco a bloco.

Uma leitura inicial do código da página e da ferramenta já achou estes pontos (a lista **não é exaustiva** e
nada nela foi ainda confirmado em navegador; o inventário completo é o RF-01):

- **Comando dependente de arquivo que nenhum passo cria:** o passo 2 roda
  `mailvigil verdict --config mailvigil.toml reports/`, mas a página não diz o que é o `mailvigil.toml` nem
  como criá-lo. Sem esse arquivo, a ferramenta exige `--domain`; quem copia os passos em ordem tropeça, como
  acontecia com o `scan.json` do WebVigil. O passo 3 já omite o `--config`, o que deixa os dois comandos
  desencontrados.
- **Português da saída com e sem acento:** a página mostra a saída em português sem acentos (`NAO PRONTO`,
  `nao reconhecido`). A ferramenta imprime o português **com** acentos em terminal UTF-8 e só cai para a
  versão sem acento quando a saída vai para um pipe ou para outra codificação; o relatório HTML sempre tem
  os acentos. A conferência diz se a página mostra o que um visitante veria no terminal dele.
- **Os dois idiomas não nomeiam o veredito do mesmo jeito:** o passo 3 em inglês cita os três rótulos
  (`READY`, `TOO EARLY`, `NOT READY`); o em português descreve os três sem citar o rótulo que a saída
  mostra. A ferramenta também usa códigos de saída distintos para cada resposta (0, 3 e 4), e a página só diz
  o do "pronto".
- **"Roda offline" e "só o `fetch` usa a rede":** o topo promete que roda offline e o grupo "O que ele
  garante" ressalva o `fetch`. A página precisa dizer, em um só lugar e sem contradição, o que é offline e o
  que não é.
- **Menu sem a seção do relatório:** a página tem a seção "O relatório em HTML", mas o menu lista só "Como
  funciona", "O que ele faz" e "Instalar". A 004 decidiu que o menu cobre as seções que o visitante procura
  e acrescentou "Relatório" ao do WebVigil.
- **Afirmações do tempo do mockup:** "cinco regras", os formatos lidos (`.xml`, `.zip`, `.gz`, `.eml`,
  `.mbox`), o limite de tamanho descompactado, a recusa de XML com `DOCTYPE` ou `ENTITY`, o contrato estável
  ("só mudam numa versão major") e os limites ("não indexa em Elasticsearch, não serve painel web e não envia
  e-mail") foram escritos contra uma versão anterior à 1.7.0 e nunca conferidos um a um.
- **Saída do terminal e capturas:** a saída e as oito capturas (dois idiomas, celular e desktop, claro e
  escuro) vêm do mockup, não de uma execução da 1.7.0. As linhas do veredito têm até 80 colunas, quebra que
  a própria ferramenta faz, e no celular o bloco rola para o lado.
- **Convite ao DMARC Fácil:** aparece no bloco de limites e no rodapé, com destino por idioma; o destino e o
  idioma dele nunca foram conferidos.

Esta spec fecha a página do MailVigil inteira: cada afirmação factual com fonte e resultado, cada bloco de
texto aprovado nos dois idiomas, cada imagem, link, botão e trecho de estrutura coerente com o resto da página
e com a do WebVigil. Mudança de interface segue o fluxo de interface do projeto: mockup aprovado no
`design.md` antes de qualquer código.

## Objetivos

- **Nenhuma inconsistência conhecida fica de fora**: um inventário completo, por eixo e por combinação de
  idioma, tema e largura, classifica cada achado, e cada um é corrigido, descartado com motivo ou levado ao
  mantenedor como decisão.
- **Cada afirmação factual tem fonte e confere** com a versão publicada da ferramenta, e o resultado fica
  registrado na spec.
- **Os passos funcionam na ordem em que aparecem**: quem copia o comando de cada passo, em sequência, chega ao
  veredito e ao relatório sem erro nem arquivo ausente.
- **A página não promete mais do que a ferramenta entrega**: o que é offline, o que usa a rede e o que a
  ferramenta não faz estão ditos como limite factual, sem promessa.
- **Texto aprovado bloco a bloco**, em português e em inglês, pelo mantenedor; o inglês diz o mesmo e lê
  como inglês natural.
- **Saída do terminal e capturas reais, limpas e coerentes** entre si e com o texto, nos dois idiomas.
- **As duas páginas seguem uma regra só**: o que a 004 decidiu para o WebVigil vale para o MailVigil, salvo
  diferença de produto registrada.
- **Nada regride**: paridade de idiomas, ausência de inline, CSP, acessibilidade, a página do WebVigil que
  compartilha o tema e o portão de qualidade.

## Não-objetivos

- A página do WebVigil: fechada na 004. Um ajuste num bloco do tema vale para os dois sites, mas o texto e as
  imagens do WebVigil não são revistos aqui.
- A medição e o banner de consentimento: ficam como na [`003-medicao`](../003-medicao/requirements.md).
- Logos, favicon, imagem social, o domínio e o deploy: são das fases seguintes.
- O site do DMARC Fácil: aqui só se confere o convite a ele e o destino.
- Tabela comparativa com outras ferramentas.
- Mudar a ferramenta ou a documentação dela: se a conferência achar erro lá, o assunto é do repositório da
  ferramenta.
- Redesenhar a estrutura que a 004 fechou (menu do celular, seção do relatório, escala tipográfica). Só
  entra se a revisão achar falha objetiva no MailVigil, e então pelo fluxo de interface.

## Personas

- Como **responsável por um domínio de e-mail** (administrador, desenvolvedor, quem cuida de DMARC), quero
  saber o que o MailVigil lê, o que responde e o que não cobre, para decidir se posso confiar no veredito
  antes de mover a política para `p=reject`.
- Como **visitante que lê em inglês**, quero a mesma informação de quem lê em português, em texto que não
  pareça traduzido.
- Como **visitante que copia um comando ou segue um link**, quero que funcione como está, na ordem dos
  passos, e que me leve ao que o rótulo promete.
- Como **visitante de celular, teclado ou leitor de tela**, quero a mesma página sem cortes, sobreposições
  nem armadilhas.
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
- **Given** a página do WebVigil já revisada
  **When** o inventário é feito
  **Then** compara as duas páginas, e toda diferença que não vem de uma diferença de produto é um achado.
- **Given** um achado do inventário
  **When** a spec conclui
  **Then** ele está corrigido, descartado com o motivo registrado, ou levado ao mantenedor como decisão
  explícita.
- **Given** um achado de gosto (preferência visual sem falha objetiva)
  **When** ele é apresentado
  **Then** o mantenedor decide; nada é mudado por preferência do autor.

### RF-02 — Afirmações factuais conferidas contra a ferramenta

- **Given** o texto da página em `textos.ts` e a saída em `terminais.ts`
  **When** o conteúdo é revisado
  **Then** existe um inventário das afirmações factuais sobre a ferramenta (pré-requisito de Python,
  comandos e flags, formatos de entrada, formato e idioma da saída, as cinco regras e seus limites, códigos
  de saída, o que usa a rede, os limites contra arquivos hostis, o contrato de estabilidade, o que a
  ferramenta não faz), cada uma com a fonte consultada e o resultado: confere, corrigida ou removida.
- **Given** uma afirmação que não confere com a versão publicada da ferramenta
  **When** a revisão termina
  **Then** o texto está corrigido nos dois idiomas, ou a afirmação saiu da página.
- **Given** a versão publicada da ferramenta no momento da conferência
  **When** o inventário é registrado
  **Then** ele traz a versão consultada, e o registro fica num arquivo de apoio da spec (`fatos.md`).

### RF-03 — O que é offline e o que não cobre, dito como é

- **Given** o topo, o passo 1 e o grupo "O que ele garante"
  **When** a página descreve o uso da rede
  **Then** diz uma coisa só, sem contradição: a análise roda na máquina do visitante, sem enviar nada, e o
  único comando que usa a rede é o que busca os relatórios na caixa de e-mail dele.
- **Given** o veredito
  **When** a página o descreve
  **Then** diz o que ele mede (as regras e os limites), o que significa cada resposta e que ele só enxerga o
  que os provedores reportam; nada sugere que ele garante a entrega de e-mail.
- **Given** os limites da ferramenta
  **When** a página os cita
  **Then** os diz como limite factual, sem promessa de que virão.

### RF-04 — Texto em português aprovado e consistente

- **Given** cada bloco de texto da página (título e descrição da página, topo, passos, relatório, grupos "O
  que ele responde" e "O que ele garante", limites, convite ao DMARC Fácil e chamada final)
  **When** o mantenedor o revisa
  **Then** o bloco fica aprovado, ou é reescrito e aprovado, antes de a spec concluir.
- **Given** os termos técnicos da página
  **When** o texto é revisado
  **Then** cada conceito tem um único nome em toda a página (por exemplo, "origem", "remetente" e "fonte"
  não alternam para a mesma coisa), e a regra de quais termos ficam em inglês é uma só, aplicada a todos os
  itens; os rótulos que a saída mostra (o veredito, as regras) aparecem no texto como a ferramenta os emite
  no idioma da página.
- **Given** um texto de qualquer bloco
  **When** ele aparece na página
  **Then** é claro para quem conhece e-mail e DNS mas nunca viu a ferramenta, com `p=reject`, DMARC e
  relatório agregado explicados na primeira vez ou usados de modo que não exijam explicação, sem promessa
  ("em breve", "nesta versão", "planejado") e sem comparação não demonstrada.

### RF-05 — Texto em inglês equivalente

- **Given** o texto aprovado em português
  **When** o texto em inglês é revisado
  **Then** diz o mesmo, nada a mais e nada a menos, e foi aprovado pelo mantenedor como inglês natural, não
  como tradução palavra por palavra.
- **Given** os dois dicionários
  **When** o teste de paridade roda
  **Then** `pt` e `en` têm as mesmas chaves, nas duas direções, inclusive a quantidade de itens de cada
  lista.
- **Given** a saída do terminal e o relatório, que a ferramenta emite nos dois idiomas (`--lang`)
  **When** a página os mostra em cada versão
  **Then** a versão em português mostra a saída e o relatório em português, a em inglês os mostra em inglês,
  e os dois contam a mesma história, com os mesmos números e o mesmo alvo; a legenda diz o idioma da
  captura.

### RF-06 — Botões, links e comandos com função e destino certos

- **Given** cada botão e link da página (menu, topo, chamada final, convite ao DMARC Fácil, rodapé)
  **When** o inventário de ações é feito
  **Then** cada um tem uma função distinta na página, nenhum repete outro botão da mesma tela sem motivo
  (salvo a repetição aceita de "Ver no GitHub" no topo e no fim, como na 004), e o rótulo diz o que acontece
  ao ativá-lo.
- **Given** o menu do cabeçalho no desktop e o painel do celular
  **When** a página é montada
  **Then** listam as quatro seções na ordem da página ("Como funciona", "Relatório", "O que ele faz" e
  "Instalar"), e cada item leva à seção certa, que fica visível abaixo do cabeçalho.
- **Given** um link para fora (o repositório, a documentação, o DMARC Fácil, o outro produto)
  **When** ele é aberto
  **Then** chega ao destino que o rótulo promete e, quando o destino existe no idioma da página, abre
  nesse idioma; destino que só existe em inglês é dito no rótulo ou no texto ao lado.
- **Given** os comandos copiáveis dos três passos
  **When** são executados em ordem, no ambiente descrito
  **Then** funcionam: o pacote existe com esse nome, cada flag existe na versão consultada, e o que um passo
  usa (o arquivo de configuração e a pasta de relatórios) foi apresentado antes ou está dito no próprio
  passo; o passo 3 diz que o código de saída muda com a resposta (0, 3 ou 4), para que quem o roda em
  script não leia 3 ou 4 como erro.
- **Given** cada comando copiável da página
  **When** o botão de copiar é usado
  **Then** coloca na área de transferência exatamente o que está visível; sem `navigator.clipboard` ou sem
  JavaScript, o bloco continua com boa aparência e seleciona o comando com um clique ou toque, como na 004.

### RF-07 — Saída do terminal e capturas reais, limpas e coerentes

- **Given** o comando mostrado no terminal da página
  **When** ele é executado, na versão consultada, contra relatórios de exemplo sintéticos (domínio
  `example.com`, endereço da faixa de documentação)
  **Then** a saída mostrada é a que a ferramenta produz em um terminal UTF-8, em cada idioma, inclusive os
  acentos do português; se a página mostrar a saída sem acentos, é por decisão registrada e dita na legenda.
- **Given** a saída do terminal e a captura do relatório
  **When** são comparadas
  **Then** contam a mesma história: o mesmo veredito, o mesmo motivo, as mesmas contagens, as cinco regras e
  o mesmo alvo, e o texto alternativo e a legenda batem com a imagem.
- **Given** as capturas do relatório HTML
  **When** são regeradas pelo procedimento do repositório da ferramenta, no viewport e no recorte da 004
  **Then** há uma versão por idioma, por largura (celular e desktop) e por tema (claro e escuro), o conteúdo
  ocupa a moldura sem margens vazias, o texto da imagem chega ao leitor com cerca de 14 px ou mais, e o
  recorte não corta um bloco no meio.
- **Given** a saída ou a captura divergir da versão consultada, ou for recortada de forma inadequada
  **When** a revisão termina
  **Then** foram regeradas, ou a página deixou de citar o que mudou.
- **Given** a saída do terminal no celular
  **When** a página é aberta em 360 a 430 px
  **Then** a saída segue como a ferramenta a emite, com as quebras dela em 80 colunas, e o bloco rola para o
  lado com a pista que o tema já traz.
- **Given** qualquer número na página
  **When** a origem dele é perguntada
  **Then** vem da saída real da ferramenta; a página não traz contagem de verificações, versão fixa nem
  depoimento.

### RF-08 — Estrutura, formatação e coerência com a página do WebVigil

- **Given** as seções da página e os blocos do tema que elas usam
  **When** a estrutura é comparada com a da página do WebVigil
  **Then** a ordem das seções, os títulos, os espaçamentos, os alinhamentos, os tamanhos e a hierarquia
  seguem a mesma regra; o que difere (o aviso do painel, que o MailVigil não tem, e o convite ao DMARC
  Fácil, que o WebVigil não tem) vem de diferença de produto e está registrado.
- **Given** os blocos de texto de leitura e a escala tipográfica
  **When** a página é aberta de 360 a 1280 px
  **Then** seguem a escala da 004 (texto corrido de 16 px, abertura de 18 px, nada informativo abaixo de 12
  px), ocupam a largura inteira da caixa e nenhum tamanho destoa.
- **Given** o banner de consentimento aberto
  **When** o visitante rola até o fim
  **Then** a página termina onde termina sem o banner, como na 004 (RF-11 daquela spec).
- **Given** uma mudança de estrutura ou de interface (bloco novo, outra ordem, outro layout, ajuste visual)
  **When** ela é proposta
  **Then** o `design.md` traz o mockup aprovado pelo mantenedor, em 390 e 1280 px, com a decisão e o
  motivo, antes de qualquer código de interface.
- **Given** um ajuste em bloco do tema compartilhado
  **When** ele é aplicado
  **Then** a página do WebVigil continua correta, nos dois idiomas e nos dois temas.

### RF-09 — Metadados da página

- **Given** o título e a descrição de cada idioma
  **When** são conferidos
  **Then** refletem o texto aprovado, o título tem até 60 caracteres e a descrição até 160, e os links
  entre as versões e o `x-default` seguem corretos.

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

- **Given** as imagens regeradas
  **When** a página é medida
  **Then** o peso e o desempenho continuam dentro dos limites do Lighthouse CI, com as imagens
  dimensionadas e no formato adequado a cada largura.

### RNF-05 — Spec impessoal

- **Given** os arquivos desta spec
  **When** o teste de impessoalidade roda
  **Then** passam: sem o nome do mantenedor, sem link para repositório ou artefato privado, sem caminho de
  máquina pessoal.

## Dependências externas

- **O repositório do MailVigil é a fonte da verdade** dos fatos: o `README` (nos dois idiomas), a documentação
  e o próprio comando. A conferência usa a versão publicada mais recente no momento em que ela é feita.
- **O procedimento de geração da demonstração e do relatório de exemplo** do repositório da ferramenta, para
  regerar a saída e as capturas (RF-07).
- **A página do DMARC Fácil**, só para conferir o destino do convite (RF-06).
- **O site do WebVigil**, destino do link para o outro produto, só existe depois do deploy; até lá a conferência
  é do endereço, não da página.

## Perguntas em aberto

Nenhuma.

## Decisões resolvidas

- **Escopo (2026-11-06):** a spec cobre só a página, como a 004. Logos, favicon, imagem social, domínio,
  deploy e lançamento são etapas dos fluxos de projeto novo e de preparação de release, fora desta spec.
- **Base (2026-11-06):** a 005 parte da 004 em vez de recomeçar: o tema, a estrutura, a escala, a verificação
  mecânica e o método (inventário, conferência com versão, texto aprovado bloco a bloco em português e depois
  em inglês, conteúdo novo só se o mantenedor pedir) são herdados; o trabalho novo é o conteúdo do MailVigil
  e as diferenças de produto.

## Testes

- Os testes existentes seguem: paridade de `textos.ts` nos dois sentidos, `verificar-dist` e CSP.
- Teste novo, onde houver regra mecânica: os da 004 (link interno aponta para um `id` existente; nenhum
  destino externo repetido entre botões da mesma tela, salvo "Ver no GitHub") passam a cobrir também a página
  do MailVigil.
- A conferência de fatos (RF-02, RF-03 e RF-06) é manual e fica registrada em `fatos.md`, com a versão da
  ferramenta consultada.
- O resultado real do portão de qualidade, da verificação em navegador (todas as larguras e temas), do
  axe-core e do Lighthouse fica registrado no fim de cada etapa do `tasks.md`.
