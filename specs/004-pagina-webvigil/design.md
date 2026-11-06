---
feature: Página do WebVigil — revisão completa de texto, fatos, imagens, links, botões, estrutura e formatação, em português e em inglês
status: concluído
date: 2026-11-06
related: [002-tema, 003-medicao]
origin: conception
---

# 004 — Página do WebVigil: design

## Visão geral

A revisão mexe no tema compartilhado (`packages/tema`) e no site do WebVigil (`apps/webvigil`). O conteúdo do
MailVigil não muda, mas o layout dele acompanha o tema (RF-08, RF-10), então cada mudança de tema é conferida
nos dois sites. As peças:

1. **Cabeçalho do celular:** ícone de menu que abre um painel com as seções (RF-06).
2. **Seção do relatório:** três blocos empilhados na largura da coluna: abertura, captura e aviso (RF-08).
3. **Textos de leitura em largura inteira**, e a caixa "O que ele não faz" empilhada (RF-08).
4. **Escala tipográfica** em tokens de tamanho: 12, 14, 16, 18 e 22 px (RF-10).
5. **Imagens e terminal regerados:** capturas na largura da coluna, saída do terminal com o achado crítico
   (RF-07).
6. **Acabamento:** bloco do comando sem botão, pista de rolagem do terminal no celular, reserva de rolagem do
   banner medida (RF-06, RF-07, RF-11).
7. **Botões e links:** "Relatório" no menu e novo destino de "Ler a documentação" (RF-06).
8. **Fatos e textos:** inventário das afirmações conferidas e revisão bloco a bloco, nos dois idiomas
   (RF-02 a RF-05, RF-09).

A ordem do trabalho é a dos requisitos: a estrutura fecha primeiro (itens 1 a 7), e os textos são revistos e
aprovados depois, com a estrutura aplicada, porque a escala e a largura mudam a quebra das linhas.

## Mockup aprovado

Mockup aprovado em 2026-11-06, a 390 e a 1280 px, claro e escuro, com o CSS e os textos reais do tema, cada
alternativa mudando um eixo e o resto igual à página atual. As decisões e os motivos:

### Navegação do celular

**Decisão: ícone de três linhas, depois do seletor de idioma (PT · EN), que abre um painel de cima para
baixo.** O desenho do ícone é o do site principal do mantenedor: três traços de 24 × 2 px que viram um X
quando o painel está aberto. O painel não segue o do site principal, que abre pela lateral porque tem muitos
itens: aqui são quatro, e eles abrem sob o cabeçalho, em largura inteira, com 48 px de altura cada e um filete
entre eles.

- Alvo do ícone: 44 × 44 px, a 8 px do seletor de idioma, para o dedo não errar entre os dois.
- Nome acessível "Seções" (e "Sections"), que vem de `textos.ts` do tema; o estado aberto ou fechado vem do
  próprio `<details>`.
- Descartadas: **A**, faixa de links sob o cabeçalho, porque os quatro rótulos somam mais que os 350 px úteis,
  a faixa rola para o lado e o último link nasce cortado; **B**, botão com o texto "Seções", mais largo e
  menos convencional que o ícone. Fora do escopo, sugerida e não adotada: cabeçalho fixo no celular (64 px da
  tela sempre ocupados); o cabeçalho continua rolando com a página, como na spec 002.

### Seção do relatório

**Decisão: três blocos independentes, um sob o outro, cada um na largura inteira da coluna da página (1024 px
no desktop).** Primeiro o título com a frase de abertura, depois a captura, depois o aviso do painel. A ordem é
a mesma no celular.

- A captura ocupa a coluna inteira, sem margem vazia, e o texto dela chega ao leitor com 16 px ou mais (hoje
  chega com 10 a 12 px, porque a captura 4:3 de 1280 px é encolhida para 960).
- Descartadas: duas colunas com texto e aviso à esquerda e captura à direita, em 5 e 7 partes ou meio a
  meio. O mantenedor quer o texto na largura da coluna e a captura no tamanho máximo.

### Textos em largura inteira

**Decisão: nenhum texto de leitura tem teto de largura.** Vale para o apoio do topo, a frase de abertura das
seções, o texto do aviso, o de "O que ele não faz" e o da chamada final. Cada um ocupa a caixa que o contém, e
a caixa "O que ele não faz" empilha: título em cima, texto na largura da caixa.

- Com a fonte do corpo, o resultado no desktop é de uns 115 caracteres por linha na frase de abertura e uns
  135 no aviso; os blocos têm 2 ou 3 linhas.
