---
feature: Hospedagem — os dois sites no ar, cada um no seu subdomínio, com cabeçalhos de segurança, 404 e descoberta
status: concluído
date: 2026-11-07
related: [001-fundacao, 002-tema, 003-medicao, 004-pagina-webvigil, 005-pagina-mailvigil]
origin: conception
---

# 006 — Hospedagem — design

## Visão geral

Cada site é a pasta `apps/<site>/dist` servida como **Workers Static Assets**: um Worker só de arquivos (sem
`main`, sem código de servidor), ligado ao subdomínio por uma rota de domínio personalizado. São dois
projetos independentes na Cloudflare, um por site, publicados pelo mesmo workflow.

O que muda em relação a uma pasta estática sem build: **tudo o que a hospedagem lê é gerado pelo build** do
site, no modo de medição em que ele foi construído. Um passo novo, `scripts/hospedagem.mjs`, roda depois do
`astro build` e escreve em `dist/` o `_headers`, o `robots.txt` e o `sitemap.xml`. O endereço vem do `site` do
`astro.config.mjs`, e a CSP vem de `politicaCsp` (`scripts/csp.mjs`). O `verificar-dist` passa a conferir
esses arquivos junto com o HTML.

```text
 PR ─▶ ci.yml (qualidade + seguranca) ─┐
                                        │ merge na main
 main ─▶ ci.yml verde ─▶ deploy.yml ────┘      (um job por site, em paralelo)
              │
              ├─ confere o identificador de medição (variável do ambiente `producao`)
              ├─ pnpm build do site                  (astro build ─▶ hospedagem.mjs ─▶ verificar-dist)
              ├─ confere que o commit ainda é a ponta da main
              ├─ npx wrangler@<versão> deploy --config apps/<site>/wrangler.json
              ├─ scripts/conferir-hospedagem.mjs     (espera o domínio, cabeçalhos, 404, bytes, http→https)
              └─ Lighthouse CI sobre o endereço real (celular e desktop)
```

A conferência do que está no ar (RF-08) é passo do workflow, não do portão: o `pnpm test` continua sem rede
(RNF-04). O que o portão confere são os **arquivos**: a configuração, o gerador, o workflow e o endereço único.

**Interface.** A 404 é a única tela nova. Ela não nasce por código: a Etapa 1 do `tasks.md` monta o mockup
(390 e 1280 px, português e inglês) para aprovação, e só depois a Etapa 2 escreve a página. A seção "Página
404" abaixo é o ponto de partida do mockup, não a decisão final.

## Componentes

