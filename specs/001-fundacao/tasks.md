---
feature: Fundação — workspace pnpm, tema com paridade de idiomas, portão de qualidade, CI e main protegida
status: concluído
date: 2026-11-05
related:
  - 001-fundacao/requirements.md
  - 001-fundacao/design.md
origin: reverse-engineering
---

# 001 — Fundação — Tasks

A fundação foi construída antes desta spec (PR #1). As tarefas abaixo são o histórico de construção, já marcadas `[x]`, e cada etapa fecha com a conferência feita em 2026-11-05 contra o repositório e o GitHub.

## Etapa 0 — Workspace e ferramentas

- [x] `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`: workspace `packages/*` e `apps/*`, `packageManager` pnpm 12, `engines` Node 26, só `devDependencies`, catálogo de versões. — RNF-01, ADR-1
- [x] `pnpm-workspace.yaml`: `minimumReleaseAge` de uma semana e a exceção do `pnpm audit` com motivo e condição de saída. — RF-05, ADR-6
- [x] `tsconfig.base.json`, `eslint.config.mjs`, Prettier com o plugin do Astro. — RF-03
- [x] `.gitignore` e `.env.example`: `.env` e `.env.*` fora do git, estado local do Wrangler, `dist/` e `.astro/`. — RNF-04
- [x] Portão de qualidade. — `format:check`, `lint` e `typecheck` sem aviso em 2026-11-05

## Etapa 1 — Tema compartilhado

- [x] `packages/tema/src/idiomas.ts`: `IDIOMAS`, `Idioma`, `Dicionario` e `chavesFaltantes`. — RF-01, RF-02, ADR-2
- [x] `packages/tema/src/idiomas.test.ts`: um `it` por caso, com dicionários sintéticos. — RF-01, RF-02, RNF-03
- [x] `apps/webvigil` e `apps/mailvigil`: projetos Astro com a página-esqueleto em `src/pages/index.astro` e o script `build`. — ADR-1
- [x] Portão de qualidade. — `pnpm test`: 6 testes, 6 passam; `pnpm build`: 1 página por site

## Etapa 2 — Portão local e CI

- [x] `.githooks/pre-commit`: `format:check`, `lint`, `typecheck` e `test`, nessa ordem, abortando na primeira que falha. — RF-03, ADR-4
- [x] `.github/workflows/ci.yml`: jobs `qualidade` (a mesma sequência, mais o build) e `seguranca` (`pnpm audit`), `permissions: contents: read`, `runs-on: ubuntu-26.04`, `uses:` fixadas por SHA. — RF-03, RF-04
- [x] `.github/workflows/codeql.yml`, `dependency-review.yml` e `pnpm-audit.yml` (segunda-feira, 09:00 de Brasília). — RF-04, ADR-5
- [x] `.github/dependabot.yml`: npm e GitHub Actions, domingo 09:00 de Brasília, minor e patch agrupados, cooldown de 7 dias. — RF-05, ADR-6
- [x] Portão de qualidade. — `pnpm audit`: "1 ignored: 1 moderate" (a exceção registrada em `pnpm-workspace.yaml`); CI verde no PR #1

## Etapa 3 — Proteção da `main`

- [x] Ruleset `proteger-main` (configuração do GitHub): PR obrigatório, histórico linear, sem deleção nem force-push, check `qualidade` exigido. — RF-06, ADR-5
- [x] Configuração do repositório: só squash habilitado e branch apagada após o merge. — RF-06, ADR-8
- [x] Portão de qualidade. — conferência via `gh api` em 2026-11-05: ruleset `active` com as regras `deletion`, `non_fast_forward`, `required_linear_history`, `pull_request` e `required_status_checks` (`qualidade`); `allow_squash_merge: true`, `allow_merge_commit: false`, `allow_rebase_merge: false`

## Etapa 4 — Lighthouse CI e guardas do Claude Code

- [x] `.github/workflows/lighthouse.yml` e `.github/lighthouse/*.json`: matriz site x celular/desktop, limites de erro e de aviso, `@lhci/cli` por `npx`. — RF-07, ADR-7
- [x] `.claude/settings.json` e `.claude/hooks/`: `proteger-gerados`, `formatar` e `validar`. — RF-08
- [x] Portão de qualidade final. — `format:check`, `lint`, `typecheck`, `test` (6 de 6) e `build` (2 sites) passam em 2026-11-05