- Testada e descartada: medida de uns 90 caracteres (`78ch`) em todos os textos, com o apoio do topo incluso.
  Deixa um vazio de uns 20% à direita, e o mantenedor preferiu o alinhamento com a captura e o cartão do
  aviso, que ficam na largura inteira. Medida atual do topo (`72ch`, uns 80 caracteres) também descartada.
- `text-wrap: pretty` nos textos, para o navegador evitar a última linha com uma palavra só.

### Escala tipográfica

**Decisão: corpo de 16 px, abertura de 18 px, código de 14 px, rótulos de 12 px, e 22 px para o nome do
produto e o título de "O que ele não faz".** Hoje há onze tamanhos entre 11 e 22 px, vários quase iguais.

| Papel                                                                         | Hoje            | Proposta    |
| ----------------------------------------------------------------------------- | --------------- | ----------- |
| Texto corrido: corpo, passos, itens dos grupos, aviso, limites, chamada final | 14,5 · 15       | 16          |
| Frase de abertura das seções e apoio do topo                                  | 15 · 17 · 19    | 18          |
| Subtítulos (passos, grupos) e título do aviso                                 | 17 · 18         | 18          |
| Código: comando, blocos dos passos, terminal no desktop                       | 13 · 14 · 13,5  | 14          |
| Legenda da captura, linha fina do topo, rodapé                                | 13 · 13,5       | 14          |
| Rótulos em maiúsculas ("Passo 1", "Opcional") e terminal no celular           | 11 · 12,5 · 13  | 12          |
| Nome do produto no cabeçalho e título de "O que ele não faz"                  | 20 · 22         | 22          |
| Título da página e das seções                                                 | 30–50 · 26 · 34 | sem mudança |

O código em linha passa de 0,88 para 0,875 do texto ao redor, que dá 14 px no corpo de 16.

### Detalhes

- **Bloco do comando sem botão** (página aberta por endereço de rede em HTTP, ou sem JavaScript): preenchimento
  simétrico de 14 px dos dois lados, e um clique no comando o seleciona inteiro.
- **Pista de rolagem do terminal no celular:** sombra na borda do bloco quando há linha escondida do lado.
- **Reserva de rolagem do banner:** a altura real do cartão mais a margem e 16 px de folga (ADR-6).
- **Botões:** os quatro continuam; só "Ler a documentação" muda de destino. O menu do desktop ganha
  "Relatório" (ADR-8).

## Estrutura

```text
packages/tema/src/
  componentes/Cabecalho.astro      # ícone de menu (<details>) no celular; 4 itens no desktop
  componentes/FiguraRelatorio.astro# largura da coluna; sem teto de 960 px
  componentes/Secao.astro          # frase de abertura sem teto de medida
  componentes/Topo.astro           # apoio sem teto de medida
  componentes/Aviso.astro          # largura inteira; texto sem teto
  componentes/Limites.astro        # título em cima, texto na largura da caixa
  componentes/ChamadaFinal.astro   # texto sem teto
  componentes/Comando.astro        # preenchimento simétrico sem botão; seleção com um clique
  componentes/Terminal.astro       # pista de rolagem no celular; tamanhos da escala
  componentes/Consentimento.astro  # a reserva deixa de ser fixa
  scripts/menu.ts                  # novo: fecha o painel ao ativar um link, com Esc e ao clicar fora
  scripts/consentimento.ts         # mede o cartão e publica a altura para a reserva
  estilos/tokens.css               # tokens de tamanho da escala
  estilos/base.css                 # corpo de 16 px; escala nas seções
  textos.ts                        # rótulo do menu em pt e en (paridade)
apps/webvigil/src/
  componentes/Vitrine.astro        # item "Relatório" no menu; destino de "Ler a documentação"; imagens novas
  textos.ts                        # revisão dos textos e das legendas (fase final)
  terminais.ts                     # saída regerada
  assets/relatorio/                # capturas regeradas (claro e escuro, desktop e celular)
specs/004-pagina-webvigil/
  fatos.md                         # novo: inventário das afirmações conferidas (RF-02)
scripts/verificar-dist.mjs         # confere âncoras e destinos repetidos (ADR-9)
```

## Cabeçalho do celular

A navegação do desktop (quatro links a partir de 720 px) continua como está, com o item novo "Relatório". Abaixo
de 720 px, o `Cabecalho.astro` mostra o menu em vez dela:

```text
<header>
  <nav aria-label="Seções">           ← só o menu do celular; o do desktop fica display: none
    <details>
      <summary> três traços (SVG, 24 × 24, traço de 2 px)  + texto "Seções" só para leitor de tela </summary>
      <ul> 4 links, 48 px cada, filete entre eles </ul>
    </details>
  </nav>
```

- O painel é absoluto, abaixo do cabeçalho, em largura inteira, com a sombra do mockup. O cabeçalho continua
  rolando com a página, então o painel rola junto.
- Só um dos dois `nav` existe de cada vez na árvore de acessibilidade (o outro fica `display: none`), para não
  repetir o defeito dos marcos duplicados da spec 002.
- **Sem JavaScript o menu funciona** (é um `<details>`). O `scripts/menu.ts` é só um acabamento: fecha o painel
  quando o visitante ativa um link (senão ele fica aberto atrás do conteúdo rolado), com Esc e ao clicar fora.
  É arquivo externo, como o `copiar.ts` (RNF-01).
- O ícone vira um X com `transform` quando o `<details>` está aberto; respeita `prefers-reduced-motion`.
- O MailVigil usa o mesmo `Cabecalho`; o ícone aparece nele da mesma forma.

## Seção do relatório

```text
<section id="relatorio">
  bloco 1: h2 + frase de abertura   (largura inteira, sem teto)
  bloco 2: figura (picture + legenda) (largura inteira)
  bloco 3: aviso do painel          (largura inteira)
```

Os três são irmãos dentro do mesmo `envoltorio`, com espaçamento próprio, e não dependem um do outro para o
layout (a divisão é para fins de formatação, não de semântica: continua uma seção só, com um `h2`).

### Capturas do relatório

A `FiguraRelatorio` continua escolhendo a imagem por `<picture>` (esquema de cor e largura, com `min-width:
561px`), e perde o teto de 960 px: a figura ocupa a coluna. As capturas são regeradas para a captura mostrar o
relatório no tamanho em que a página a exibe:

- **Desktop:** o relatório é aberto numa janela da largura da coluna (1024 px), a 2x, e a captura é cortada
  nas bordas do conteúdo do relatório (sem as margens da página dele) e na altura do fim do primeiro achado
  crítico. Mostrada na coluna, o texto do relatório fica com 16 px ou mais.
- **Celular:** janela de 360 px, a 2x, cortada do mesmo jeito, também até o fim do primeiro achado. Mostrada
  entre 320 e 520 px, o texto fica com 14 px ou mais, e a imagem inclui a biblioteca vulnerável e o achado
  que o texto alternativo descreve.
- Quatro arquivos, como hoje: claro e escuro, desktop e celular. O relatório vem da versão publicada mais
  recente da ferramenta, num scan ativo do app de teste do repositório (`scripts/serve-fixture-app.py`, porta
  9100), pelo comando mostrado no terminal da página. Esse scan escreve no app de teste e só roda com a
  autorização do mantenedor na hora.
- A data da geração e o aviso do orçamento de requisições aparecem no relatório; ficam no recorte e são
  explicados na legenda ou saem do recorte, o que sair do texto aprovado (RF-04).
- `width` e `height` vêm do `ImageMetadata`, como hoje, para não haver deslocamento de layout (RNF-04).

## Terminal

- **Saída regerada** no mesmo scan do relatório, com o achado crítico (injeção de comando) no trecho, para o
  terminal e a captura contarem a mesma história (RF-07). As classes `n-*` e `l-*` do `terminal.css` cobrem até
  120 caracteres de comando e 80 linhas de saída; o build falha se passar.
- **Tabela:** sem mudança. A conferência no build servido, em Chrome, mostrou que a fonte da página está
  carregada (JetBrains Mono 400 e 700), que o subconjunto tem os 128 caracteres de moldura (`U+2500-257F`), e
  que cada caractere da tabela (`┏ ━ ┳ ┓ ┃ ┡ ╇ ┩ │ └ ┴ ┘`) tem a largura de um `M` (8,11 px a 13,5 px de
  corpo): todos saem na fonte da página e alinhados. As bordas pesadas são os traços pesados da própria saída
  da ferramenta. A premissa da primeira inspeção (fonte substituta) estava errada.
- **Pista de rolagem no celular:** só CSS, no `pre`, com quatro gradientes (`background-attachment: local` para
  cobrir e `scroll` para sombrear), que mostram a sombra na borda em que ainda há linha escondida. Abaixo de
  720 px; no desktop o bloco não rola.