| Arquivo                                                    | O que é                                                                                                                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/<site>/wrangler.json`                                | Projeto do site: rota do domínio, pasta `./dist`, `404-page`, `workers_dev` e `preview_urls` desligados.                                                             |
| `scripts/hospedagem.mjs`                                   | Funções puras que montam `_headers`, `robots.txt` e `sitemap.xml`, mais a execução que os escreve em `dist/`. Lê o `site` do `astro.config.mjs` e o modo da medição. |
| `scripts/csp.mjs`                                          | Ganha `medicaoValida(id)`, o formato do identificador numa definição só (hoje copiado em `verificar-dist.mjs`).                                                      |
| `scripts/verificar-dist.mjs`                               | Ganha a regra 8: `_headers`, `robots.txt`, `sitemap.xml` e as duas 404 coerentes com o modo do build.                                                                |
| `scripts/conferir-hospedagem.mjs`                          | Consulta o endereço real de um site e compara com o `dist` publicado. Lógica em funções puras; a rede entra por parâmetro.                                           |
| `packages/tema/src/componentes/NaoEncontrada.astro`        | Conteúdo da 404, compartilhado: título, texto e link de volta à página inicial do idioma.                                                                            |
| `packages/tema/src/layouts/Pagina.astro`                   | Ganha a propriedade `indexavel` (padrão `true`); com `false` emite `noindex` e omite `canonical`, `alternate` e `og:*`.                                              |
| `apps/<site>/src/pages/404.astro`, `en/404.astro`          | As duas 404 de cada site, com o logo do site.                                                                                                                        |
| `.github/workflows/deploy.yml`                             | Deploy depois do CI verde na `main`, um job por site, ambiente `producao`.                                                                                           |
| `.github/lighthouse/producao-<site>-{mobile,desktop}.json` | Os limites dos arquivos de origem, medindo as duas URLs reais do site em vez de `staticDistDir`.                                                                     |
| `.github/lighthouse/<site>-{mobile,desktop}.json`          | Passam a listar as duas páginas por `collect.url`, para não medir as 404 (ADR-8).                                                                                    |

## Modelo de dados

### `apps/<site>/wrangler.json`

```json
{
  "name": "webvigil",
  "compatibility_date": "<dia da implementação>",
  "workers_dev": false,
  "preview_urls": false,
  "routes": [{ "pattern": "webvigil.ryanmorais.com.br", "custom_domain": true }],
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash"
  },
  "observability": { "enabled": false }
}
```

O do MailVigil troca `name` e `pattern`. Sem `main` (assets-only) e sem `$schema`: o `wrangler` não é
dependência do projeto. JSON estrito, sem comentário; o porquê de cada chave está nos ADRs. Os caminhos do
arquivo são relativos a ele, então `./dist` é o `dist` do próprio app.

### `dist/_headers` (gerado)

```text
/*
  Content-Security-Policy: <politicaCsp({ medicao }).cabecalho>
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin

/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

`medicao` é verdadeiro quando `PUBLIC_GA_MEASUREMENT_ID` tem o formato válido, a mesma regra do layout. Limites
da plataforma: 100 regras e 2.000 caracteres por linha; a linha da CSP com medição tem cerca de 450.

### `dist/robots.txt` e `dist/sitemap.xml` (gerados)

```text
User-agent: *
Allow: /

Sitemap: https://webvigil.ryanmorais.com.br/sitemap.xml
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://webvigil.ryanmorais.com.br/</loc>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="https://webvigil.ryanmorais.com.br/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://webvigil.ryanmorais.com.br/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://webvigil.ryanmorais.com.br/en/"/>
  </url>
  <url>
    <loc>https://webvigil.ryanmorais.com.br/en/</loc>
    <!-- as mesmas três alternativas -->
  </url>
</urlset>
```

Sem `<lastmod>`: uma data à mão envelhece sozinha. As duas URLs e o trio de `hreflang` repetem o que
`Pagina.astro` já emite no `<head>`; o `verificar-dist` compara os dois.

## Página 404

**Decisão de projeto (2026-11-07), na Etapa 1 do mockup.** O mockup apresentou três alternativas para o bloco central, a
390 e a 1280 px, em português e inglês, nos dois produtos e nos dois esquemas de cor. Cada uma mudava só a
composição do bloco; cabeçalho, rodapé, botão, tokens e fontes eram os do site. Escolhida a **A**:

- **A (escolhida): "404" grande em fonte de código, na cor do produto, e o bloco centralizado.** O número é o
  único destaque; abaixo vêm o título, a frase e o botão. Motivo: mensagem curta e isolada vai ao centro (regra
  de alinhamento de mensagem isolada), o número diz de relance o que aconteceu e funciona igual nos dois idiomas.
- **B (descartada): terminal com `curl -I` e `HTTP/2 404 Not Found` no lugar do número.** Combina com as
  ferramentas de linha de comando, mas o terminal fica em inglês também na página em português, ocupa mais altura
  no celular e disputa o olhar com o botão.
- **C (descartada): texto à esquerda, com o rótulo "Erro 404".** Parece mais uma página do site, mas no desktop
  o bloco fica colado à esquerda de uma tela vazia.

Rascunho final da alternativa A:

|                                    | Português                                                                       | Inglês                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Número (decorativo, `aria-hidden`) | 404                                                                             | 404                                                                         |
| Título (`h1`)                      | Página não encontrada                                                           | Page not found                                                              |
| Frase                              | Este endereço não existe ou mudou de lugar. Volte à página inicial do WebVigil. | This address doesn't exist or has moved. Go back to the WebVigil home page. |
| Botão                              | Voltar à página inicial                                                         | Back to home page                                                           |

Na frase, o nome do produto (WebVigil ou MailVigil) vem do site. O número usa `--font-code` e `--acc`; o título
e a frase seguem a escala tipográfica do tema (`h1` com o tamanho do topo, frase em `--fs-abertura`). O botão é o
`Botao` primário do tema: largura total no celular e, no desktop, o tamanho do rótulo com largura mínima de
240 px, centralizado na coluna.

Composição, valendo para a implementação:

- **Composição.** `Pagina` com `indexavel={false}`, o `Cabecalho` sem itens de menu (só logo, nome e seletor
  de idioma), um bloco central com o número, o título, uma frase e o botão de volta à página inicial do idioma, e
  o `Rodape` que as páginas já usam. Nenhum componente novo além do bloco central (`NaoEncontrada.astro`).
- **Idioma.** `404.astro` em português e `en/404.astro` em inglês, porque a hospedagem serve a 404 mais
  próxima do caminho pedido: `/en/nada` cai em `en/404.html`, o resto em `404.html`. O seletor de idioma da 404
  leva às páginas iniciais (`/` e `/en/`), já que a 404 não tem "mesma página no outro idioma".
- **Textos.** Ficam em `packages/tema/src/textos.ts`, ao lado dos outros rótulos que o próprio tema emite, com
  o teste de paridade de idiomas valendo.
- **Marcação.** `<meta name="robots" content="noindex">`; sem `canonical`, `alternate` e `og:*`. Banner de
  consentimento e script de medição seguem como em toda página (a 404 é parte do site).
- **Caminhos.** Os recursos do HTML são absolutos (`/_astro/…`), então a 404 funciona em qualquer profundidade.

## Interfaces

### Gerador (`scripts/hospedagem.mjs`)

```js
/** Texto do `_headers` para o modo de medição do build. */
export const montarCabecalhos = ({ medicao }) => {};

