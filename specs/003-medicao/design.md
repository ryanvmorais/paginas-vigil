---
feature: Medição com consentimento — Google Analytics 4 em Consent Mode, banner e CSP sem inline
status: concluído
date: 2026-11-06
related: [001-fundacao, 002-tema]
origin: conception
---

# 003 — Medição: design

## Visão geral

A medição entra no `packages/tema` e vale para os dois sites sem tocar no conteúdo deles. São cinco peças:

1. **Núcleo de consentimento** (`consentimento.ts`): lógica pura, sem DOM e sem rede. Lê, grava, aplica e
   revoga a escolha. Recebe cookie, armazenamento local e `gtag` por injeção (RNF-05).
2. **Script de entrada** (`scripts/consentimento.ts`): cola fina entre o núcleo e a página. Empacotado pelo
   Astro em arquivo externo, como o `copiar.ts` (RNF-01).
3. **Componente `Consentimento.astro`**: o banner. Renderizado pelo `Pagina` só quando há identificador válido.
4. **Rodapé**: ganha o link da política (sempre) e o controle "Gerenciar cookies" (só com medição).
5. **CSP**: `scripts/csp.mjs` é a fonte única da política; o `verificar-dist` confere o HTML contra ela e o
   deploy a emitirá como cabeçalho.

Fluxo na página, com medição configurada:

```text
carrega a página (banner oculto, nenhum pedido ao Google)
  └─ script externo: gtag('consent','default', tudo negado)
       ├─ escolha gravada = aceita   → consent update (analytics_storage) → js + config → cria <script gtag.js>
       ├─ escolha gravada = recusada → nada mais acontece
       └─ sem escolha                → revela o banner
              ├─ Aceitar → grava + o mesmo caminho de "aceita"
              ├─ Recusar / X → grava "recusada" (e, se já havia medição, nega analytics_storage)
              └─ (o link da política abre a política do site principal)
```

O `gtag.js` só é baixado depois do aceite. Sem aceite não há pedido ao Google, que é mais estrito que o
"advanced" do Consent Mode e é o que RF-03 e RNF-03 exigem.

## Mockup do banner

Mockup aprovado em 2026-11-06, a 390 e a 1280 px, claro e escuro, em português e inglês, com o banner na
primeira visita, reaberto pelo rodapé e depois da escolha. É a continuação do mockup das páginas aprovado na
spec `002-tema`, com o rodapé novo. Amarras que o código segue:

- cartão fixo no canto inferior (no desktop à direita, 392 px de largura; no celular com 12 px de margem),
  como o do site principal;
- título "Privacidade & Cookies" com o ícone de cookie, texto curto com o link da política, escolha atual (só
  quando reaberto), "Recusar" e "Aceitar", e o X; título, ícone e texto são os do banner do site principal;
- "Recusar" e "Aceitar" **com a mesma regra de CSS** (mesma altura, largura, peso, borda e tipografia); a
  única diferença é o rótulo. É o que RF-02 exige, e a verificação em navegador compara os estilos
  calculados dos dois botões (no mockup, 160 × 44 px cada a 390 px);
- alvos de 44 px, contraste de 4,5:1 nos dois esquemas, sem cobrir o conteúdo a ponto de impedir a leitura a 390 px;
- rodapé com "Política de privacidade" e "Gerenciar cookies" fora da navegação "Mais projetos".

**Decisão: botões em contorno nos dois (alternativa A).** O único botão cheio da primeira dobra continua sendo
o do conteúdo ("Ver no GitHub"), então nenhum dos dois botões do banner puxa o olho para o aceite, e a
simetria exigida por RF-02 vale também visualmente. Descartadas: **B**, os dois cheios na cor do produto, porque
no celular o banner passa a competir com a ação principal da página e o cartão fica pesado; **C**, os dois
tonais, porque no tema claro a borda do botão quase some contra o cartão (menos de 3:1) e só o rótulo o
identifica.

**Reserva de rolagem.** O mockup mostrou que, no desktop, o cartão do canto inferior direito cobre os links
do rodapé, inclusive o "Gerenciar cookies" que o reabre. Enquanto o banner está aberto, a página reserva no fim
da rolagem o espaço dele (uma classe no `<body>` posta pelo script, com `padding-bottom` fixo por faixa de
largura), para o rodapé poder ser rolado para fora do cartão (WCAG 2.4.11, foco não encoberto).

