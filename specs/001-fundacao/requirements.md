---
feature: Fundação — workspace pnpm, tema com paridade de idiomas, portão de qualidade, CI e main protegida
status: concluído
date: 2026-11-05
related: []
origin: reverse-engineering
---

# 001 — Fundação

## Contexto e problema

As Páginas Vigil são dois sites estáticos em Astro, um para o WebVigil e outro para o MailVigil, mantidos num só repositório e publicados cada um no próprio subdomínio, em português (`/`) e em inglês (`/en/`). Antes de qualquer página real existir, os dois sites precisam do mesmo chão: um workspace em que as versões das ferramentas não divirjam, uma sequência de qualidade que signifique o mesmo no computador e no CI, uma cadeia de suprimentos vigiada e uma `main` que só aceite mudança que passou.

Hoje (2026-11-05) esse chão existe: o PR #1 entregou o workspace pnpm (`packages/tema`, `apps/webvigil`, `apps/mailvigil`) com páginas-esqueleto, o portão de qualidade, o hook de pre-commit, os workflows de CI, o Dependabot, os hooks do Claude Code e o ruleset `proteger-main`. Foi construído a partir de uma lista de conferência e nunca foi escrito como contrato. Esta spec registra o que a fundação garante, para o que for construído sobre ela poder contar com isso e para qualquer mudança nela ser deliberada.

O repositório é público desde o primeiro commit: o histórico não se desfaz e os arquivos de comunidade e segurança nascem com o projeto.

## Objetivos

- **Um workspace, dois sites**: as versões das ferramentas moram num só lugar (`catalog:` do `pnpm-workspace.yaml`) e cada site gera o próprio build estático.
- **Paridade de idiomas conferível**: uma função compara os dicionários de português e inglês e aponta o texto que falta num deles, para o teste de cada site falhar antes de a página sair incompleta.
- **Uma sequência de qualidade** (Prettier, ESLint, TypeScript e `astro check`, testes, build) que roda igual no hook de pre-commit e no CI.
- **Higiene de cadeia de suprimentos**: lockfile, cooldown de uma semana, Dependabot, `pnpm audit` semanal e a cada PR, CodeQL, `dependency-review` e Actions fixadas por SHA.
- **Proteção da `main`**: PR obrigatório, só squash, histórico linear e o check `qualidade` exigido.
- **Medição de desempenho e acessibilidade** por site, em celular e em desktop (Lighthouse CI), sem travar o PR.

## Não-objetivos

- O conteúdo das páginas, o tema visual, o banner de consentimento e a política de privacidade: ficam para as specs de cada página.
- Publicação, hospedagem e domínio.

## Personas

- Como **mantenedor**, quero um portão local e um CI que concordem, para que um check verde signifique o mesmo que um clone limpo e uma mudança quebrada nunca chegue à `main`.
- Como **contribuidor**, quero uma sequência de comandos documentada e um hook que a execute, para saber se a minha mudança passa antes de abrir o PR.
- Como **visitante** de qualquer um dos sites, quero que as duas versões de idioma tenham os mesmos textos, para não encontrar uma página pela metade.

## Requisitos funcionais

### RF-01 — Conferir a paridade dos dicionários

- **Given** dois dicionários de textos (referência e candidato), possivelmente aninhados
  **When** `chavesFaltantes(referencia, candidato)` os compara
  **Then** devolve os caminhos (chaves unidas por ponto, como `topo.titulo`) que existem como texto na referência e não existem como texto no candidato, e uma lista vazia quando nada falta.
- **Given** um caminho que no candidato aponta para um subdicionário em vez de um texto
  **When** a comparação roda
  **Then** o caminho conta como faltante.
- **Given** uma chave que existe só no candidato
  **When** a comparação roda
  **Then** não conta: o teste de cada site roda a conferência nas duas direções.

### RF-02 — Idiomas publicados

- **Given** o módulo do tema
  **When** é importado por um site ou por um teste
  **Then** exporta `IDIOMAS` (`pt` e `en`) e o tipo `Idioma`, sem acessar DOM, rede nem estado global.

### RF-03 — Portão de qualidade único