- Tamanho da fonte: 12 px no celular e 14 px no desktop (escala).

## Comando sem botão

O `Comando` nasce com o botão `hidden` e o `scripts/copiar.ts` o revela se há `navigator.clipboard`. Sem o
botão, o preenchimento é simétrico: `.comando:has(> button[hidden])` leva `padding: 4px 14px`, e `code` leva
`user-select: all`, de modo que um clique ou toque seleciona o comando inteiro. Com o botão, nada muda. O
seletor `:has()` funciona nos navegadores atuais; no pior caso (navegador sem ele) o bloco mantém o
preenchimento assimétrico de hoje, sem perda de função.

## Reserva de rolagem do banner

Hoje a reserva é fixa (300 px no celular, 270 px no desktop) e sobra de 70 a 90 px. Com o banner aberto, o
`scripts/consentimento.ts` mede a altura do cartão (`ResizeObserver`) e escreve a altura em uma propriedade
CSS no `<body>`, pela API de estilo do navegador (`style.setProperty`, que a CSP `style-src 'self'` não
bloqueia, ao contrário do atributo `style` no HTML). A reserva é `altura do cartão + margem (12 px no celular,
20 px no desktop) + 16 px`. Fechado o banner, a propriedade e a classe saem e o rodapé termina rente ao fim da
página, como hoje. Se o spike da Etapa 0 mostrar que a CSP ou o `verificar-dist` reprova a propriedade, o plano
de contingência é uma reserva por faixa de largura (valores medidos nos dois idiomas), ainda sem o vazio de hoje.

## Botões, links e menu

| Elemento                     | Destino                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| "Ver no GitHub" (topo)       | pt: `README.pt-BR.md` do repositório; en: o `README.md` (como hoje)           |
| "Como funciona" (topo)       | `#como-funciona`                                                              |
| "Ver no GitHub" (fim)        | o mesmo do topo (repetição aceita)                                            |
| "Ler a documentação"         | pasta `docs/` do repositório (`.../tree/main/docs`); hoje só existe em inglês |
| Aviso do painel              | seção "Web UI" do README no idioma da página                                  |
| Menu do desktop e do celular | `#como-funciona`, `#relatorio`, `#o-que-faz`, `#instalar`, nesta ordem        |

Como `docs/` só existe em inglês, o rótulo de "Ler a documentação" em português ou o texto ao lado diz isso
(RF-06); a redação entra na revisão dos textos.

## Fatos e textos

- **`fatos.md`:** inventário das afirmações factuais da página (pré-requisito de Python, comandos e flags,
  formatos de relatório, o que cada modo faz e exige, itens de cada grupo, limites, o painel e onde se obtém),
  cada uma com a fonte consultada e o resultado: confere, corrigida ou removida. Traz a versão da ferramenta
  consultada (a mais recente publicada no momento da conferência) e o resultado de cada comando copiável.
- **Opt-ins** (RF-03): o inventário dá a lista de itens que só rodam com flag (`--stored-xss`, `--file-upload`,
  XXE e outros); o texto de cada um diz que é opt-in, com a mesma clareza.
- **Revisão de texto:** bloco a bloco, em português e depois em inglês, aprovada pelo mantenedor, com o
  resultado registrado no `tasks.md`. Cada conceito com um nome só (o painel não aparece sob três nomes) e uma
  regra única de quais termos ficam em inglês.
- **Metadados** (RF-09): título até 60 e descrição até 160 caracteres, conferidos por teste.

## ADRs

### ADR-1 — Ícone de menu em `<details>`, painel de cima para baixo

- **Decisão:** no celular, o menu é um `<details>` com o ícone de três linhas, depois do PT · EN, e um painel
  de quatro links em largura inteira sob o cabeçalho.
- **Alternativas:** faixa de links sob o cabeçalho; botão com o texto "Seções"; cabeçalho fixo.
- **Porquê:** o ícone é o padrão que o visitante reconhece e o mesmo do site principal; o painel de cima para
  baixo é o certo para quatro itens; `<details>` funciona sem JavaScript.
- **Trade-off:** um toque a mais que a faixa para chegar à seção, e o ícone fica ao lado do PT · EN, o que
  exige o espaçamento de 8 px. O script `menu.ts` é um acabamento opcional.

### ADR-2 — Seção do relatório em três blocos empilhados