**Texto e ícone.** O banner repete o título, o texto e o ícone do banner do site principal: "Utilizo cookies
para entender quais conteúdos são mais acessados e melhorar o site. Eles só são ativados se você aceitar.
Saiba mais na Política de Privacidade." O inglês é tradução deste texto e usa "I use cookies…". Como o texto
não cita o Google Analytics nem a possibilidade de mudar a escolha, isso fica na política (que nomeia a
ferramenta) e no controle "Gerenciar cookies" do rodapé, sempre visível quando há medição. O ícone é o
`cookie-bite` do Font Awesome Free (licença CC BY 4.0, que exige atribuição): vai como SVG embutido no
componente, com a atribuição no cabeçalho do arquivo e no `NOTICE` da raiz. Não entra a
biblioteca nem a fonte de ícones.

## Estrutura

```text
packages/tema/src/
  consentimento.ts        # núcleo puro: tipos, escolha, estados do Consent Mode
  consentimento.test.ts
  medicao.ts              # validarIdMedicao(valor): string | undefined  (G- + 10 maiúsculas/dígitos)
  medicao.test.ts
  politica.ts             # URL da política do site principal (pt e en) e domínio do cookie
  componentes/
    Consentimento.astro   # o banner (oculto no HTML; o script o revela)
  scripts/
    consentimento.ts      # entrada: liga núcleo, DOM, cookie, localStorage e gtag reais
  textos.ts               # ganha `consentimento` e `rodape.politica`/`rodape.gerenciar`
scripts/
  csp.mjs                 # politicaCsp({ medicao }) e os domínios do Google Analytics
  csp.test.mjs
  verificar-dist.mjs      # ganha as regras de medição e de CSP
```

`package.json` do tema expõe `./consentimento`, `./medicao` e `./politica` (os apps não precisam deles hoje,
mas o `test/` da raiz importa o primeiro).

## Núcleo de consentimento

```ts
type Escolha = "aceita" | "recusada";

interface Armazem {                         // uma "gaveta" onde a escolha pode morar
  ler(): string | undefined;                // "true" | "false" | qualquer outra coisa → ignorada
  gravar(valor: string): void;              // pode lançar
  apagar(): void;
}

interface Meios {
  cookie: Armazem;                          // cookie de domínio
  local?: Armazem;                          // localStorage (ausente = indisponível)
}

lerEscolha(meios, memoria): Escolha | undefined
gravarEscolha(meios, memoria, escolha): "cookie" | "local" | "memoria"

estadoPadrao: { analytics_storage, ad_storage, ad_user_data, ad_personalization: "denied" }
estadoAceito: { analytics_storage: "granted" }       // só este; os outros três nunca mudam (RNF-04)
estadoRevogado: { analytics_storage: "denied" }

criarGtag(dataLayer: unknown[]): (...args: unknown[]) => void   // empurra `arguments`, como o gtag.js exige
```

Regras:

- **Leitura:** cookie → armazenamento local → memória da página. O cookie vence quando os dois existem. Só
  `"true"` e `"false"` valem; qualquer outro valor é "sem escolha".
- **Gravação com conferência:** grava no cookie e **lê de volta**; se o valor não voltou (domínio recusado em
  `localhost`, cookies bloqueados), cai para o armazenamento local, e se este lançar erro, para a memória.
  Quando o cookie confirma, o item antigo do armazenamento local é apagado, para uma escolha velha não
  ressuscitar se o cookie sumir depois. Nada lança para fora (RF-03).
- **Cookie de escolha:** nome `cookies-accepted`, valor `true` ou `false`, `Domain` do domínio do site
  principal (constante em `politica.ts`), `Path=/`, `SameSite=Lax`, `Secure` quando a página é HTTPS e
  `Max-Age=34560000` (400 dias, o teto dos navegadores), regravado a cada escolha. Sem dado pessoal (RNF-04).
- **Aplicação:** a ordem é sempre `consent default (negado)` → [restaurar] `consent update` → `js` → `config`
  → só então criar o elemento `<script src=".../gtag/js?id=...">`. O `update` vem antes do `config` para o
  `page_view` inicial já sair concedido. O `config` leva `allow_google_signals: false` e
  `allow_ad_personalization_signals: false`. Há um único `config` por página (RF-07), garantido por uma
  marca "já carregado".
