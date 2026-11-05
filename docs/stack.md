# A stack, e o porquê

Cada tecnologia que sustenta as Páginas Vigil: o que faz, por que foi escolhida no lugar da alternativa e os poucos conceitos que valem estudar primeiro.

Este mapa não é exaustivo: o grafo completo de versões está no `pnpm-lock.yaml`. Aqui está a forma do projeto e o raciocínio por trás de cada peça.

O projeto gera dois sites estáticos a partir de um workspace, e a mesma sequência de conferências roda na máquina de quem desenvolve e no CI:

```text
packages/tema  ──►  apps/webvigil  ──┐
  (compartilhado)   apps/mailvigil ──┴──►  astro build  ──►  apps/<site>/dist (HTML estático)
                                                    ▲
Prettier · ESLint · astro check · Vitest ───────────┘  pre-commit local e job `qualidade` do CI
```

---

## Linguagem e pacotes

### TypeScript 6.0

O código dos sites e do pacote `tema`. O `tsc` confere os tipos em modo estrito; nos arquivos `.astro`, quem confere é o `astro check`.

**Por que esta:** tipos pegam, antes do navegador, o erro de uma chave de texto que não existe ou de um dicionário com o formato errado. O projeto fica no 6.0 de propósito: `@astrojs/check` aceita só `^5 || ^6` e `typescript-eslint` aceita `<6.1`, então o TypeScript 7 espera essas duas ferramentas. Alternativa descartada: JavaScript com JSDoc, que perde a checagem nos arquivos `.astro`.

**Estudar:** `strict`, tipos de união e literais (`"pt" | "en"`), `as const`, tipos recursivos (o `Dicionario` do `tema`), `satisfies`.