/** Texto do `robots.txt` com o endereço absoluto do sitemap. */
export const montarRobots = (site) => {};

/** Texto do `sitemap.xml` com as duas páginas e o trio de `hreflang`. */
export const montarSitemap = (site) => {};

/** Escreve os três arquivos em `pasta`; `site` e `medicao` vêm do `astro.config.mjs` e do ambiente. */
export const gerarHospedagem = async ({ pasta, site, medicao }) => {};
```

Roda no `build` de cada app: `astro build && node ../../scripts/hospedagem.mjs dist && node ../../scripts/verificar-dist.mjs dist`.
O `site` sai do `import()` do `astro.config.mjs` da pasta atual; o modo, de `medicaoValida` aplicada a
`process.env.PUBLIC_GA_MEASUREMENT_ID` (o mesmo valor que o Astro leu, já que o `envDir` aponta para a raiz).

### Regra 8 do `verificar-dist`

Falha se, na pasta do build: faltar `_headers`, `robots.txt` ou `sitemap.xml`; a linha de CSP do `_headers`
diferir de `politicaCsp` do modo detectado no HTML; o `sitemap.xml` tiver URL fora das duas páginas ou
divergir dos `canonical` e `hreflang` delas; faltar `404.html` ou `en/404.html`; ou uma 404 tiver `canonical`,
`alternate` ou faltar `noindex`.

### Conferência (`scripts/conferir-hospedagem.mjs`)

```js
/** @typedef {{ nome: string, ok: boolean, detalhe: string }} Verificacao */

/** Lê o `_headers` e devolve os cabeçalhos de uma regra (`/*` ou `/_astro/*`). */
export const lerCabecalhosEsperados = (textoHeaders, regra) => {};

/** Compara os cabeçalhos esperados com os de uma resposta; devolve o que faltou ou diferiu. */
export const compararCabecalhos = (esperados, recebidos) => {};