- **Revogação:** só `consent update` com `analytics_storage: "denied"`, como no site principal (ADR-6).
  Aceitar de novo na mesma página só concede de novo; não recarrega o `gtag.js` nem repete o `page_view`.

## Contrato do cookie de escolha

É a proposta de RF-03 fechada aqui, para o site principal adotar o mesmo:

| Campo     | Valor                                                              |
| --------- | ------------------------------------------------------------------ |
| Nome      | `cookies-accepted`                                                 |
| Valor     | `true` (aceita) ou `false` (recusa); ausente = ainda não escolheu  |
| Domínio   | o do site principal, para o cookie valer também nos subdomínios    |
| Atributos | `Path=/`, `SameSite=Lax`, `Secure` em HTTPS, `Max-Age` de 400 dias |
| Leitura   | qualquer dos três sites; quem grava renova o prazo                 |

O formato é o mesmo que o site principal já usa hoje no armazenamento local (`"true"`/`"false"`), então a
mudança dele é só de lugar, sem migração de valores.

## Banner e rodapé

Estrutura do `Consentimento.astro` (as classes e o visual saem do mockup):

```html
<section
  class="consentimento"
  role="region"
  aria-labelledby="consentimento-titulo"
  data-consentimento
  data-medicao="G-…"
  hidden
>
  <h2 id="consentimento-titulo" tabindex="-1"><svg aria-hidden="true">…</svg>…</h2>
  <p>… <a href="política">…</a></p>
  <p data-escolha-atual hidden>…</p>
  <div>
    <button type="button" data-recusar>…</button><button type="button" data-aceitar>…</button>
  </div>
  <button type="button" data-fechar aria-label="Fechar e recusar cookies">×</button>
</section>
```

- **Posição no DOM:** primeiro filho do `<body>`, antes do cabeçalho. O cartão é `position: fixed`, então a
  posição visual não muda e não há CLS; no DOM ele vem primeiro para o teclado e o leitor de tela o
  encontrarem sem atravessar a página (RF-02). Nada recebe foco à força na primeira visita.
- **Oculto por padrão:** o HTML sai com `hidden`; o script revela quando não há escolha. Quem tem escolha
  gravada nunca vê o banner piscar, e sem JavaScript não há banner, nem medição (nada para consentir).
- **Foco:** primeira visita, ao escolher, o foco vai para o `<main>` (`tabindex="-1"`, `preventScroll`).
  Reaberto por "Gerenciar cookies", o foco vai para o título do banner (o leitor de tela o anuncia ao reabrir) e, ao escolher ou
  fechar com Esc (que mantém a escolha atual), volta ao botão que abriu.
- **Escolha atual:** quando reaberto, `[data-escolha-atual]` mostra "Sua escolha: aceita/recusada" em texto,
  sem depender de cor.
- **Reserva de rolagem:** com o banner aberto o script põe uma classe no `<body>` que reserva, no fim da
  página, o espaço do cartão (valor fixo por faixa de largura); a classe sai quando o banner fecha. Sem isso o
  cartão cobriria o "Gerenciar cookies" do rodapé.
- **Rodapé:** o link "Política de privacidade" é sempre renderizado. O `<button data-gerenciar-cookies hidden>`
  só existe com medição, e o script o revela (mesmo padrão do botão de copiar do `Comando`).
- **Link em inglês:** `politica.ts` guarda, por idioma, `href` e `traduzida`. Enquanto `en.traduzida` for
  falso, o rótulo diz "(in Portuguese)"; quando a política em inglês existir, troca-se o `href` e o marcador.
- **Textos:** `textos.consentimento` (título, texto, política, aceitar, recusar, fechar, escolha atual,
  rótulo da região) e `rodape.politica`/`rodape.gerenciar`, em `pt` e `en`; o teste de paridade do tema já
  cobre as duas direções (RF-08).

## Identificador e ambiente

`PUBLIC_GA_MEASUREMENT_ID` é lido em tempo de build (`import.meta.env`) pelo `Pagina` e pelo `Rodape`, e
passa por `validarIdMedicao` (`^G-[A-Z0-9]{10}$`). Válido: o banner é renderizado e o identificador vai no
atributo `data-medicao` do banner, **não** dentro do JavaScript empacotado, então o mesmo arquivo `.js`
serve com e sem medição. Vazio ou inválido: nada é renderizado e o build segue (RF-06).

