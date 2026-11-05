# CLAUDE.md

## Visão geral do projeto

Sites estáticos de apresentação de duas ferramentas de código aberto: o
[WebVigil](https://github.com/ryanvmorais/webvigil) (scanner de vulnerabilidades web) e o
[MailVigil](https://github.com/ryanvmorais/mailvigil) (analisador de relatórios DMARC). Astro, TypeScript,
um workspace pnpm. Cada site é publicado no próprio subdomínio (`webvigil.ryanmorais.com.br` e
`mailvigil.ryanmorais.com.br`) e existe em português (`/`) e em inglês (`/en/`).

> Cuidado: o nome do repositório (`paginas-vigil`) é exceção à regra "nome do repositório = subdomínio",
> porque um repositório serve dois subdomínios. Não renomeie para casar com um deles.

Estado: em construção. As páginas em `apps/*/src/pages/index.astro` são esqueletos e ainda não estão no ar.

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

## Arquitetura

```text
packages/tema/        # tema e utilidades compartilhados pelos dois sites
  src/idiomas.ts      # IDIOMAS e chavesFaltantes: confere a paridade pt/en dos dicionários
  src/estilos/        # fontes.css, tokens.css e base.css: estilos globais, importados pelo layout
  src/fontes/         # woff2 em subconjunto das três fontes, a licença OFL e o LEIAME de regeração
apps/webvigil/        # site do WebVigil
apps/mailvigil/       # site do MailVigil
  src/pages/          # (em cada app) páginas Astro: português na raiz, inglês em en/
  dist/               # (em cada app) build estático, gerado e fora do git
.github/workflows/    # ci, codeql, dependency-review, pnpm-audit, lighthouse
.github/lighthouse/   # limites do Lighthouse CI por site e por formato (celular, desktop)
.githooks/            # pre-commit: o portão de qualidade em modo verificação
scripts/              # verificar-dist.mjs (e seu teste): confere o HTML gerado, rodado no build de cada site
test/                 # testes do repositório: impessoalidade.test.ts (ver "Convenções")
.claude/              # hooks do Claude Code (ver "Qualidade e automação")
```

- **Mapa da stack:** [docs/stack.md](docs/stack.md) explica cada tecnologia e o porquê da escolha.
- **Páginas estáticas em Astro**, sem framework de interface, sem Tailwind e sem biblioteca de i18n.
- **Textos em dicionários por produto e por idioma**, e um teste de paridade (`chavesFaltantes`) falha se uma
  chave existir só em um dos idiomas.
- **SEO bilíngue:** `/` em português, `/en/` em inglês, links reais entre os dois, `x-default` apontando
  para `/en/`, sem redirecionamento automático por idioma do navegador.

> ⚠️ NÃO regredir: nenhum script inline. A política de segurança de conteúdo (CSP) do deploy não vai
> permitir `unsafe-inline`; o script de consentimento da medição fica em arquivo externo. Quem guarda isso é
> o `build.inlineStylesheets: "never"` dos `astro.config.mjs` e o `scripts/verificar-dist.mjs`, que roda no
> `build` de cada site e falha se achar `<script>` sem `src`, `<style>` ou `style=` no HTML gerado.

> Cuidado: a medição é o Google Analytics 4 com Consent Mode, negado por padrão. O identificador vem de
> `PUBLIC_GA_MEASUREMENT_ID` (ver `.env.example`); vazio significa nenhuma medição. A política de
> privacidade e o banner de cookies fazem parte da página, não são opcionais.

## Convenções

- **Idioma do código, comentários, commits, branches e documentação: português.** Os textos que o visitante
  lê seguem o idioma da página. Nomes técnicos universais (`HTML`, `CSS`, `URL`) ficam como são.
- **Estilo dos arquivos:** siga o do restante do repositório: cabeçalho `@file` e comentário de documentação
  nas funções exportadas, comentários que explicam o porquê, formatação pelo Prettier (`pnpm format`).
- **Interface:** mudança de interface parte de um mockup aprovado, não do código.
- **Quem lê:** tudo o que é versionado é escrito para quem clonou o repositório: sem o nome do
  mantenedor (só em autoria e licença), com papéis ("o mantenedor") no lugar de pessoas, e sem apontar
  para comandos que só existem na máquina de quem mantém. `test/impessoalidade.test.ts` guarda isso.
- **Commits:** Conventional Commits. Os PRs são integrados com squash.

## Qualidade e automação

- **CI** (`.github/workflows/ci.yml`): job `qualidade` (Prettier, ESLint, typecheck, testes, build) e job
  `seguranca` (`pnpm audit`). Mais CodeQL, `dependency-review` e um `pnpm audit` semanal
  (`pnpm-audit.yml`). Toda `uses:` fixada por SHA, `runs-on: ubuntu-26.04`.
- **Lighthouse CI** (`.github/workflows/lighthouse.yml`): mede o build de cada site, em celular e em desktop.
  Erro: acessibilidade, boas práticas e SEO abaixo de 0,95, contraste, imagem sem dimensão, alvo de toque
  pequeno, erro no console, CLS acima de 0,1. Aviso: desempenho abaixo de 0,9 e peso acima de 500 KB. Não é
  check obrigatório. O `@lhci/cli` entra por `npx`, nunca como dependência (a árvore dele derruba o
  `pnpm audit`).
- **Ruleset `proteger-main`:** PR obrigatório, só squash, check `qualidade` exigido. Nada de commit direto na
  `main`.
- **Pre-commit** (`.githooks/pre-commit`): formatação, lint, typecheck e testes.
- **Hooks do Claude** em `.claude/` (scripts `.mjs` em `.claude/hooks/`): `proteger-gerados` (PreToolUse,
  bloqueia edição manual do `pnpm-lock.yaml`), `formatar` (PostToolUse, Prettier no arquivo editado) e
  `validar` (Stop, ESLint + `tsc` se há `.ts`, `.astro` ou `.mjs` alterado).

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
