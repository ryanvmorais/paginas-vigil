---
feature: Tema compartilhado — tokens, fontes, layout bilíngue e componentes dos dois sites
status: concluído
date: 2026-11-05
related: [001-fundacao]
origin: conception
---

# 002 — Tema: design

## Visão geral

`packages/tema` deixa de ser só `idiomas.ts` e passa a ser a biblioteca de interface dos dois sites:
estilos globais (tokens, fontes, base), um layout de página e os blocos `.astro`, mais duas funções puras
(ajuda de idioma e textos do próprio tema). O pacote **não é compilado**: os apps importam os arquivos-fonte
pelo mapa `exports`, e o Astro/Vite os processa dentro do build de cada site.

Cada site monta a página assim: `Pagina` (layout) → `Cabecalho` → blocos de conteúdo → `Rodape`, passando só
texto, a saída do terminal e as imagens. Para o tema poder ser visto e medido antes das specs de cada site,
`apps/*/src/pages/` ganha uma **vitrine provisória** (texto sintético) que usa todos os blocos nos dois
idiomas. As specs `004` e `005` (páginas reais) a substituem.

Três decisões moldam o resto: nada inline (CSP), o terminal anima só com CSS e as fontes são arquivos
versionados no pacote.

## Mockup aprovado

O design visual é a direção A, "Terminal primeiro", aprovada em mockup (versão 13) e conferida a 390 e a
1280 px, nos dois produtos, idiomas e esquemas de cor; foi aprovada como design do tema em 2026-11-05. O CSS
do mockup é o ponto de partida dos tokens e dos blocos. A decisão e o motivo: a prova do topo é a saída real
do comando logo abaixo do título, o público de linha de comando reconhece o gênero na hora, e o terminal é a
única ousadia da página.

Diferenças deliberadas entre o mockup e o código:

| No mockup                                 | No código                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `<style>` e `<script>` inline, `style=`   | Arquivos externos, tudo em classe (RNF-01)                              |
| Seletor manual de tema (`data-theme`)     | Só `prefers-color-scheme`; o seletor era recurso da casca do mockup     |
| Container queries (simulam a largura)     | Media queries com os mesmos pontos de quebra: 560 px e 720 px           |
| `span.bx` de 1ch por caractere de moldura | Fonte local com o intervalo U+2500 a U+257F, sem `span`                 |
| Fontes do Google Fonts                    | Arquivos `woff2` no pacote                                              |
| Logo SVG embutido                         | Espaço reservado (`slot`) no cabeçalho; os logos vêm na fase de imagens |
| Sem animação                              | Digitação do comando e revelação da saída, só com CSS (ADR-4)           |

## Estrutura do pacote

```text
packages/tema/
  package.json            # exports + peerDependencies (astro)
  src/
    idiomas.ts            # (existe) IDIOMAS, Idioma, chavesFaltantes
    caminhos.ts           # ajuda de idioma: caminhoNoIdioma, outroIdioma (RF-04)
    textos.ts             # textos próprios do tema, pt e en (RF-10)
    estilos/
      tokens.css          # variáveis de cor, tipografia e espaço, claro e escuro, acento por produto
      fontes.css          # @font-face das fontes locais
      base.css            # reset, corpo, foco visível, container .envoltorio
    fontes/               # woff2 (subconjuntos) e a licença das fontes
    layouts/
      Pagina.astro        # <html>, <head> bilíngue, corpo
    componentes/
      Cabecalho.astro  SeletorIdioma.astro  Botao.astro  Comando.astro  Terminal.astro  Topo.astro
      Secao.astro  Passos.astro  Grupos.astro  FiguraRelatorio.astro  Aviso.astro
      Limites.astro  ChamadaFinal.astro  Rodape.astro
    scripts/
      copiar.ts           # botão de copiar (RF-07)
scripts/
  verificar-dist.mjs      # (raiz) confere o HTML gerado: sem inline e marcação de idioma
```