Os `astro.config.mjs` ganham `vite.envDir: "../.."`, para um único `.env` na raiz (o `.env.example` já mora
lá) servir os dois sites no `pnpm dev`.

## CSP

`scripts/csp.mjs` exporta `politicaCsp({ medicao })`, que devolve as diretivas e o texto do cabeçalho:

| Diretiva                                                   | Sem medição    | Com medição                                                                                    |
| ---------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `default-src`                                              | `'none'`       | `'none'`                                                                                       |
| `script-src`                                               | `'self'`       | `'self' https://www.googletagmanager.com`                                                      |
| `style-src`                                                | `'self'`       | `'self'`                                                                                       |
| `font-src`                                                 | `'self'`       | `'self'`                                                                                       |
| `img-src`                                                  | `'self' data:` | `'self' data: https://*.google-analytics.com https://*.googletagmanager.com`                   |
| `connect-src`                                              | `'none'`       | `https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com` |
| `base-uri`, `form-action`, `object-src`, `frame-ancestors` | `'none'`       | `'none'`                                                                                       |

Sem `unsafe-inline`, sem `unsafe-eval`, sem nonce. O `data:` do `img-src` existe só por causa do
`<link rel="icon" href="data:,">` do `Pagina`, que evita o pedido de `/favicon.ico` até a fase de imagens;
sai junto com ele. A lista do Google segue a documentação de CSP estrita do GA4 e é **confirmada no
navegador** com consentimento concedido (nenhuma violação no console); se o Google exigir mais um domínio,
ele entra aqui, no teste e na documentação, nunca como `*`.

O `verificar-dist` aprende duas coisas:

1. **Coerência do modo.** Uma página tem banner, controle de gerenciar e referência ao script de
   consentimento, ou não tem nenhum dos três (RF-06). Meio-termo reprova.
2. **Compatibilidade com a CSP.** Escolhe `politicaCsp` conforme o modo detectado e exige que todo
   `<script src>`, `<link>` que busca recurso (`stylesheet`, `preload`, `modulepreload`, `icon`), `<img>` e
   `<source>` aponte para `'self'` ou para um domínio da política; no modo sem medição, nenhuma URL absoluta
   externa passa (RF-09). Os `<a href>` e os `<link>` de `canonical`/`alternate` não buscam recurso e ficam fora.

Como o `gtag.js` é criado pelo script, o domínio dele não aparece no HTML. Um teste em `test/` garante que a
constante de URL do `gtag.js` no núcleo é aceita pelo `script-src` de `politicaCsp({ medicao: true })`.

O deploy (fase de publicação) importa `politicaCsp` para escrever o cabeçalho; esta spec não emite cabeçalho.

## ADRs

### ADR-1 — `gtag.js` só depois do aceite, tudo em script externo

- **Decisão:** o único script de medição é um módulo externo. Ele define o estado negado, restaura a escolha e
  cria o `<script>` do `gtag.js` somente com `analytics_storage` concedido.
- **Alternativas:** Consent Mode "advanced" (carregar o `gtag.js` sempre, com pings sem cookie enquanto
  negado); snippet inline do Google com hash `sha256` na CSP.
- **Porquê:** o "advanced" faz pedidos ao Google antes da escolha, contra RF-03 e RNF-03. O hash inline obriga
  a CSP a conhecer o texto exato do snippet e abre a porta para `unsafe-hashes`/inline, que RNF-01 recusa.
- **Trade-off:** quem recusa não gera nenhum sinal modelado no GA4; é o comportamento honesto e o mesmo do
  site principal. O estado negado é definido depois do HTML (módulos executam deferidos), mas nada carrega o
  `gtag.js` antes dele.

### ADR-2 — Escolha em cookie de domínio, com gravação conferida e dois recuos

- **Decisão:** cookie `cookies-accepted` no domínio do site principal; gravação seguida de leitura; recuo para
  `localStorage` e depois memória.
- **Alternativas:** `localStorage` por site (uma pergunta por subdomínio); cookie por host; detectar o ambiente
  pelo nome do host (`localhost`).
- **Porquê:** é a única forma de a escolha valer nos três sites (objetivo "uma escolha para todos"). A
  conferência pela leitura trata `localhost`, pré-visualização e navegador sem cookie com a mesma regra, sem
  lista de hosts.