- **Decisão:** abertura, captura e aviso, um sob o outro, na largura inteira da coluna.
- **Alternativas:** duas colunas (5 e 7 partes, ou metade e metade) com a captura à direita.
- **Porquê:** deixa o texto na largura da coluna e dá à captura o tamanho máximo, de modo que o texto dela
  chega ao leitor com 16 px.
- **Trade-off:** a captura alta (uns 1040 px no desktop) alonga a página, e a coluna de texto do desktop não
  fica ao lado da imagem.

### ADR-3 — Textos de leitura sem teto de medida

- **Decisão:** nenhum texto de leitura tem `max-width` em caracteres; `text-wrap: pretty` evita a última linha
  com uma palavra só.
- **Alternativas:** teto de uns 90 caracteres (`78ch`), testado no mockup; teto atual (`62ch` a `72ch`).
- **Porquê:** alinha cada texto com a captura e com o cartão do aviso, e elimina o vazio de metade da caixa.
- **Trade-off:** linhas de uns 115 a 135 caracteres no desktop, acima do que a tipografia costuma recomendar
  para texto longo. Os blocos têm 2 ou 3 linhas, e o mantenedor aprovou depois de ver as duas versões.

### ADR-4 — Escala tipográfica em tokens

- **Decisão:** tamanhos 12, 14, 16, 18 e 22 px em tokens (`--fs-*`) em `tokens.css`, e o corpo da página em
  16 px. Os componentes usam os tokens, nunca um valor de tamanho solto.
- **Alternativas:** manter os tamanhos por componente e só ajustar os mais destoantes.
- **Porquê:** acaba com os tamanhos quase iguais e dá uma regra única, que o MailVigil herda.
- **Trade-off:** muda a quebra de linhas e a altura de toda a página nos dois sites; por isso os textos são
  revistos depois da escala aplicada.

### ADR-5 — Capturas na largura da coluna, cortadas no conteúdo

- **Decisão:** a janela de captura tem a largura em que a imagem será mostrada (1024 px no desktop, 360 px no
  celular), a 2x, e o corte vai das bordas do conteúdo do relatório até o fim do primeiro achado.
- **Alternativas:** manter a captura de 1280 px encolhida; capturar numa janela estreita e ampliar.
- **Porquê:** é o que dá texto de 16 px (desktop) e de 14 px ou mais (celular) sem margem vazia.
- **Trade-off:** os arquivos precisam ser regerados sempre que a ferramenta mudar o relatório, e o PNG de 2x pesa mais; se o
  peso estourar o limite do Lighthouse, a conversão para WebP entra como tarefa (RNF-04).

### ADR-6 — Reserva de rolagem medida

- **Decisão:** a reserva é a altura medida do cartão do banner mais a margem e 16 px.
- **Alternativas:** manter os valores fixos, ajustados à mão (270 e 300 px viram uns 210 e 225); reserva por
  faixa de largura.
- **Porquê:** a altura do cartão muda com o idioma, o zoom e a largura do texto; medir evita o vazio e o
  corte.
- **Trade-off:** mais um observador de tamanho no script do banner, só enquanto ele está aberto.
- **Revisto (2026-11-06):** a reserva foi retirada por decisão do mantenedor: com o banner aberto a página
  termina onde sempre terminou, sem espaço extra, e o cartão pode cobrir o fim do rodapé até o visitante
  escolher ou fechar o banner (o X é sempre visível). O observador, a classe e a propriedade
  `--altura-consentimento` saíram do script. O RF-11 passa a pedir isso.

### ADR-7 — Moldura do terminal: sem mudança

- **Decisão:** a tabela do terminal fica como está.
- **Porquê:** a medição no build mostrou que a fonte da página já desenha a moldura, alinhada; a causa
  suposta na inspeção inicial estava errada.
- **Trade-off:** as bordas continuam pesadas, que é o traço da saída da ferramenta; o mantenedor aceitou.

### ADR-8 — "Ler a documentação" aponta para `docs/`

- **Decisão:** o botão abre a pasta `docs/` do repositório; "Relatório" entra no menu.
- **Alternativas:** apontar para o README (igual a "Ver no GitHub" em inglês); apontar para o PyPI.
- **Porquê:** dá ao botão uma função própria, distinta do "Ver no GitHub".
- **Trade-off:** `docs/` só existe em inglês, e o rótulo ou o texto ao lado precisa dizer isso.

### ADR-9 — Verificação mecânica no `verificar-dist`

- **Decisão:** o `verificar-dist` passa a conferir que todo link interno aponta para um `id` existente e que
  nenhum destino externo se repete entre botões da mesma página, salvo "Ver no GitHub" no topo e no fim.