O `exports` do pacote expõe `./idiomas`, `./caminhos`, `./textos`, `./layouts/*` e `./componentes/*`. Os
estilos globais são importados pelo próprio `Pagina.astro`, então o app não precisa conhecê-los.

## Componentes e contratos

Todos os textos que o tema emite sozinho vêm de `textos.ts`; os do site chegam por prop ou `slot`.

| Bloco             | Props (além do `slot`)                                                                                    | Requisito    |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ------------ |
| `Pagina`          | `produto`, `idioma`, `caminho`, `titulo`, `descricao`, `imagemSocial?`                                    | RF-01, RF-03 |
| `Cabecalho`       | `nome`, `caminho`, `idioma`, `navegacao?: {href, rotulo}[]`; `slot="logo"`                                | RF-05        |
| `SeletorIdioma`   | `idioma`, `caminho`, `marco`                                                                              | RF-05        |
| `Topo`            | `titulo`, `apoio`, `fina`; `slot="acoes"` (botões) e `slot="comando"`                                     | RF-06, RF-07 |
| `Botao`           | `href`, `variante: "primario" \| "secundario"`                                                            | RF-06        |
| `Comando`         | `comando`, `idioma`                                                                                       | RF-07        |
| `Terminal`        | `rotulo`, `titulo`, `comando`; `slot` = a saída                                                           | RF-08        |
| `Secao`           | `id`, `titulo`, `lead?`                                                                                   | RF-09        |
| `Passos`          | `passos: {titulo, texto, codigo?}[]`, `rotuloPasso`                                                       | RF-09        |
| `Grupos`          | `grupos: {titulo, intro?, itens: {titulo, texto}[]}[]`                                                    | RF-09        |
| `FiguraRelatorio` | `imagens: {claroDesktop, escuroDesktop, claroCelular, escuroCelular}` (`ImageMetadata`), `alt`, `legenda` | RF-09        |
| `Aviso`           | `rotulo`, `titulo`, `link?: {href, rotulo}`                                                               | RF-09        |
| `Limites`         | `titulo`                                                                                                  | RF-09        |
| `ChamadaFinal`    | `titulo`, `texto`; `slot` = os botões                                                                     | RF-09        |
| `Rodape`          | `nome`, `licenca`, `outroProduto: {nome, href}`, `idioma`, `caminho`; `slot` = item extra                 | RF-09        |

Pontos de comportamento:

- **`Pagina`** calcula as duas versões com `caminhoNoIdioma` e as URLs absolutas com `Astro.site`. Emite
  `<html lang>` (`pt-BR` ou `en`), `title`, `description`, `canonical`, três `link rel="alternate"`
  (`pt-BR`, `en`, `x-default` → `/en/`), `og:title`, `og:description`, `og:type`, `og:url`, `og:locale` e
  `og:locale:alternate`, `meta name="color-scheme" content="light dark"` e o `preload` das fontes do topo.
  `og:image` só entra quando `imagemSocial` é passada (a imagem vem na fase de imagens). Sem redirecionamento.
- **`SeletorIdioma`** é um `nav` com dois links reais; o do idioma atual vira `span aria-current="page"`.
  Cada link leva `lang` e `hreflang`. O seletor aparece no cabeçalho e no rodapé, e só o do cabeçalho é um
  marco `nav`: o do rodapé (`marco={false}`) é um `div role="group"` com o mesmo rótulo, porque dois
  marcos iguais fazem o `axe` acusar `landmark-unique`.
- **`Botao`** é um `<a>`. Celular: largura total; a partir de 560 px: largura do rótulo. `min-height: 48px`,
  rótulo centralizado por `inline-flex` (RF-06).
- **`Comando`** renderiza o `<code>` e um `<button hidden>`. O `copiar.ts` (script do Astro, empacotado em
  arquivo externo) tira o `hidden` só se `navigator.clipboard` existe, copia o texto do `<code>` e escreve
  o resultado num `span role="status"`, o que o leitor de tela anuncia. Sem JavaScript o botão continua
  oculto e o comando selecionável (RF-07).