- **Trade-off:** o cookie de domínio é enviado a todo subdomínio (o valor é `true`/`false`, sem risco); o site
  principal precisa adotar o mesmo contrato.

### ADR-3 — Núcleo puro com portas injetadas

- **Decisão:** toda a lógica em `consentimento.ts` recebe `Armazem`, `gtag` e `dataLayer`; o script de entrada
  só monta os objetos reais e liga os eventos.
- **Alternativas:** um único script que usa `document.cookie`, `localStorage` e `window.gtag` direto.
- **Porquê:** RNF-05 pede teste sem navegador, e a parte que dá errado (cookie recusado, `localStorage` que
  lança, ordem dos comandos) é justamente a lógica.
- **Trade-off:** uma camada a mais de tipos. O script de entrada fica tão fino que a conferência dele é a de
  navegador.

### ADR-4 — Banner primeiro no DOM, oculto por padrão, revelado pelo script

- **Decisão:** `hidden` no HTML; o script revela sem escolha gravada; o banner é o primeiro filho do `<body>`.
- **Alternativas:** banner visível no HTML e escondido pelo script quando há escolha; banner no fim do `<body>`;
  `role="dialog"` modal com armadilha de foco.
- **Porquê:** visível por padrão faz o banner piscar para quem já escolheu; no fim do `<body>` o teclado
  atravessa a página inteira; modal rouba o foco, contra RF-02.
- **Trade-off:** o banner aparece só depois do script (um pouco depois da primeira pintura) e não existe sem
  JavaScript, o que é coerente: sem JavaScript não há medição a consentir.

### ADR-5 — A CSP mora em `scripts/csp.mjs` e é conferida no build

- **Decisão:** módulo `.mjs` puro, importado pelo `verificar-dist`, pelo teste da raiz e, depois, pelo deploy.
- **Alternativas:** texto da política num arquivo `_headers` escrito à mão; `<meta http-equiv>` no HTML.
- **Porquê:** uma fonte só impede a política documentada, a testada e a emitida de divergirem. O `<meta>` não
  aceita `frame-ancestors` e duplicaria o cabeçalho. `.mjs` porque o `verificar-dist` roda em Node puro.
- **Trade-off:** a política ainda não é emitida por nada até o deploy; o teste e o verificador a protegem até lá.

### ADR-6 — Revogar só pelo Consent Mode, como no site principal

- **Decisão:** ao recusar depois de ter aceitado, `consent update` com `analytics_storage: "denied"` e nada
  mais. Os cookies `_ga*` já gravados não são apagados.
- **Alternativas:** apagar `_ga` e `_ga_*` na revogação.
- **Porquê:** os três sites compartilham a propriedade e o cookie `_ga` do domínio; manter o mesmo
  comportamento do site principal evita que a revogação aja diferente conforme o site em que foi feita.
- **Trade-off:** o identificador antigo permanece no navegador até expirar, sem ser enviado nem renovado
  enquanto o consentimento estiver negado. Se o site principal passar a apagá-lo, este design acompanha.

### ADR-7 — Identificador no HTML, não no pacote de JavaScript

- **Decisão:** o ID vai em `data-medicao` no banner; o script o lê de lá.
- **Alternativas:** `import.meta.env` dentro do script (o Vite o embute no `.js`).
- **Porquê:** o `.js` fica idêntico com e sem medição, o ID aparece exatamente onde RF-06 manda e o teste do
  script não depende do ambiente.
- **Trade-off:** o script falha em silêncio se o atributo faltar; o `verificar-dist` já reprova banner sem ele.

## Interfaces e URLs

Nenhuma rota nova e nenhuma página de política. Os dois links apontam para a política do site principal
(`https://ryanmorais.com.br/politica-de-privacidade/`, constante em `politica.ts`). O cookie de escolha é o
contrato acima; o `window.dataLayer` e o `gtag` são os do Google, sem evento personalizado (não-objetivo).

## Impacto

- **Altera:** `Pagina.astro` (banner), `Rodape.astro` (política e gerenciar), `textos.ts`,
  `packages/tema/package.json` (exports), `apps/*/astro.config.mjs` (`envDir`), `scripts/verificar-dist.mjs`
  e o teste dele, `.env.example` (comentário), `ci.yml` e `lighthouse.yml` (build com identificador de
  teste), `CLAUDE.md` e `docs/stack.md` (a nota "a medição ainda não existe" sai).
