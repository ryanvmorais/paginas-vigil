---
feature: Tema compartilhado — tokens, fontes, layout bilíngue e componentes dos dois sites
status: aprovado
date: 2026-11-05
related: [001-fundacao]
origin: conception
---

# 002 — Tema

## Contexto e problema

Os dois sites (WebVigil e MailVigil) têm a mesma estrutura de página, a mesma identidade visual e o mesmo
comportamento de idioma; o que muda é o texto, a cor de acento e o terminal. Hoje `packages/tema` só
exporta `IDIOMAS` e `chavesFaltantes`, e as páginas em `apps/*/src/pages/index.astro` são esqueletos
descartáveis. Sem um tema compartilhado, cada site reimplementaria o cabeçalho, o seletor de idioma, o
terminal e as regras de acessibilidade, e os dois divergiriam.

O visual está decidido: direção A, "Terminal primeiro", aprovada em mockup (versão 13). Esta spec
leva essa decisão para código reutilizável, antes de qualquer página real, para que as specs de cada site
só tenham de montar texto sobre blocos prontos.

## Objetivos

- **Identidade num lugar só**: cores, tipografia, espaçamento e o tema claro e escuro definidos uma vez como
  variáveis CSS, com um acento por produto.
- **Fontes locais**: Sora, JetBrains Mono (com os caracteres de moldura do terminal) e `system-ui`, sem
  requisição a terceiros.
- **Página bilíngue correta por construção**: o layout base emite `lang`, `canonical`, `hreflang` e
  `og:locale` a partir do idioma e do caminho, e o seletor PT · EN usa links reais.
- **Blocos de interface prontos**: cabeçalho, botão, comando com botão de copiar, terminal, seções e
  rodapé, com as regras de interface já embutidas (alvo de toque, alinhamento, sem rolagem horizontal).
- **Acessível e rápido por padrão**: contraste, foco visível, movimento reduzido e CLS baixo valem para
  qualquer página montada com o tema.

## Não-objetivos

- O conteúdo das páginas, os textos de cada produto e as saídas reais do terminal: ficam nas specs de cada
  site.
- A escala de severidade do WebVigil (CRITICAL a INFO): só o WebVigil a usa, então mora no app dele.
- Banner de consentimento, Google Analytics e política de privacidade.
- Logos, favicon e imagem social (fase de imagens), publicação e domínio.

## Personas

- Como **visitante**, quero que as duas páginas e os dois idiomas pareçam e se comportem da mesma forma, no
  celular e no desktop, no tema claro e no escuro, para não reaprender a navegar.
- Como **visitante que usa leitor de tela ou teclado**, quero foco visível, ordem lógica e idioma declarado,
  para usar a página sem mouse.
- Como **mantenedor**, quero mudar uma cor ou um espaçamento num só arquivo e ver nos dois sites, para a
  identidade não divergir.
- Como **buscador**, quero a marcação de idioma completa e consistente, para indexar cada versão e ligar
  uma à outra.

## Requisitos funcionais

### RF-01 — Tokens e tema claro/escuro

- **Given** uma página que importa o tema
  **When** o navegador prefere o esquema claro ou o escuro (`prefers-color-scheme`)
  **Then** as variáveis de cor, de fundo e de texto assumem os valores do esquema, e o terminal fica
  escuro nos dois.
- **Given** o elemento raiz com `data-produto="webvigil"` ou `data-produto="mailvigil"`
  **When** a página é renderizada
  **Then** a cor de acento é a do produto (tom escuro do logo no WebVigil, azul do logo no MailVigil), com
  a variante própria do tema escuro.

### RF-02 — Fontes locais

- **Given** o build de um site
  **When** a página carrega
  **Then** Sora 800 (títulos), JetBrains Mono (código e terminal) e `system-ui` (corpo) vêm de arquivos do
  próprio site, sem requisição a outro domínio, com `font-display: swap`.
- **Given** uma tabela do terminal com os caracteres `┏━┓` (U+2500 a U+257F)
  **When** é renderizada
  **Then** as colunas ficam alinhadas, porque a fonte local inclui esse intervalo.

### RF-03 — Layout base e SEO bilíngue

- **Given** o idioma, o caminho da página e o caminho da outra versão
  **When** o layout base é renderizado
  **Then** o `<html>` leva `lang`, e o `<head>` leva `title`, `description`, `canonical` da própria versão,
  `hreflang` para `pt`, `en` e `x-default` (apontando para `/en/`) e `og:locale` com o `og:locale:alternate`
  da outra.
- **Given** um visitante cujo navegador prefere outro idioma
  **When** abre qualquer versão
  **Then** nada o redireciona: a troca é só pelo seletor.

### RF-04 — Ajuda de idioma

- **Given** um idioma e o caminho da página na versão atual
  **When** a ajuda de idioma é chamada
  **Then** devolve o caminho da mesma página no outro idioma (`/` ↔ `/en/`, `/x` ↔ `/en/x`), sem acessar
  DOM, rede nem estado global.

### RF-05 — Cabeçalho e seletor de idioma

- **Given** qualquer página montada com o tema
  **When** o cabeçalho é renderizado
  **Then** mostra logo e nome, navegação (só no desktop) e o seletor PT · EN com links reais para a outra
  versão; o idioma atual não é um link e leva `aria-current`; **não** há botão do GitHub.