- **`Terminal`** é um `figure aria-label={rotulo}` (o `role="group"` foi tirado: o `axe` o rejeita num `figure`) com cabeçalho e um `<pre>` que rola na
  horizontal. O `<pre>` leva o comando (`span.digita`) e a saída (`span.saida`, o `slot`). O texto completo
  está sempre no HTML.
- **`Limites`** e **`ChamadaFinal`** seguem o alinhamento do mockup: o primeiro em duas colunas a partir de
  720 px, o segundo centralizado.

## Tokens e tema

`tokens.css` reproduz o `:root` do mockup sem o seletor `data-theme`: valores do esquema claro em `:root`,
valores do escuro em `@media (prefers-color-scheme: dark)`. O acento por produto vem de dois atributos no
`<html>`, escritos pelo `Pagina`:

```css
:root[data-produto="webvigil"] {
  --acc: var(--acc-web);
  --on-acc: var(--on-acc-web);
  --link: var(--link-web);
}
:root[data-produto="mailvigil"] {
  --acc: var(--acc-mail);
  --on-acc: var(--on-acc-mail);
  --link: var(--link-mail);
}
```

O terminal usa `--term-*` e um texto claro fixo, escuros nos dois esquemas. A escala de severidade
(`--sev-*`) **não** entra no tema: fica no CSS do app WebVigil, quando a spec dele a usar.

## Fontes

Três arquivos `woff2` em `src/fontes/`: Sora 800, JetBrains Mono 400 e JetBrains Mono 700. Cada um é um
subconjunto com latim, latim-1, pontuação geral e, na JetBrains Mono, o intervalo de moldura U+2500 a U+257F.
`fontes.css` declara `@font-face` com `font-display: swap`; o `Pagina` faz `preload` de Sora 800 e de
JetBrains Mono 400. A licença das fontes (SIL OFL) acompanha os arquivos. O corpo usa `system-ui`, sem arquivo.
O procedimento para regerar os subconjuntos fica num `LEIAME.md` da própria pasta.

## Terminal animado (só CSS)

```text
.digita  → largura de 0 a N·ch com steps(N), N = caracteres do comando (valor vindo de uma classe/atributo
           de dados lido pelo componente em tempo de build e posto numa variável de CSS por classe gerada)
.saida   → clip-path de baixo para cima com steps(L), L = linhas da saída, depois da digitação
```

O componente conta, no build, os caracteres do comando e as linhas da saída (renderiza o `slot` com
`Astro.slots.render` e conta as quebras de linha do texto), e escolhe `N` e `L`. Como o Astro não aceita
`style=` (RNF-01), `N` e `L` entram como classes utilitárias geradas em `terminal.css` por faixa
(`.n-10` … `.n-120`, `.l-5` … `.l-80`), cada uma definindo `--n` ou `--l`. A animação roda uma vez, dura
no máximo cerca de 3 s no total, e fica dentro de `@media (prefers-reduced-motion: no-preference)`: com
movimento reduzido nada é ocultado. A saída ocupa seu espaço final desde o primeiro quadro (o recorte não
muda o layout), então não há deslocamento de página (CLS).

## Ajuda de idioma

```ts
outroIdioma(idioma: Idioma): Idioma
caminhoNoIdioma(caminho: string, idioma: Idioma): string
```

`caminhoNoIdioma` aceita qualquer caminho de página (`/`, `/en/`, `/x`, `/en/x/`, com ou sem barra final),
tira o prefixo `/en` se houver e devolve o caminho no idioma pedido, sempre com barra final: `pt` não leva
prefixo, `en` leva `/en`. É uma função pura, sem DOM, rede nem estado global (RF-04).

## Interfaces e URLs

Nenhuma rota nova. Cada app continua com `/` (português) e `/en/` (inglês); a vitrine ocupa
`src/pages/index.astro` e `src/pages/en/index.astro`. O comportamento visível mora nos blocos acima.