- **Cria:** os arquivos da seção "Estrutura".
- **CI:** o job `qualidade` passa a construir os dois sites também com `PUBLIC_GA_MEASUREMENT_ID=G-TESTE12345`
  (identificador inválido de propósito para o Google, válido para o formato), para o `verificar-dist` exercitar
  o modo com medição; o Lighthouse CI constrói só com ele, porque a primeira visita (banner aberto) é o caso
  medido (RNF-03). Nenhum pedido ao Google sai, porque ninguém clica em "Aceitar" ali.
- **Não altera:** ruleset, Dependabot, dependências (nenhuma nova).

## Riscos

- **Astro emitir o `<script>` do banner mesmo sem renderizá-lo.** O Astro recolhe scripts pelo grafo de
  módulos e pode incluir o do `Consentimento.astro` mesmo atrás de um `if`. Spike na primeira etapa. Se
  ocorrer, o script de entrada vira inerte sem o `[data-consentimento]` e o `verificar-dist` aceita o `<script
src>` do consentimento só quando o banner existe; se nem isso fechar RF-06, o banner passa a ser escolhido
  por um segundo layout, por modo.
- **`vite.envDir` não ser respeitado pelo Astro** para `import.meta.env` nos componentes do tema: o spike
  confirma; o recuo é um `.env` por app.
- **Domínios do Google insuficientes** para a CSP (Google muda os endpoints): a verificação em navegador com
  consentimento concedido pega a violação; o ajuste é um domínio nomeado, nunca `*`.
- **O banner virar o LCP** da página no celular: é texto em cartão fixo e pequeno; o Lighthouse CI com o
  banner aberto mede, e desempenho abaixo de 0,9 é só aviso.
- **Site principal divergir do contrato do cookie** (nome, domínio, valores): a verificação final entre sites é
  pós-deploy; até lá o contrato desta spec é a referência.
- **Leitor de tela não anunciar o banner revelado depois do carregamento.** Por isso ele é o primeiro filho do
  `<body>`, com região nomeada; a conferência com NVDA decide se precisa de ajuste.

## Testes

- **`consentimento.test.ts`:** estado padrão negado nos quatro campos; aceitar concede só `analytics_storage`;
  recusar mantém tudo negado e não carrega o `gtag.js`; restauração a partir do cookie, do armazenamento local
  e da memória; cookie que não confirma na leitura cai para o local; local que lança cai para a memória; o
  cookie vence o local; valor estranho no cookie é "sem escolha"; revogação só nega `analytics_storage`;
  `criarGtag` empurra `arguments`; ordem dos comandos (`default` → `update` → `js` → `config`) e um único
  `config` mesmo com aceitar, recusar e aceitar de novo.
- **`medicao.test.ts`:** `G-ABC1234567` válido; vazio, `undefined`, com espaço, minúsculo, curto e longo demais
  recusados.
- **`csp.test.mjs`:** com medição, `script-src` tem `'self'` e só o domínio do `gtag.js`; sem medição, nenhuma
  diretiva lista domínio externo; nunca `unsafe-inline`, `unsafe-eval` nem `*`.
- **`verificar-dist.test.mjs`:** HTML com medição, sem inline e compatível; sem medição, sem banner, controle
  nem script; modo meio-termo reprovado; `<script src>` de domínio fora da CSP reprovado; inline reprovado.
- **`test/` da raiz:** a URL do `gtag.js` do núcleo é aceita por `politicaCsp({ medicao: true })`.
- **`textos.test.ts`:** paridade `pt`/`en` já cobre `consentimento` e os novos rótulos do rodapé.
- **Navegador real** (tarefa da etapa final): banner a 390 e 1280 px, claro e escuro; teclado; NVDA; computed
  style de "Aceitar" e "Recusar" idêntico; rodapé e "Gerenciar cookies" alcançáveis com o banner aberto; sem cookie `_ga*` e sem pedido ao Google antes do aceite; com
  aceite, nenhuma violação de CSP e um `page_view`; recusar depois deixa de enviar medição; `axe-core` sem violações com o
  banner aberto e fechado; Lighthouse CI com o banner aberto.