- **Given** um clone com as dependências instaladas
  **When** se roda `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, nessa ordem
  **Then** cada etapa sai com código 0, e é exatamente a sequência do hook `.githooks/pre-commit` (sem o build) e do job `qualidade` do CI.
- **Given** o hook ativado com `git config core.hooksPath .githooks`
  **When** uma etapa falha
  **Then** o commit é abortado.

### RF-04 — CI e segurança de dependências

- **Given** um PR aberto contra a `main`
  **When** o CI roda
  **Then** o job `qualidade` executa o portão do RF-03 e o job `seguranca` executa `pnpm audit` sobre o lockfile.
- **Given** os workflows em `.github/workflows/`
  **When** são lidos
  **Then** toda `uses:` está fixada por SHA de commit com a versão em comentário, o runner é `ubuntu-26.04` e as permissões são somente leitura por padrão.
- **Given** o CodeQL, o `dependency-review`, o `pnpm audit` e o Lighthouse CI
  **When** um PR altera código ou dependências
  **Then** rodam, mas não são exigidos pelo ruleset: um alerta novo não trava o PR que o conserta.
- **Given** o `pnpm-audit.yml`
  **When** chega a segunda-feira às 09:00 (horário de Brasília)
  **Then** audita o lockfile da `main`, para uma vulnerabilidade nova aparecer mesmo sem PR aberto.

### RF-05 — Atualização de dependências

- **Given** o `dependabot.yml`
  **When** a agenda semanal (domingo, 09:00, horário de Brasília) dispara
  **Then** abre um PR por ecossistema (npm e GitHub Actions) com minor e patch agrupados, major em PR separado, e uma release nova só é proposta depois de sete dias.
- **Given** o `pnpm-workspace.yaml`
  **When** o pnpm resolve uma release
  **Then** respeita `minimumReleaseAge` de uma semana, e toda exceção aceita do `pnpm audit` tem o motivo e a condição de saída comentados.

### RF-06 — Proteção da `main`

- **Given** o ruleset `proteger-main`
  **When** alguém tenta alterar a `main`
  **Then** só um PR passa: histórico linear, sem deleção nem force-push, e com o check `qualidade` aprovado; a configuração do repositório habilita só o squash.

### RF-07 — Medição com o Lighthouse CI

- **Given** o build de cada site
  **When** o `lighthouse.yml` roda
  **Then** mede o site em celular e em desktop com os limites de `.github/lighthouse/`: erro para acessibilidade, boas práticas e SEO abaixo de 0,95, contraste, imagem sem dimensão, alvo de toque pequeno, erro no console e CLS acima de 0,1; aviso para desempenho abaixo de 0,9 e peso acima de 500 KB.

### RF-08 — Guardas do Claude Code

- **Given** a configuração em `.claude/settings.json`
  **When** o agente edita um arquivo
  **Then** a edição manual de `pnpm-lock.yaml`, `dist/` e `.astro/` é bloqueada com a orientação do caminho certo, o arquivo editado é formatado pelo Prettier e, ao fim do turno, o ESLint e o `tsc` rodam se há `.ts`, `.astro` ou `.mjs` alterado.

## Requisitos não-funcionais

### RNF-01 — Versões em um lugar só

Cada dependência compartilhada declara `catalog:` no `package.json` do pacote e a versão mora só no `pnpm-workspace.yaml`. A exceção, o TypeScript no 6.0, tem o motivo e a condição de saída comentados ali.

### RNF-02 — Sem script inline

Nenhuma página usa script inline, porque a política de segurança de conteúdo do deploy não vai permitir `unsafe-inline`.

### RNF-03 — Testes offline e determinísticos

A suíte não usa rede, relógio nem dado real: entradas são montadas no próprio teste.

### RNF-04 — Repositório público desde o primeiro commit

Nenhum segredo, dado real ou arquivo privado no histórico. O `.gitignore` cobre `.env`, `.env.*` (menos o `.env.example`) e o estado local do Wrangler.

## Perguntas em aberto

Nenhuma.

## Decisões resolvidas

1. O repositório se chama `paginas-vigil`, e não como um dos subdomínios, porque serve dois.
2. O TypeScript fica no 6.0 enquanto `@astrojs/check` e `typescript-eslint` não aceitarem o 7.
3. Só o check `qualidade` é exigido; `seguranca`, CodeQL, `dependency-review` e Lighthouse informam, mas não travam.
4. O `@lhci/cli` entra por `npx`, nunca como dependência, porque a árvore dele derruba o `pnpm audit`.

## Testes

- `packages/tema/src/idiomas.test.ts`: `IDIOMAS` na ordem `pt`, `en`; dicionários iguais (lista vazia); texto faltando num subdicionário; subdicionário inteiro faltando; texto que no candidato virou subdicionário; chave que só existe no candidato.
- O CI roda o portão completo em todo PR.
