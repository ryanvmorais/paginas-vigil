# CLAUDE.md

## Visão geral do projeto

Sites estáticos de apresentação de duas ferramentas de código aberto: o
[WebVigil](https://github.com/ryanvmorais/webvigil) (scanner de vulnerabilidades web) e o
[MailVigil](https://github.com/ryanvmorais/mailvigil) (analisador de relatórios DMARC). Astro, TypeScript,
um workspace pnpm. Cada site é publicado no próprio subdomínio (`webvigil.ryanmorais.com.br` e
`mailvigil.ryanmorais.com.br`) e existe em português (`/`) e em inglês (`/en/`).

> Cuidado: o nome do repositório (`paginas-vigil`) é exceção à regra "nome do repositório = subdomínio",
> porque um repositório serve dois subdomínios. Não renomeie para casar com um deles.

Estado: em construção. Os dois sites já têm a página inteira (português e inglês) montada com o tema e a marca (favicon, ícone de tela inicial e imagem social). Nada está no ar. A medição (Google Analytics 4 com consentimento) já está no código, mas só liga com um identificador; a política de privacidade mora no site principal.

## Comandos comuns

```bash
# Instala as dependências e ativa o hook de pre-commit (uma vez por clone)
pnpm install
git config core.hooksPath .githooks

# Portão de qualidade: o mesmo do CI e do pre-commit
pnpm format:check   # Prettier, sem alterar arquivos
pnpm lint           # ESLint
pnpm typecheck      # tsc (tema) e astro check (sites)
pnpm test           # Vitest
pnpm build          # build estático de cada site, em apps/<site>/dist

# Corrige a formatação
pnpm format

# Um site só (modo de desenvolvimento)
pnpm --filter webvigil dev
pnpm --filter mailvigil dev
```

Para conferir o que o visitante verá, construa e sirva o build (no `cmd`; `rem` é o comentário dele):

```bat
rem Build com a medição ligada (identificador de teste); sem a variável a página sai sem banner
set PUBLIC_GA_MEASUREMENT_ID=G-TESTE12345
pnpm --filter webvigil build

rem Serve o build para a rede: abra o endereço "Network" que o terminal mostra, no computador e no celular
pnpm --filter webvigil preview --host --port 4400

rem Limpa a variável deste terminal
set PUBLIC_GA_MEASUREMENT_ID=
```

No PowerShell a variável é `$env:PUBLIC_GA_MEASUREMENT_ID = "G-TESTE12345"` (em outra linha, ou separada do
comando por `;`); no bash, `PUBLIC_GA_MEASUREMENT_ID=G-TESTE12345 pnpm --filter webvigil build`.

> Cuidado: no `cmd`, `set VAR=valor` não leva espaço ao redor do `=`; com espaço o nome da variável fica
> errado e o build sai sem banner. A variável vale até fechar o terminal.

> Cuidado: aberta por um endereço de rede (`http://192.168...`), a página não está em contexto seguro, o
> navegador não oferece `navigator.clipboard` e o botão "Copiar" não aparece, o que é o comportamento
> previsto. Para vê-lo no celular, use `localhost` (por exemplo, `adb reverse` no Android). O `preview` também
> não emite a CSP: quem a confere no build é o `verificar-dist`.

## Arquitetura

```text
packages/tema/        # tema e utilidades compartilhados pelos dois sites
  src/idiomas.ts      # IDIOMAS e chavesFaltantes: confere a paridade pt/en dos dicionários
  src/medicao.ts      # validarIdMedicao: só o formato G-XXXXXXXXXX liga a medição
  src/politica.ts     # endereço da política de privacidade do site principal e domínio do cookie de escolha
  src/consentimento.ts # núcleo puro do consentimento: escolha, cookie, Consent Mode e gtag, tudo injetado
                      # (cada módulo .ts tem o teste ao lado, em *.test.ts)
  src/caminhos.ts     # troca o idioma e calcula o caminho da outra versão da página (links e seletor)
  src/palavras.ts     # envolve cada palavra de um comando num span, para a linha não quebrar no hífen (Passos)
  src/textos.ts       # rótulos que o próprio tema emite (seletor de idioma, navegação, botão de copiar)
  src/layouts/        # Pagina.astro: casca da página (head, SEO bilíngue, cabeçalho, rodapé); `indexavel={false}` (a 404)
                      # emite noindex e tira canonical, alternate e og:*
  src/componentes/    # blocos .astro compartilhados: Aviso, Botao, Cabecalho, ChamadaFinal, Comando,
                      # Consentimento, FiguraRelatorio, Grupos, Limites, NaoEncontrada (a 404), Passos, Rodape, Secao,
                      # SeletorIdioma, Terminal, Topo
  src/scripts/        # copiar.ts (botão de copiar), menu.ts (fecha o menu do celular) e consentimento.ts (banner,
                      # cookie e gtag.js), empacotados pelo Astro em arquivo externo
  src/estilos/        # fontes.css, tokens.css, base.css e terminal.css: estilos globais; os três primeiros
                      # vêm pelo layout e o terminal.css pelo Terminal.astro. A escala tipográfica são os
                      # cinco tokens --fs-* de tokens.css: texto novo usa um deles (os títulos têm tamanho próprio)
  src/fontes/         # woff2 em subconjunto das três fontes, a licença OFL e o LEIAME de regeração
apps/webvigil/        # site do WebVigil
apps/mailvigil/       # site do MailVigil
  src/pages/          # (em cada app) páginas Astro: português na raiz, inglês em en/ (index e 404)
  src/textos.ts       # (em cada app) dicionários pt/en do site, com o teste de paridade em textos.test.ts
  src/terminais.ts    # (em cada app) as saídas de terminal mostradas na página
  src/componentes/    # (em cada app) Logo.astro, Vitrine.astro (a montagem das seções com o tema) e Erro404.astro
  src/assets/relatorio/ # (em cada app) capturas do relatório por idioma, tamanho e esquema de cor (webvigil só em inglês)
  public/             # (em cada app) a marca, servida na raiz do site: favicon.svg, apple-touch-icon.png (180 px) e
                      # social-pt.png e social-en.png (1280 x 640, o og:image do layout)
  dist/               # (em cada app) build estático, gerado e fora do git
.github/workflows/    # ci, codeql, dependency-review, pnpm-audit, lighthouse
.github/lighthouse/   # limites do Lighthouse CI por site e por formato (celular, desktop)
.github/              # também dependabot.yml, ISSUE_TEMPLATE/ (bug e funcionalidade) e pull_request_template.md
.githooks/            # pre-commit: o portão de qualidade em modo verificação
scripts/              # verificar-dist.mjs: confere o HTML gerado (sem inline, marcação de idioma, modo da medição, CSP,
                      # âncoras, destinos dos botões, marca: og:image, favicon e imagem social, e a página noindex sem
                      # canonical, alternate nem og:*), rodado no build de cada
                      # site; csp.mjs: a política de segurança de conteúdo, fonte única (cada .mjs tem o teste ao lado)
docs/images/          # social preview do repositório (1280 x 640), genérica: não cita nenhuma das ferramentas
test/                 # testes do repositório: impessoalidade.test.ts (ver "Convenções"), marca.test.ts (o traçado do
                      # logo igual no cabeçalho e no favicon; dimensões das imagens) e csp.test.ts (a URL do gtag.js
                      # cabe na CSP com medição e não cabe sem)
.claude/              # hooks do Claude Code (ver "Qualidade e automação")
```

- **Mapa da stack:** [docs/stack.md](docs/stack.md) explica cada tecnologia e o porquê da escolha.
- **Páginas estáticas em Astro**, sem framework de interface, sem Tailwind e sem biblioteca de i18n.
- **Textos em dicionários por produto e por idioma**, e um teste de paridade (`chavesFaltantes`) falha se uma
  chave existir só em um dos idiomas.
- **SEO bilíngue:** `/` em português, `/en/` em inglês, links reais entre os dois, `x-default` apontando
  para `/en/`, sem redirecionamento automático por idioma do navegador.

> ⚠️ NÃO regredir: nenhum script inline. A política de segurança de conteúdo (CSP) do deploy não vai
> permitir `unsafe-inline`; todo script, inclusive o de consentimento da medição, fica em arquivo
> externo. Quem guarda isso é o `build.inlineStylesheets: "never"` dos `astro.config.mjs` e o
> `scripts/verificar-dist.mjs`, que roda no `build` de cada site e falha se achar `<script>` sem `src`,
> `<style>` ou `style=` no HTML gerado.

> ⚠️ NÃO regredir: a CSP é uma só. `scripts/csp.mjs` (`politicaCsp`) define o que o deploy emite, e o
> `verificar-dist` confere cada recurso do HTML contra ela. Sem medição, nenhum domínio externo; com
> medição, só os hosts do Google Analytics, nunca `*`, `unsafe-inline` nem `unsafe-eval`. Um domínio novo
> entra em `csp.mjs`, no teste e no `design.md` da spec 003, nunca só num deles.

> Cuidado: a medição é o Google Analytics 4 com Consent Mode, negado por padrão, e o `gtag.js` só é
> carregado depois do aceite. O identificador vem de `PUBLIC_GA_MEASUREMENT_ID` (ver `.env.example`; o
> `vite.envDir` dos apps aponta para a raiz): vazio ou fora do formato significa página sem medição, sem
> banner e sem o controle "Gerenciar Cookies", e o build segue. A escolha do visitante fica no cookie
> `cookies-accepted`, de domínio, que vale também no site principal, com recuo para o `localStorage` e
> depois para a memória. O CI constrói os dois sites com e sem medição (identificador de teste
> `G-TESTE12345`), e o Lighthouse mede a página com o banner aberto.

> Cuidado: as imagens sociais (`apps/*/public/social-*.png`) são PNG montados à mão, não gerados no build:
> repetem o título da página e um recorte do terminal. Mudou o título, a saída do terminal ou o logo,
> refaça a imagem dos dois idiomas. O `verificar-dist` garante só que o arquivo existe e que a página o
> cita; o `test/marca.test.ts` garante as dimensões e o traçado do logo.

## Convenções

- **Idioma do código, comentários, commits, branches e documentação: português.** Os textos que o visitante
  lê seguem o idioma da página. Nomes técnicos universais (`HTML`, `CSS`, `URL`) ficam como são.
- **Estilo dos arquivos:** siga o do restante do repositório: cabeçalho `@file` e comentário de documentação
  nas funções exportadas, comentários que explicam o porquê, formatação pelo Prettier (`pnpm format`).
- **Interface:** mudança de interface parte de um mockup aprovado, não do código.
- **Quem lê:** tudo o que é versionado é escrito para quem clonou o repositório: sem o nome do
  mantenedor (só em autoria e licença), com papéis ("o mantenedor") no lugar de pessoas, e sem apontar
  para comandos que só existem na máquina de quem mantém. `test/impessoalidade.test.ts` guarda isso em
  todo arquivo versionado: o nome do mantenedor, skills pessoais, caminhos da máquina dele, padrões do
  fluxo pessoal dele e marcadores de pendência interna.
- **Commits:** Conventional Commits. Os PRs são integrados com squash.

## Qualidade e automação

- **CI** (`.github/workflows/ci.yml`): job `qualidade` (Prettier, ESLint, typecheck, testes, build) e job
  `seguranca` (`pnpm audit`). Mais CodeQL, `dependency-review` e um `pnpm audit` semanal
  (`pnpm-audit.yml`). Toda `uses:` fixada por SHA, `runs-on: ubuntu-26.04`.
- **Lighthouse CI** (`.github/workflows/lighthouse.yml`): mede o build de cada site, em celular e em desktop.
  Erro: acessibilidade, boas práticas e SEO abaixo de 0,95, contraste, imagem sem dimensão, alvo de toque
  pequeno, erro no console, CLS acima de 0,1. Aviso: desempenho abaixo de 0,9 e peso acima de 500 KB. Não é
  check obrigatório. O `@lhci/cli` entra por `npx`, nunca como dependência (a árvore dele derruba o
  `pnpm audit`). Cada JSON lista em `collect.url` só `/index.html` e `/en/index.html`: as 404 têm `noindex`
  de propósito, e isso reprova a auditoria `is-crawlable` (SEO cai a 0,6). Página nova indexável entra na lista.
- **Ruleset `proteger-main`:** PR obrigatório, só squash, check `qualidade` exigido. Nada de commit direto na
  `main`.
- **Pre-commit** (`.githooks/pre-commit`): formatação, lint, typecheck e testes.
- **Hooks do Claude** em `.claude/` (scripts `.mjs` em `.claude/hooks/`): `proteger-gerados` (PreToolUse,
  bloqueia edição manual do `pnpm-lock.yaml`), `formatar` (PostToolUse, Prettier no arquivo editado) e
  `validar` (Stop, ESLint + `tsc` se há `.ts`, `.astro` ou `.mjs` alterado). Os três importam o utilitário
  `ferramentas.mjs`, que acha a raiz do projeto, lê o evento e roda as ferramentas direto de `node_modules`.

## Fluxo de trabalho

Uma issue, uma branch, um PR; o PR é mesclado pelo mantenedor depois da revisão. Antes de abrir o PR, rode o
portão de qualidade e confira se os READMEs (nos dois idiomas) e este arquivo refletem a mudança.

## Specs

Cada funcionalidade nasce como spec em [specs/](specs/README.md), em três arquivos escritos em ordem:
`requirements.md`, `design.md` e `tasks.md`, cada fase aprovada antes da seguinte. O formato de referência é a
`specs/001-fundacao/`, que registra o chão atual (workspace, portões de qualidade, CI e `main`
protegida). Tela nova tem o mockup aprovado no `design.md`.

## Gestão de dependências

pnpm 12 (campo `packageManager` do `package.json`); `package.json` e `pnpm-lock.yaml` sempre juntos no commit.
As versões compartilhadas moram no `catalog:` de `pnpm-workspace.yaml`.

> Cuidado: `pnpm-workspace.yaml` guarda a configuração do pnpm 12 (o campo `pnpm` do `package.json` é
> ignorado): `minimumReleaseAge` de uma semana e a exceção aceita do `pnpm audit` (`minimatch`, só em
> desenvolvimento), com o motivo e a condição de saída comentados ali.

> Cuidado: o TypeScript fica no 6.0 de propósito, porque `@astrojs/check` e `typescript-eslint` ainda não
> aceitam o 7. A subida depende de as duas ferramentas aceitarem o 7 e está registrada numa issue aberta.

> Cuidado: o Dependabot agrupa as atualizações com cooldown de 7 dias. Revise cada PR pelo diff e pelo
> changelog do pacote.