## ADRs

### ADR-1 — Componentes `.astro` consumidos como fonte, sem build do pacote

- **Decisão:** `packages/tema` exporta os arquivos-fonte (`.astro`, `.css`, `.ts`) e os apps os processam no
  próprio build. `astro` entra como `peerDependency` do pacote (versão no `catalog:`).
- **Alternativas:** compilar o pacote para `dist/` com `tsup`/`astro build`; copiar os componentes para cada app.
- **Porquê:** é o padrão do Astro para pacotes de workspace, não adiciona etapa de build nem ferramenta, e
  uma mudança no tema aparece na hora no `pnpm dev` de qualquer site.
- **Trade-off:** o pacote só serve a projetos Astro, o que é exatamente o caso. O `typecheck` do tema passa a
  precisar do `astro check` para ver os `.astro`.

### ADR-2 — Garantir "sem inline" por configuração e por verificação do HTML gerado

- **Decisão:** os dois `astro.config.mjs` ganham `build.inlineStylesheets: "never"` e
  `vite.build.assetsInlineLimit: 0`, e o `build` de cada app passa a rodar `node ../../scripts/verificar-dist.mjs dist`
  depois do `astro build`. O verificador falha se achar `<script>` sem `src`, `<style>`, atributo `style=`,
  ou, em página com `hreflang`, se faltar `lang`, `canonical`, o trio de `alternate` ou `og:locale`.
- **Alternativas:** confiar só na configuração; checar com o Lighthouse CI; teste Vitest sobre o `dist`.
- **Porquê:** o Astro decide sozinho inserir estilo e script pequeno inline, e a regra do CSP não pode
  depender de lembrar disso. A verificação dentro do `build` não muda a sequência do portão da `001` (RF-03) e
  também roda no CI e no pre-commit.
- **Trade-off:** mais um script de manutenção na raiz e mais arquivos CSS/JS pequenos servidos (um pedido a mais cada).

### ADR-3 — Fontes versionadas no pacote, em subconjunto

- **Decisão:** três `woff2` gerados por subconjunto e commitados em `src/fontes/`, com a licença OFL.
- **Alternativas:** `@fontsource/*` (dependência npm); Google Fonts por CDN (o mockup).
- **Porquê:** a CDN quebra o CSP e a privacidade (requisição a terceiro); o `@fontsource` não traz os glifos de
  moldura no subconjunto latino e o arquivo completo pesa demais; o subconjunto próprio é pequeno e sem
  dependência nova no `pnpm audit`.
- **Trade-off:** binários no repositório (algumas dezenas de KB) e um procedimento manual para regerar.

### ADR-4 — Animação do terminal só em CSS

- **Decisão:** digitação do comando (`width` em `ch` com `steps()`) e revelação da saída (`clip-path` com
  `steps()`), em CSS, ativas só sob `prefers-reduced-motion: no-preference`. Sem JavaScript.
- **Alternativas:** script que digita caractere a caractere e dispara ao entrar na tela
  (`IntersectionObserver`); biblioteca de animação.
- **Porquê:** funciona sem JavaScript e sem script a mais sob o CSP, não pisca no carregamento, não desloca
  o layout (RNF-03) e respeita o movimento reduzido por construção; o texto completo está sempre no HTML.
- **Trade-off:** a animação começa no carregamento, e no celular o terminal pode estar parcialmente abaixo da
  dobra e ser visto já pronto. Se isso incomodar na prática, o disparo pela rolagem entra depois como acréscimo,
  sem mudar o HTML. A saída aparece em passos de linha, não caractere a caractere.

### ADR-5 — Media queries com os pontos de quebra do mockup

- **Decisão:** `max-width: 560px` (celular) e `min-width: 720px` (desktop), no lugar das container queries.
- **Alternativas:** manter container queries em todo o tema.
- **Porquê:** as container queries do mockup só existiam para simular duas larguras dentro de uma tela; numa
  página real a largura é a da janela. O `clamp` do título passa de `cqw` para `vw` com o mesmo teto de 50 px.
