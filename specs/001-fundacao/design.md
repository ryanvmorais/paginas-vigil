---
feature: Fundação — workspace pnpm, tema com paridade de idiomas, portão de qualidade, CI e main protegida
status: concluído
date: 2026-11-05
related:
  - 001-fundacao/requirements.md
origin: reverse-engineering
---

# 001 — Fundação — design

## Visão geral da abordagem

A fundação é um workspace pnpm pequeno em que cada peça tem um dono só. Os dois sites (`apps/webvigil` e `apps/mailvigil`) são projetos Astro independentes que geram HTML estático; o que eles compartilham mora em `packages/tema`, importado por caminho de exportação. As versões das ferramentas moram no `catalog:` do `pnpm-workspace.yaml`, então a raiz e os dois sites nunca divergem.

A qualidade é uma sequência de scripts da raiz (`format:check`, `lint`, `typecheck`, `test`, `build`) declarada uma vez no `package.json` e chamada por dois consumidores: o hook de pre-commit e o job `qualidade` do CI. Os dois não compartilham um script, compartilham os nomes dos scripts: mudar o que `pnpm lint` faz muda os dois ao mesmo tempo. A segurança da cadeia de suprimentos é uma camada em volta: lockfile com cooldown de uma semana, Dependabot, `pnpm audit`, CodeQL e `dependency-review`, e o ruleset que decide qual desses checks trava a `main`.

Esta spec descreve uma fundação que já existe (ver "Impacto no código existente"): o design registra o que foi construído e por quê.

## Layout de módulos / componentes

```text
packages/tema/src/idiomas.ts      # RF-01, RF-02: IDIOMAS, Idioma, Dicionario, chavesFaltantes
packages/tema/src/idiomas.test.ts # RF-01, RF-02, RNF-03
apps/webvigil/, apps/mailvigil/   # páginas-esqueleto em src/pages/, build em dist/
package.json                      # RF-03: scripts do portão, só devDependencies
pnpm-workspace.yaml               # RF-05, RNF-01: workspace, catalog, minimumReleaseAge, exceção do audit
pnpm-lock.yaml                    # RF-05: instalação reprodutível
tsconfig.base.json                # RF-03: base de tipos dos pacotes
eslint.config.mjs                 # RF-03: lint de .ts, .astro e .mjs
.githooks/pre-commit              # RF-03: o portão local
.github/workflows/ci.yml          # RF-03, RF-04: jobs qualidade e seguranca
.github/workflows/codeql.yml      # RF-04
.github/workflows/dependency-review.yml # RF-04
.github/workflows/pnpm-audit.yml  # RF-04: auditoria semanal
.github/workflows/lighthouse.yml  # RF-07: matriz site x celular/desktop
.github/lighthouse/*.json         # RF-07: limites por site e formato
.github/dependabot.yml            # RF-05
.claude/settings.json, hooks/     # RF-08
.env.example                      # RNF-04: o modelo, sem valor
```

O ruleset `proteger-main` (RF-06) vive nas configurações do GitHub, não no repositório; esta spec é o único registro versionado dele.

## Modelo de dados

O único dado que a fundação define é o dicionário de textos:

```ts
interface Dicionario {
  [chave: string]: string | Dicionario;
}
```

| Parte       | Tipo         | Conteúdo                                                     |
| ----------- | ------------ | ------------------------------------------------------------ |
| chave       | `string`     | nome do texto ou do grupo (`topo`, `titulo`)                 |
| valor folha | `string`     | o texto que o visitante lê, no idioma do dicionário          |
| valor grupo | `Dicionario` | subdicionário; os caminhos das folhas unem as chaves por `.` |

## Componentes

- **`chavesFaltantes(referencia, candidato)`** — percorre as folhas da referência (`caminhosDasFolhas`) e mantém as que o candidato não tem como texto (`temTexto`). Retorna a lista de caminhos; vazia significa paridade. Pura: sem DOM, rede nem estado.
- **`IDIOMAS` / `Idioma`** — `["pt", "en"]` e o tipo derivado, para as páginas e os testes nomearem os idiomas sem repetir a lista.
- **Hook `.githooks/pre-commit`** — `format:check`, `lint`, `typecheck` e `test`, abortando na primeira falha. Não roda o build, que fica no CI.
- **Hooks do Claude** — `proteger-gerados` (PreToolUse), `formatar` (PostToolUse) e `validar` (Stop), scripts `.mjs` que leem o evento por `ferramentas.mjs`.

## Interfaces

Não há URL nem contrato de rede nesta spec. As interfaces são:

- `@paginas-vigil/tema/idiomas`: a exportação do pacote do tema.
- Os nomes dos scripts da raiz, que o hook e o CI chamam.
- O check `qualidade`, o nome que o ruleset exige.

## Decisões de design

### ADR-1 — Um workspace com catálogo de versões

**Decisão.** um repositório, um workspace pnpm (`packages/*`, `apps/*`), com as versões compartilhadas no `catalog:`.
**Alternativas.** um repositório por site; um workspace sem catálogo.
**Porquê.** os dois sites usam as mesmas ferramentas e o mesmo tema; o catálogo impede que a raiz e os apps divirjam, e um PR de dependência cobre os dois.
**Trade-off.** o nome do repositório não casa com nenhum subdomínio (exceção registrada no `CLAUDE.md`), e os dois sites sobem juntos no CI.

### ADR-2 — Paridade conferida por teste, sem biblioteca de i18n

**Decisão.** dicionários por produto e por idioma e `chavesFaltantes` no teste de cada site.
**Alternativas.** uma biblioteca de i18n; conferir os textos na revisão.
**Porquê.** são duas línguas e páginas estáticas; uma função de vinte linhas falha o CI antes de a página sair incompleta, sem dependência de runtime.
**Trade-off.** não há pluralização nem formatação por localidade. Se um dia fizer falta, é uma decisão nova.

### ADR-3 — TypeScript no 6.0 de propósito

**Decisão.** o catálogo fixa `typescript` em `^6.0.3`.
**Alternativas.** subir para o 7.
**Porquê.** `@astrojs/check` aceita `^5 || ^6` e `typescript-eslint` aceita `<6.1`.
**Trade-off.** fica uma versão atrás até as duas ferramentas aceitarem o 7.

### ADR-4 — Hook e CI compartilham os nomes dos scripts

**Decisão.** o hook e o job `qualidade` chamam `pnpm format:check`, `lint`, `typecheck` e `test`.
**Alternativas.** um script de shell comum; comandos repetidos nos dois lugares.
**Porquê.** mudar um script muda os dois consumidores ao mesmo tempo, sem arquivo intermediário.
**Trade-off.** o build roda só no CI, então um erro de build aparece no PR, não no commit.

### ADR-5 — Só `qualidade` é exigido

**Decisão.** o ruleset exige apenas `qualidade`; `seguranca`, CodeQL, `dependency-review` e Lighthouse informam.
**Alternativas.** exigir todos.
**Porquê.** um alerta novo de dependência ou de análise não pode travar o PR que o conserta, e o Lighthouse oscila com o ambiente.
**Trade-off.** um PR pode ser mesclado com alerta aberto; o `pnpm audit` semanal e o Dependabot cobrem o intervalo.

### ADR-6 — Cooldown de uma semana nas duas pontas

**Decisão.** `minimumReleaseAge` de 10080 minutos no pnpm e `cooldown` de 7 dias no Dependabot.
**Alternativas.** nenhum cooldown.
**Porquê.** uma versão recém-publicada pode estar quebrada ou comprometida no dia em que sai; as atualizações de segurança ignoram o cooldown.
**Trade-off.** correções não urgentes chegam com uma semana de atraso.

### ADR-7 — `@lhci/cli` por `npx`

**Decisão.** o Lighthouse CI não é dependência do `package.json`.
**Alternativas.** `devDependency`.
**Porquê.** a árvore dele derruba o `pnpm audit`.
**Trade-off.** a versão do `@lhci/cli` fica no workflow, fora do Dependabot do npm.

### ADR-8 — Squash como único método de merge

**Decisão.** o repositório habilita só o squash e apaga a branch depois do merge.
**Alternativas.** merge commit ou rebase.
**Porquê.** um PR vira um commit Conventional Commit na `main`, com histórico linear.
**Trade-off.** o histórico da branch se perde na `main` (fica no PR).

## Impacto no código existente

Nenhum arquivo muda: a spec registra o que o PR #1 entregou. As páginas em `apps/*/src/pages/index.astro` são esqueletos descartáveis, substituídos pelas specs de cada site.

## Limites conhecidos

- **Exceção do `pnpm audit`:** o `minimatch` 10.x (GHSA-g3hv-75wg-m249) está aceito, só em desenvolvimento, até o ESLint e o `typescript-eslint` aceitarem a 11. O motivo e a condição de saída estão comentados no `pnpm-workspace.yaml`.

## Testes

- `packages/tema/src/idiomas.test.ts` cobre RF-01 e RF-02.
- RF-03 a RF-08 são conferidos pelo próprio CI e pela inspeção do repositório e do GitHub (tarefas da etapa 3 e 4).