- **Alternativas:** teste unitário sobre os componentes; conferência só manual.
- **Porquê:** o HTML gerado é a fonte da verdade e o `verificar-dist` já o lê em todo build.
- **Trade-off:** o script ganha regras de conteúdo, além das de segurança que já tem.

## Interfaces e URLs

- Páginas: `/` (português) e `/en/` (inglês), como hoje; sem rota nova.
- Âncoras: `#como-funciona`, `#relatorio`, `#o-que-faz`, `#instalar`.
- Destinos externos: o repositório da ferramenta (README no idioma da página, pasta `docs/`, seção "Web UI") e
  o outro produto, como hoje.
- Sem dado, cookie ou domínio novo: a CSP (`script-src 'self'`, sem host externo sem medição) não muda.

## Impacto

- **MailVigil:** usa os mesmos `Cabecalho`, `Secao`, `Topo`, `Limites`, `ChamadaFinal`, `FiguraRelatorio`,
  `Comando` e `Terminal`. A escala, a medida sem teto, a caixa de limites empilhada, o ícone de menu e a reserva
  do banner mudam também nele. O texto e as imagens dele não são revistos aqui; a verificação confere que a
  página dele continua correta, nos dois idiomas e temas (RF-08, RF-10).
- **Banner (003):** só a reserva de rolagem muda; o contrato do cookie, a CSP e o comportamento do banner ficam.
- **Testes e verificação:** o `verificar-dist` ganha regras (ADR-9); os testes de paridade de `textos.ts` cobrem
  o rótulo novo do menu.
- **Documentação:** `CLAUDE.md`, `docs/stack.md` e os READMEs são atualizados no fim, se a mudança tocar o que
  descrevem (por exemplo a lista de componentes e de scripts).

## Riscos

- **Linhas longas.** Com a medida sem teto, a frase de abertura e o aviso passam de 110 caracteres por linha no
  desktop. Mitigação: blocos de 2 ou 3 linhas, `text-wrap: pretty`, revisão visual em 1280 px e em telas
  maiores; o recuo é um teto de largura só nos textos, sem mexer na captura.
- **Captura alta.** Uns 1040 px de altura no desktop alongam a seção. Mitigação: corte no fim do primeiro
  achado, como pede o RF-07; o mantenedor aprova o resultado real.
- **Peso das imagens.** Quatro PNG de 2x maiores que os atuais podem estourar o aviso de peso do Lighthouse.
  Mitigação: só a imagem do tema e da largura em uso é baixada; se não bastar, WebP.
- **Reserva do banner.** A propriedade CSS definida por script pode ser barrada por uma regra de CSP mais
  estrita no deploy. Mitigação: spike na Etapa 0; contingência por faixa de largura (seção própria).
- **Escala no MailVigil.** A mudança global de tamanhos pode quebrar linhas ou alinhamentos no outro site.
  Mitigação: conferência nos dois sites, nos dois idiomas, antes do fim de cada etapa.
- **A saída e a captura dependem da versão da ferramenta.** Mitigação: a versão consultada fica registrada em
  `fatos.md` e nas legendas de geração; qualquer nova versão repete a conferência.

## Testes

- **Mantidos:** paridade de `textos.ts` e `terminais.ts` nos dois sentidos, `verificar-dist` e CSP.
- **Novos, mecânicos:** link interno aponta para um `id` existente; nenhum destino externo se repete entre
  botões da mesma tela, salvo o "Ver no GitHub" do topo e do fim (no `verificar-dist`, com teste); título até 60
  e descrição até 160 caracteres; o rótulo do menu existe nos dois idiomas.
- **Em navegador real** (Chrome, não headless), em 360, 390, 430, 768 e 1280 px, claro e escuro, nos dois
  idiomas e nos dois sites: layout sem corte, ordem das seções, menu do celular (abrir, fechar por link, Esc e
  clique fora, com e sem JavaScript), tamanhos calculados da escala, medida das linhas, reserva do banner aberto
  e fechado, bloco do comando com e sem botão (por `localhost`, `127.0.0.1` e endereço de rede), pista de
  rolagem do terminal.
- **Acessibilidade e desempenho:** axe-core sem violação, Tab e foco do menu, leitor de tela (NVDA) nas páginas
  alteradas, Lighthouse CI nos limites do projeto.
- **Fatos:** conferência manual em `fatos.md`, com a versão da ferramenta e o resultado de cada comando.