- **Trade-off:** o tema não responde à largura do contêiner onde for encaixado, o que aqui nunca acontece.

### ADR-6 — Página montada nos apps (nasceu como vitrine provisória)

- **Decisão:** `index.astro` e `en/index.astro` de cada app montam a página com todos os blocos. Ela nasceu como
  vitrine com texto sintético, mas passou a usar desde já os textos, a saída do terminal e as capturas do mockup
  aprovado (`textos.ts`, `terminais.ts`, `assets/relatorio/`): a página tem de ser, no mínimo, igual ao mockup.
  As specs `004` e `005` ficam com o que sobra: textos finais, revisão do conteúdo e do inglês, logos e imagens.
- **Alternativas:** deixar os esqueletos e testar o tema só por teste unitário; um app de demonstração à parte.
- **Porquê:** é o jeito de ver o tema no `pnpm dev`, de o build, o `verificar-dist` e o Lighthouse CI o medirem
  e de achar problema de contraste e de CLS antes do conteúdo real. Não cria app nem rota nova.
- **Trade-off:** código descartável. As páginas ainda não estão no ar, então nada provisório é publicado.

## Impacto

- **Altera:** `packages/tema/package.json` (exports, peer, `typecheck`), `apps/*/astro.config.mjs`,
  `apps/*/package.json` (`build`), `apps/*/src/pages/index.astro`, `pnpm-workspace.yaml` (catalog, só se
  `@astrojs/check` entrar no tema), `CLAUDE.md` e `docs/stack.md` (mapa do tema).
- **Cria:** o conteúdo de `packages/tema/src/` acima, `scripts/verificar-dist.mjs`, `apps/*/src/pages/en/index.astro`.
- **Não altera:** CI, ruleset, Dependabot, Lighthouse CI (as páginas novas entram nas medições sozinhas).

## Riscos

- **Astro inlinar script ou estilo pequeno** apesar da configuração: o `verificar-dist` falha o build e aponta o arquivo.
- **Cobertura de glifos da fonte:** se o subconjunto não cobrir o intervalo de moldura, a tabela do terminal sai
  desalinhada; a vitrine inclui uma tabela de moldura para isso aparecer na hora.
- **CLS na troca de fonte:** `font-display: swap` pode deslocar o título; mitigação com `preload` e fonte de
  reserva de métrica parecida, medida pelo Lighthouse CI (limite 0,1).
- **`astro check` num pacote sem páginas:** pode exigir um `astro.config` mínimo no tema; se não funcionar,
  o `typecheck` do tema fica no `tsc` e os `.astro` são cobertos pelos apps que os importam.
- **Classes utilitárias `.n-*`/`.l-*` do terminal:** a faixa precisa cobrir comandos e saídas reais; o componente
  falha o build se um valor ficar fora da faixa, em vez de errar em silêncio.

## Testes

- **`caminhos.test.ts`:** `/` ↔ `/en/`; `/x/` ↔ `/en/x/`; sem barra final; prefixo `/en` sem barra; idempotência
  (`caminhoNoIdioma(caminho, idioma)` aplicado duas vezes dá o mesmo); `outroIdioma` nas duas direções.
- **`textos.test.ts`:** `chavesFaltantes` nas duas direções entre os textos `pt` e `en` do tema.
- **`verificar-dist`:** teste unitário da função de verificação com HTML montado no teste (com e sem inline, com
  e sem `hreflang` completo), sem tocar o disco do build.
- **No build e no CI:** `pnpm build` (que roda o `verificar-dist`) e o Lighthouse CI sobre a vitrine conferem
  idioma, inline, contraste, alvo de toque e CLS. A conferência em navegador real (360, 390, 430 e 1280 px,
  claro e escuro, `axe-core`) é uma tarefa de `tasks.md`.