### RF-06 — Botão

- **Given** um link com aparência de botão (primário ou secundário)
  **When** é renderizado a 390 px
  **Then** ocupa a largura total, com rótulo centralizado, altura mínima de 48 px e alvo de toque de pelo
  menos 44 px.
- **Given** o mesmo botão a 1280 px
  **When** é renderizado
  **Then** tem a largura do rótulo.

### RF-07 — Comando com botão de copiar

- **Given** um comando de instalação
  **When** a página carrega com JavaScript e com `navigator.clipboard`
  **Then** o botão copia o texto e avisa o resultado de forma que o leitor de tela anuncie.
- **Given** um navegador sem `navigator.clipboard` ou sem JavaScript
  **When** a página carrega
  **Then** o botão não aparece e o comando continua visível e selecionável.

### RF-08 — Terminal

- **Given** um texto de terminal passado pelo site
  **When** o bloco é renderizado
  **Then** o texto completo está no HTML (sem depender de JavaScript), o fundo é escuro nos dois temas e o
  bloco tem rótulo acessível.
- **Given** uma tela de 390 px e uma linha mais larga que ela
  **When** o terminal é exibido
  **Then** o bloco rola na horizontal e a página não.
- **Given** o terminal com um comando e a saída dele
  **When** a página carrega e o visitante não pediu movimento reduzido
  **Then** o comando é digitado e a saída aparece em seguida, uma vez, em poucos segundos, sem deslocar o
  resto da página.
- **Given** o visitante com movimento reduzido ativo, ou um navegador sem JavaScript
  **When** a página carrega
  **Then** o comando e a saída aparecem inteiros, sem animação e sem perda de conteúdo.

### RF-09 — Seções e rodapé

- **Given** o conteúdo de um site
  **When** é montado com os blocos do tema (seção, passos numerados, grupos de itens sem cartões, figura
  do relatório em HTML, bloco de aviso opcional, bloco "o que ele não faz" com borda, chamada final
  centralizada)
  **Then** a ordem e o alinhamento seguem a direção A: texto de leitura à esquerda, texto curto e isolado
  ao centro.
- **Given** o rodapé
  **When** é renderizado
  **Then** traz nome e licença, link para o outro produto e o seletor de idioma, e aceita um item extra
  opcional (o link do DMARC Fácil, só na versão em português do MailVigil).

### RF-10 — Textos do próprio tema

- **Given** os textos que o tema emite sozinho (rótulos do seletor, do botão de copiar e dos avisos de
  acessibilidade)
  **When** o teste de paridade roda nas duas direções
  **Then** `pt` e `en` têm as mesmas chaves.

## Requisitos não-funcionais

### RNF-01 — Sem inline

Nenhum `<script>` inline, e nenhum `style=` nem `<style>` inline no HTML gerado: a política de segurança de
conteúdo do deploy não vai permitir `unsafe-inline`. Todo comportamento e todo estilo vão em arquivo externo.

### RNF-02 — Acessibilidade

Contraste mínimo de 4,5:1 nos textos, nos dois temas; foco visível em todo controle; cor nunca é o único
sinal; ordem de leitura lógica; sem rolagem horizontal da página entre 360 e 1280 px.

### RNF-03 — Desempenho

CLS abaixo de 0,1 (fontes e imagens com dimensão reservada) e os limites do Lighthouse CI da
[`001-fundacao`](../001-fundacao/requirements.md) (RF-07) respeitados por uma página montada só com o tema.

### RNF-04 — Testes offline e determinísticos

A lógica (ajuda de idioma, paridade) tem teste unitário com entradas montadas no próprio teste, sem rede,
relógio nem dado real; o resto é conferido pelo build e pelo Lighthouse CI.

### RNF-05 — Sem dependência nova de interface

Sem framework de interface, sem Tailwind e sem biblioteca de i18n, como na [`001-fundacao`](../001-fundacao/requirements.md).

## Perguntas em aberto

Nenhuma.

## Decisões resolvidas

1. Direção A, "Terminal primeiro", aprovada em mockup; uma só ousadia: o terminal.
2. Sem redirecionamento automático por idioma; `x-default` aponta para `/en/`.
3. Cabeçalho sem botão do GitHub (2026-11-05): não é fixo, e o botão repetia o do topo e o da chamada final.
4. Fontes self-hosted: sem requisição a outro domínio e com os caracteres de moldura do terminal (RF-02).
5. O tema entrega a estrutura inteira que é igual nos dois sites (2026-11-05); cada site só passa texto,
   saída do terminal e imagens. A escala de severidade do WebVigil fica no app dele.
6. Consentimento, GA4 e política de privacidade viram a spec seguinte, `003`, aberta depois do tema.
7. O mockup v13 vale como design aprovado do tema; não haverá folha de componentes à parte.
8. A digitação animada do terminal entra no tema, respeitando o movimento reduzido. O mockup v13 não a
   mostra, então o `design.md` a descreve e é aprovado nesse ponto.

## Testes

- Ajuda de idioma: `/` ↔ `/en/`, caminho interno nas duas direções, caminho sem barra final.
- Paridade dos textos do tema, nas duas direções, com `chavesFaltantes`.
- O build dos dois sites e o Lighthouse CI conferem o resto: marcação de idioma, ausência de inline, contraste,
  alvo de toque e CLS.