/** Roda as verificações de RF-08 contra `endereco`; `buscar` e `esperar` são injetados nos testes. */
export const conferirHospedagem = async ({ endereco, pasta, buscar = fetch, esperar }) => {};
```

Uso: `node scripts/conferir-hospedagem.mjs <site>` (e `pnpm hospedagem:conferir <site>` à mão). O endereço vem
da rota do `wrangler.json` do app e os bytes esperados, do `dist` recém-construído e publicado. Sai com código 1
se algo falhar e escreve a tabela em `$GITHUB_STEP_SUMMARY`. Primeiro **espera** o domínio responder
(até 5 minutos, a cada 15 s), porque o certificado e o DNS do domínio personalizado podem demorar no primeiro
deploy. Depois, na ordem:

1. `GET /`: status 200; corpo idêntico ao `dist/index.html` (SHA-256); cabeçalhos de `/*` presentes e iguais.
2. `GET /en/`: o mesmo, contra `dist/en/index.html`.
3. `GET /conferencia-caminho-inexistente/a/b`: status **404**; corpo idêntico ao `dist/404.html`; cabeçalhos de `/*`.
4. `GET /en/conferencia-caminho-inexistente`: status 404; corpo idêntico ao `dist/en/404.html`.
5. Um `.js`, um `.css` e uma fonte de `/_astro/`: 200; corpo idêntico; `Cache-Control` igual ao de `/_astro/*`.
6. `GET /favicon.svg`: 200; `Cache-Control` que obriga a revalidar (não `immutable`).
7. `GET /robots.txt` e `GET /sitemap.xml`: 200 e corpo idêntico (o `robots.txt` pode vir com o bloco gerenciado
   da Cloudflare na frente, que termina em `# END Cloudflare Managed Content`; o resto tem de ser idêntico).
8. `GET /_headers`: **não** devolve o arquivo.
9. `http://` no mesmo host: redireciona para `https://` (301, 302, 307 ou 308) ou a conexão é recusada, nunca
   200; e só vale como "recusada" se o `https://` abre.

### Deploy (`deploy.yml`, resumo)

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
  workflow_dispatch:

jobs:
  publicar:
    strategy:
      fail-fast: false
      matrix:
        site: [webvigil, mailvigil]
    if: >-
      (github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main') ||
      (github.event_name == 'workflow_run' &&
      github.event.workflow_run.conclusion == 'success' &&
      github.event.workflow_run.event == 'push' &&
      github.event.workflow_run.head_repository.full_name == github.repository)
    environment: producao
    permissions: { contents: read }
    # checkout em github.event.workflow_run.head_sha; segue só se ainda for a ponta da main
```

## Decisões (ADRs)

### ADR-1 — Workers Static Assets, um projeto por site, sem código de servidor

**Decisão.** Cada site é um Worker só de assets (`wrangler.json` sem `main`, `assets.directory` em `./dist`),
dentro do próprio app. Nada de função nem roteamento por código.
**Alternativas.** Cloudflare Pages (a documentação da Cloudflare diz para começar projetos novos em Workers);
outra hospedagem estática (a zona já está na Cloudflare, e o custo é zero nos dois); um Worker só com os dois
sites (acopla os deploys e o domínio de cada site).
**Porquê.** Requisição a asset é gratuita e ilimitada; `_headers` vale; a 404 é explícita (`404-page` serve a
`404.html` mais próxima com status 404); o domínio é uma linha de configuração. Decidido em 2026-11-07.
**Trade-off.** A plataforma é da Cloudflare e a documentação dela muda; por isso o `wrangler` tem versão
fixa (ADR-4) e a conferência do que está no ar (ADR-5) falha alto se algo mudar. A documentação não afirma que
`_headers` cobre a resposta da 404 nem como o `Cache-Control` se combina com o padrão: a conferência testa os
dois, e os riscos estão registrados.

### ADR-2 — O endereço tem uma fonte: o `site` do `astro.config.mjs`

**Decisão.** O `site` de cada `astro.config.mjs` é o endereço público. O `canonical` e o `hreflang` já saem
dele; o gerador o usa no `robots.txt` e no sitemap; um teste compara a rota do `wrangler.json`, o `deploy.yml`
e os limites do Lighthouse de produção com ele.
**Alternativas.** A rota do `wrangler.json` como fonte (o Astro não a lê, e o `canonical` passaria a depender
de um arquivo que ele não conhece); repetir o texto em cada arquivo sem teste (diverge em silêncio).
**Porquê.** O `site` já alimenta toda URL absoluta das páginas; os outros arquivos só precisam concordar. O
teste faz esse papel.
**Trade-off.** O `wrangler.json` e o workflow repetem o texto do domínio, e o teste é quem os liga ao `site`.

### ADR-3 — Cabeçalhos gerados no build, com a CSP de `politicaCsp`

**Decisão.** O `_headers` é gerado a cada build por `montarCabecalhos({ medicao })`, e a linha de CSP é
`politicaCsp({ medicao }).cabecalho`. Vale para `/*`, inclusive a 404. HSTS só com `max-age=31536000`, sem
`includeSubDomains` nem `preload` (decisão do mantenedor, 2026-11-07). `Referrer-Policy: no-referrer`,
`Permissions-Policy` desligando os recursos de hardware que as páginas não usam, e
`Cross-Origin-Opener-Policy` e `Cross-Origin-Resource-Policy` em `same-origin`.
**Alternativas.** `_headers` escrito à mão em `public/` (teria de existir em duas versões, com e sem medição, e
duplicaria a CSP: o que a spec 003 proibiu); cabeçalhos por um Worker (código de servidor, contra o ADR-1);
`includeSubDomains` e `preload` no HSTS (afetariam o resto de `ryanmorais.com.br`, e `preload` é quase
irreversível).
**Porquê.** A CSP depende do modo de medição, que só se sabe no build. Gerar o arquivo ali mantém uma fonte só
(RNF-06), e o `verificar-dist` fecha o ciclo conferindo o arquivo contra a política.
**Trade-off.** O arquivo de cabeçalhos deixa de ser algo que se lê direto no repositório; quem quiser vê-lo
constrói o site. O teste de `montarCabecalhos` e a seção "Modelo de dados" mostram o resultado. Uma
`Permissions-Policy` enumerada envelhece quando o navegador cria recursos novos; a revisão é a do Lighthouse
(boas práticas).

### ADR-4 — Deploy por workflow do GitHub Actions, depois do CI verde, com `wrangler` por `npx`

**Decisão.** `deploy.yml` roda em `workflow_run` do `CI` na `main`, só quando o run terminou com sucesso, veio
de `push` e do próprio repositório, e em `workflow_dispatch` na `main`. O job usa o ambiente `producao`
(segredos `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`, variável `PUBLIC_GA_MEASUREMENT_ID`, branch de deploy
restrita à `main`), faz checkout do `head_sha` e só segue se esse commit ainda for a ponta da `main`. Um job por
site, em matriz com `fail-fast: false`: a falha de um não impede o outro. A ferramenta entra por
`npx --yes wrangler@${{ env.WRANGLER_VERSION }} deploy --config apps/<site>/wrangler.json`, com a versão
numa variável do workflow: a estável mais nova com mais de 7 dias (o `minimumReleaseAge` do projeto), conferida
no dia da implementação. Concorrência no grupo `deploy`, sem cancelar o que está rodando. O token é **novo,
só para este repositório** (decisão do mantenedor, 2026-11-07).
**Alternativas.** Workers Builds, a integração Git da Cloudflare (sem token no GitHub, mas o build e a
conferência ficam fora do nosso CI e o modo de medição vira configuração de painel); `cloudflare/wrangler-action`
(mais uma ação de terceiros no caminho do segredo, sem ganho sobre `npx`); `push` com um job `needs` repetindo o
portão (duplica o CI); `wrangler` como devDependency (a árvore dele derrubaria o `pnpm audit` obrigatório,
como a do `@lhci/cli`); um job só para os dois sites (uma falha esconderia o outro deploy).
**Porquê.** `workflow_run` encadeia no CI sem repeti-lo: se `qualidade` ou `seguranca` falham, o deploy não
roda. O filtro `push` no repositório próprio impede que PR ou fork dispare deploy ou toque o segredo. O teste da
ponta da `main` evita que dois merges seguidos publiquem o mais velho por último.
**Trade-off.** O Dependabot não vê `npx`: a revisão da versão do `wrangler` é manual, como a do `LHCI_VERSION`.
`workflow_run` roda o arquivo da `main`, então mexer no workflow só vale depois do merge. Cada job reinstala as
dependências e refaz o build do próprio site: segundos a mais, em troca de isolamento.

### ADR-5 — Conferir o que está no ar, no mesmo run, esperando o domínio

**Decisão.** Depois do deploy, `conferir-hospedagem.mjs` e o Lighthouse sobre o endereço real rodam no mesmo
job. Falha deixa o run vermelho e o resumo mostra a tabela; o deploy não é desfeito sozinho (RF-08). A
conferência espera o domínio responder antes de julgar.
**Alternativas.** Reverter sozinho em caso de falha (esconderia o motivo e pode ser rede); só conferir à mão (o
que está no ar passaria a depender de lembrar).
**Porquê.** É o que prova RF-01 a RF-04 e RF-06 no mundo real: o `_headers` pode estar certo no arquivo e a
plataforma não aplicá-lo na 404; o HTML pode estar certo no repositório e a zona injetar um script. A espera
vem do primeiro deploy de um site irmão, que falhou só porque o domínio personalizado e o certificado ainda não
estavam de pé quando a conferência rodou.
**Trade-off.** O visitante já vê o deploy ruim enquanto o run avisa. Aceito para dois sites de uma página; o
caminho de volta é o do ADR-9.

### ADR-6 — Nada injetado: comparar os bytes e desligar o que mexe na zona

**Decisão.** A conferência compara o hash do HTML, do JavaScript, do CSS, da fonte, do `robots.txt` e do
`sitemap.xml` servidos com o do `dist` publicado. O guia de operação do mantenedor manda conferir, para os
dois subdomínios, a Web Analytics da Cloudflare, o Rocket Loader, a ofuscação de e-mail e qualquer otimização
que reescreva HTML ou JavaScript, sem alterar o que vale para o resto da zona.
**Alternativas.** Confiar que o plano gratuito não injeta nada (a Web Analytics pode ser ligada pelo painel sem
commit); olhar o HTML no navegador (a injeção às vezes depende do agente).
**Porquê.** "Sem rastreador além do GA4 consentido" é regra do projeto, e a CSP bloquearia um `<script>`
injetado mas quebraria a página em silêncio. A comparação troca promessa por fato, a cada deploy.
**Trade-off.** A conferência vê o que o runner do GitHub recebe, que pode diferir do que um navegador recebe. Por
isso o guia também manda abrir cada página uma vez no navegador e olhar a rede, e o Lighthouse (que usa um
navegador de verdade) acusa violação de CSP no console.

### ADR-7 — Descoberta gerada no build, sem dependência nova

**Decisão.** `robots.txt` e `sitemap.xml` saem do gerador (ADR-3), a partir do `site`. O sitemap lista as duas
versões de idioma, cada uma com o trio de `hreflang`. A 404 não entra e leva `noindex`.
**Alternativas.** `@astrojs/sitemap` (dependência nova e árvore a auditar para gerar duas URLs; as
alternativas por idioma exigem configuração própria); arquivos escritos à mão em `public/` de cada app (o
endereço seria repetido em seis lugares).
**Porquê.** Duas páginas por site não justificam uma dependência. O `verificar-dist` compara o sitemap com o
que as páginas declaram, então os dois não divergem.
**Trade-off.** Mais um site ou uma página nova no futuro obriga a mexer na lista do gerador; o teste do
`verificar-dist` falha se o sitemap e as páginas divergirem, então o esquecimento aparece no build.

### ADR-8 — O Lighthouse de origem passa a medir só as páginas indexáveis

**Decisão.** Os quatro `<site>-{mobile,desktop}.json` ganham `collect.url` com `/index.html` e
`/en/index.html`. As 404 ficam de fora da medição por pasta.
**Alternativas.** Deixar a medição pela pasta inteira (as 404 têm `noindex`, e a auditoria `is-crawlable` do
SEO derrubaria a nota); desligar `is-crawlable` (perde a garantia nas páginas reais).
**Porquê.** A pasta do build ganha duas páginas que, por desenho, não devem ser indexadas.
**Trade-off.** As 404 deixam de passar pelo Lighthouse; a acessibilidade delas é conferida com o axe na
Etapa 2. A auditoria `robots-txt` continua ignorada nos limites de produção: a CSP sem `connect-src 'self'`
impede o Lighthouse de baixar o arquivo, e quem o confere é a conferência do ADR-5.

### ADR-9 — Caminho de volta documentado e testado

**Decisão.** Há dois caminhos de volta, descritos no guia de operação do mantenedor: **(1)** reverter o commit
por PR e deixar o deploy automático republicar; **(2)** emergência, `wrangler rollback` (ou o botão de rollback
do painel) para a versão anterior de um site. Um rollback real é feito e desfeito uma vez, antes de divulgar
os endereços.
**Alternativas.** Reverter sozinho (ADR-5); nenhum caminho documentado.
**Porquê.** Um site ruim no ar precisa de uma saída conhecida, e a saída só é confiável se já foi usada.
**Trade-off.** O rollback pelo painel deixa o `main` e o que está no ar diferentes até alguém reverter o commit;
o guia manda fazer o PR de reversão logo depois.

## Impacto

- **Páginas:** as duas 404 por site (quatro páginas novas); nada muda nas páginas existentes além de o layout
  aceitar `indexavel`.
- **Arquivos novos:** `wrangler.json` (2), `scripts/hospedagem.mjs`, `scripts/conferir-hospedagem.mjs`,
  `deploy.yml`, quatro limites de produção do Lighthouse.
- **`package.json` dos apps:** o `build` ganha o passo do gerador. `package.json` da raiz: script
  `hospedagem:conferir`. Nenhuma dependência nova.
- **`scripts/verificar-dist.mjs` e `scripts/csp.mjs`:** regra 8 e `medicaoValida`.
- **`.github/lighthouse/<site>-*.json`:** `collect.url`.
- **`CLAUDE.md`:** a árvore ganha os arquivos novos; a linha de estado e a seção de qualidade passam a citar o
  deploy e a conferência.
- **`docs/stack.md`:** Workers Static Assets, `wrangler`, `_headers`, HSTS e o ambiente `producao`.
- **READMEs (pt e en):** o endereço de cada site, sem data de lançamento.
- **`specs/README.md`:** linha da 006 e a nota de manutenção sobre o `_headers` gerado.
- **Specs 001 a 005:** nenhuma mudança de comportamento.

## Riscos

- **O `_headers` pode não cobrir a resposta da 404.** A documentação não afirma. Mitigação: a conferência
  checa os cabeçalhos nas duas 404; se faltarem, o plano B é uma regra explícita para o caminho ou aceitar a
  falta, registrando o desvio.
- **O `Cache-Control` do `_headers` pode se juntar ao padrão** em vez de substituí-lo em `/_astro/*`.
  Mitigação: a conferência compara o valor exato; se juntar, o ADR-3 muda.
- **O Astro pode não emitir `en/404.html`.** Para `404.astro` ele emite `404.html`; para `en/404.astro` o
  arquivo pode sair como `en/404/index.html`, que a hospedagem não escolhe como "404 mais próxima". Mitigação:
  a Etapa 2 confere o arquivo gerado e, se for o caso, o gerador copia a página para `en/404.html`; a regra 8
  do `verificar-dist` falha se faltar. **Conferido na Etapa 2 (2026-11-07): o Astro 7 emite `en/404/index.html`**
  (e `404.html` na raiz), então o desvio vale: o gerador da Etapa 3 copia `en/404/index.html` para
  `en/404.html`, e a regra 8 exige o arquivo copiado.
- **Token com permissão curta para criar o domínio.** Mitigação: o primeiro deploy é acompanhado; o guia diz
  como ampliar o escopo o mínimo necessário.
- **Zona com recursos automáticos ligados** (Rocket Loader, ofuscação de e-mail, Web Analytics). Mitigação: ADR-6.
  Já se sabe que o `robots.txt` da zona recebe na frente um bloco gerenciado da Cloudflare; a conferência o aceita.
- **Identificador de medição vazio ou de teste no deploy.** O site sairia sem banner, ou com um identificador
  que não coleta nada. Mitigação: o primeiro passo do job falha se a variável não tiver o formato válido ou for
  `G-TESTE12345`.
- **Dois merges seguidos.** O mais velho não pode publicar por último. Mitigação: o passo da ponta da `main`.
- **`workflow_run` e segredo.** Mitigação: o filtro `push` e `head_repository`, o ambiente restrito à `main` e
  um teste que falha se o deploy aceitar `pull_request`.
- **Deploy sem o ambiente pronto.** Se o PR do workflow for mesclado antes de o token, o ambiente e a variável
  existirem, o primeiro run falha. Mitigação: a Etapa 5 do `tasks.md` (preparação do mantenedor) vem antes do
  merge do PR do workflow.
- **`wrangler` e a documentação mudam.** Mitigação: versão fixa, revisão manual mensal, conferência a cada deploy.
- **HSTS publicado é difícil de desfazer.** Mitigação: um ano, sem `includeSubDomains` nem `preload`.

## Testes

- `scripts/hospedagem.test.mjs`: `montarCabecalhos` nos dois modos (CSP igual à de `politicaCsp`, sem
  `unsafe-inline`, `unsafe-eval` nem `*`; HSTS sem `includeSubDomains` e sem `preload`; `Cache-Control` longo só em
  `/_astro/*`; nenhuma linha acima de 2.000 caracteres; no máximo 100 regras); `montarRobots`; `montarSitemap`
  (duas URLs, trio de `hreflang` em cada, endereço absoluto); `gerarHospedagem` em pasta temporária.
- `scripts/verificar-dist.test.mjs`: a regra 8, uma variação por falha (sem `_headers`, CSP de outro modo, sitemap
  com URL a mais, 404 com `canonical`, 404 sem `noindex`, sem `en/404.html`).
- `scripts/csp.test.mjs`: `medicaoValida` aceita e recusa o que `validarIdMedicao` do tema aceita e recusa.
- `test/hospedagem.test.ts`: cada `wrangler.json` sem `main`, com `./dist`, `404-page`, `workers_dev` e
  `preview_urls` falsos, rota `custom_domain` igual ao `site` do `astro.config.mjs`, `observability` desligada;
  `package.json` sem `wrangler` entre as dependências.
- `test/workflow-deploy.test.ts`: toda `uses:` por SHA; `runs-on: ubuntu-26.04`; gatilhos só `workflow_run` do
  `CI` na `main` e `workflow_dispatch` (nenhum `pull_request`); condição de sucesso, `push` e repositório;
  ambiente `producao`; `permissions` só `contents: read`; o segredo só no job de deploy; `WRANGLER_VERSION`
  fixa; `LHCI_VERSION` igual à do `lighthouse.yml`; concorrência sem cancelamento; o domínio do workflow igual
  ao `site`.
- `test/lighthouse-producao.test.ts`: `collect.url` igual às duas URLs do `site`; as asserções iguais às dos
  limites de origem; os de origem listam só as duas páginas indexáveis.
- `scripts/conferir-hospedagem.test.mjs`: `lerCabecalhosEsperados` e `compararCabecalhos` com `_headers`
  sintético; `conferirHospedagem` com `buscar` falso que responde bem e uma variação por falha (HTML com
  `<script>` injetado, 404 com status 200, cabeçalho ausente na 404, `http://` servido em 200, `/_headers`
  público, `Cache-Control` de `/_astro/*` diferente, `robots.txt` alterado, domínio que demora a responder).
- `packages/tema`: paridade dos textos da 404 e `Pagina` com `indexavel={false}` (sem `canonical`, com `noindex`).
- Conferência real: passo do `deploy.yml` (RF-08), fora do `pnpm test`.
- O CI roda o portão completo em todo PR.