**Docs:** [TypeScript: manual](https://www.typescriptlang.org/docs/handbook/intro.html).

### Node 26 e pnpm 12 (workspace)

O Node roda as ferramentas de desenvolvimento. O pnpm instala as dependências e organiza o repositório em três pacotes (`packages/tema`, `apps/webvigil`, `apps/mailvigil`) que se enxergam por `workspace:*`. As versões compartilhadas moram num `catalog:` em `pnpm-workspace.yaml`, e `minimumReleaseAge` faz uma release nova esperar uma semana antes de ser instalada.

**Por que esta:** um repositório só serve os dois sites sem duplicar tema, configuração nem CI. Alternativa descartada: npm workspaces, que não têm catálogo de versões nem a espera por release nova. O pnpm também instala só o que cada pacote declara, o que evita dependência fantasma.

**Estudar:** `pnpm-workspace.yaml` (`packages`, `catalog`, `minimumReleaseAge`), `pnpm --filter`, `workspace:*`, `pnpm install --frozen-lockfile`, o campo `packageManager`.

**Docs:** [pnpm: workspaces](https://pnpm.io/pt/workspaces).

---

## Páginas

### Astro 7

O gerador dos sites. Cada página `.astro` vira HTML pronto no `astro build`, sem JavaScript no navegador, a menos que a página peça. A estrutura `src/pages/` define as rotas: o português na raiz e o inglês em `en/`.

**Por que esta:** os sites são conteúdo, não aplicação: HTML estático carrega rápido, é fácil de hospedar e vai bem nas notas de acessibilidade e SEO. Alternativas descartadas: um SPA (React com Vite) entregaria JavaScript demais para texto, e Next.js traria um servidor que o site não precisa.

**Estudar:** componentes `.astro` (a cerquinha `---` do frontmatter), `src/pages/` e rotas, layouts, `<slot />`, props, o comando `astro build` e o `astro check`.

**Docs:** [Astro](https://docs.astro.build/pt-br/getting-started/).

### Dicionários de texto por idioma

Não há biblioteca de i18n: cada produto tem um dicionário por idioma (um objeto TypeScript com os textos), e a página lê dele. O `tema` exporta `chavesFaltantes`, que compara os dois dicionários, e um teste falha se um texto existir só em um idioma.

**Por que esta:** com duas línguas fixas e páginas estáticas, uma biblioteca de i18n seria peso sem ganho. O teste de paridade dá a garantia que importa, que é nunca publicar uma página com texto faltando.

**Estudar:** tipos recursivos (`Dicionario`), `Object.entries` e recursão sobre objetos, `hreflang` e `x-default` para SEO bilíngue.

**Docs:** [Google: páginas em vários idiomas](https://developers.google.com/search/docs/specialty/international/localized-versions?hl=pt-br).

---

## Ferramentas de desenvolvimento

### Vitest 5

O executor de testes. Roda os arquivos `*.test.ts` com a sintaxe do Jest (`describe`, `it`, `expect`) e entende TypeScript sem configuração.

**Por que esta:** é o executor de testes do ecossistema Vite/Astro e lê TypeScript direto. Alternativa descartada: `node:test`, que obrigaria a transpilar o TypeScript à parte.

**Estudar:** `describe`/`it`/`expect`, `vitest run` contra o modo de observação, `toEqual` contra `toBe`.

**Docs:** [Vitest](https://vitest.dev/).

### ESLint 10 e `typescript-eslint`

O lint: acha erros prováveis (variável sem uso, comparação suspeita) e problemas de acessibilidade nos arquivos `.astro`, com o `eslint-plugin-astro`. A configuração é um arquivo só, `eslint.config.mjs`.

**Por que esta:** o lint é o que cobre o que o compilador não vê. Alternativa descartada: Biome, que ainda não cobre os arquivos `.astro` por inteiro.

**Estudar:** o formato flat config (`eslint.config.mjs`), regras recomendadas, `--fix`, como desligar uma regra com justificativa.

**Docs:** [ESLint](https://eslint.org/docs/latest/) · [typescript-eslint](https://typescript-eslint.io/).

### Prettier 3 (com `prettier-plugin-astro`)

O formatador. Deixa todo arquivo com a mesma cara, inclusive os `.astro`, e acaba com discussão de estilo no PR.

**Por que esta:** formatar à mão não escala. O plugin do Astro entende o frontmatter e o HTML do mesmo arquivo.

**Estudar:** `.prettierrc.json`, `.prettierignore`, `prettier --check` contra `--write`.

**Docs:** [Prettier](https://prettier.io/docs/).

---

## Automação e segurança

### GitHub Actions

O CI. O job `qualidade` roda formatação, lint, tipos, testes e build; o job `seguranca` roda o `pnpm audit`. Há ainda CodeQL, `dependency-review`, um `pnpm audit` semanal e o Lighthouse CI. Toda ação de terceiros é fixada por SHA de commit, e o ruleset `proteger-main` exige o check `qualidade` para mesclar.

**Por que esta:** o repositório já mora no GitHub. Fixar por SHA impede que uma tag movida, ou comprometida, mude o que o CI executa.

**Estudar:** `on:` (gatilhos), `jobs` e `steps`, `permissions` mínimas, fixar `uses:` por SHA, matriz de execução.

**Docs:** [GitHub Actions](https://docs.github.com/pt/actions).

### Lighthouse CI

Mede cada site já construído, em celular e em desktop, e falha quando acessibilidade, boas práticas ou SEO caem abaixo de 0,95, ou quando há erro de contraste, imagem sem dimensão ou erro no console. Desempenho e peso só avisam. Os limites ficam em `.github/lighthouse/`.

**Por que esta:** pega regressão de acessibilidade e de estrutura antes da publicação. O `@lhci/cli` entra por `npx`, e não como dependência, porque a árvore dele traz vulnerabilidades que derrubariam o `pnpm audit`.

**Estudar:** as quatro categorias do Lighthouse, `assertions` no arquivo de configuração, Core Web Vitals (LCP, CLS).

**Docs:** [Lighthouse CI](https://googlechrome.github.io/lighthouse-ci/docs/).

### Dependabot, `pnpm audit` e CodeQL

O Dependabot abre PRs de atualização por semana, agrupando minor e patch, com cooldown de 7 dias. O `pnpm audit` procura vulnerabilidades conhecidas nas dependências, e o CodeQL analisa o código em busca de padrões inseguros.

**Por que estas:** manter as dependências em dia e vigiadas é o que impede uma vulnerabilidade antiga de ficar para sempre. O cooldown evita instalar uma release publicada há poucas horas, que pode estar quebrada ou comprometida.

**Estudar:** `dependabot.yml` (`groups`, `cooldown`), a leitura de um relatório do `pnpm audit`, o que é um GHSA.

**Docs:** [Dependabot](https://docs.github.com/pt/code-security/dependabot) · [CodeQL](https://codeql.github.com/docs/).

---

## Peças menores

| Peça                   | Para que serve                                                                    |
| ---------------------- | --------------------------------------------------------------------------------- |
| `@astrojs/check`       | Faz o `tsc` entender os arquivos `.astro` (o `pnpm typecheck` dos sites).         |
| `eslint-plugin-astro`  | Regras de lint (e de acessibilidade) para `.astro`.                               |
| `globals`              | Lista dos globais de cada ambiente (navegador, Node) para o ESLint.               |
| `@types/node`          | Tipos do Node para os scripts e os hooks de desenvolvimento.                      |
| `.githooks/pre-commit` | Roda formatação, lint, tipos e testes antes de cada commit, o mesmo portão do CI. |

---

## O que deliberadamente não está na stack

- **React, Vue ou outro framework de interface:** as páginas são texto e imagem; interatividade cabe em HTML e em poucas linhas de script.
- **Tailwind ou outra biblioteca de CSS:** o CSS é pouco e vem de um tema próprio, em CSS comum.
- **Biblioteca de i18n:** duas línguas fixas num site estático não justificam; o dicionário e o teste de paridade bastam.
- **Next.js, Nuxt ou qualquer renderização no servidor:** o conteúdo não muda por visitante, então HTML pronto atende.
- **Bundler próprio (Vite avulso, webpack):** o Astro já traz o seu.
- **CDN de fontes ou de scripts de terceiros:** quanto menos origem externa, menor a superfície de ataque e mais simples a política de segurança de conteúdo.
