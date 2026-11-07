---
feature: Hospedagem — os dois sites no ar, cada um no seu subdomínio, com cabeçalhos de segurança, 404 e descoberta
status: rascunho
date: 2026-11-07
related: [001-fundacao, 002-tema, 003-medicao, 004-pagina-webvigil, 005-pagina-mailvigil]
origin: conception
---

# 006 — Hospedagem

## Contexto e problema

As specs 004 e 005 fecharam as páginas do WebVigil e do MailVigil, e a 003 deixou a medição e a CSP prontas.
Falta pô-las no ar. Cada site vira uma pasta estática (`apps/<site>/dist`) e deve responder no próprio
subdomínio: `webvigil.ryanmorais.com.br` e `mailvigil.ryanmorais.com.br`. A zona `ryanmorais.com.br` já está
na Cloudflare, e o site principal e o DMARC Fácil já são servidos de lá.

O que as specs anteriores deixaram para esta:

- **A CSP vai como cabeçalho.** `scripts/csp.mjs` é a fonte única da política e hoje só o `verificar-dist`
  a usa. `frame-ancestors` só vale em cabeçalho, e a política muda com a medição (sem medição, nenhum domínio
  externo; com medição, só os hosts do Google Analytics).
- **A medição só liga com um identificador** (`PUBLIC_GA_MEASUREMENT_ID`). O deploy precisa construir os
  sites com o identificador real, e o CI continua construindo com o de teste.
- **Faltam a 404, o `robots.txt` e o `sitemap.xml`.** As páginas já têm `canonical` e `hreflang`; o Lighthouse
  hoje ignora a auditoria `robots-txt` porque o build não tem o arquivo.
- **Há coisas que só se verificam no ar:** `Secure` do cookie em HTTPS, a escolha lida entre os três sites,
  a CSP como cabeçalho, `page_view` no GA4.

O DMARC Fácil (repositório `dmarc-facil`, spec 007) resolveu o mesmo problema para uma pasta sem build:
Workers Static Assets da Cloudflare, `wrangler` por `npx`, workflow de deploy depois do CI, ambiente
`producao` com o token. Esta spec parte desse modelo e acrescenta o que muda aqui: **dois sites num
repositório, um build antes do deploy e uma CSP que depende do modo de medição.**

Regras do projeto que pesam aqui:

- **Nenhum script inline** (spec 001, RNF-02): a hospedagem não pode injetar script nem reescrever o HTML.
  A Web Analytics da Cloudflare injeta um _beacon_ e quebraria a CSP.
- **Publicar é ato do mantenedor.** A configuração e o workflow ficam no repositório. Criar o token, o
  ambiente `producao`, conectar os domínios e disparar o primeiro deploy são do mantenedor, e o passo a passo fica
  fora do repositório.
- **A ferramenta de deploy não é dependência do `package.json`**: a árvore do `wrangler` derrubaria o
  `pnpm audit` obrigatório (o mesmo caso do `@lhci/cli`).

## Objetivos

- **Os dois sites no ar**, cada um no seu subdomínio, em HTTPS, servindo o build do commit da `main`.
- **Cabeçalhos de segurança do servidor**, com a CSP vinda de `scripts/csp.mjs` no modo do build.
- **404 com status 404**, na língua do caminho, com o logo e o link de volta funcionando.
- **Um endereço só por site:** `*.workers.dev` e pré-visualização pública desligados.
- **Cache coerente:** o HTML revalida; os arquivos com _hash_ no nome (`_astro/`, fontes) ficam em cache longo.
- **Deploy repetível e auditável:** o que está no ar é o commit da `main`, sem passo manual escondido.
- **Descoberta:** `robots.txt` e `sitemap.xml` por site, coerentes com os `canonical` e `hreflang` que já existem.
- **Conferência do que está no ar:** cabeçalhos, 404, HTML sem reescrita e Lighthouse contra o endereço real.

## Não-objetivos

- **Função, API ou código de servidor** (`main` no `wrangler`): os sites são só arquivo.
- **Mudar o conteúdo das páginas** além do que a hospedagem e a descoberta exigem (a 404, `robots.txt`,
  `sitemap.xml`, `_headers`).
- **Estatística própria**, Web Analytics da Cloudflare ou qualquer rastreador além do GA4 já decidido.
- **Mudar a zona inteira:** nada que afete o site principal ou outros subdomínios.
- **Pré-visualização por PR** com endereço público.
- **A política de privacidade e o cookie de escolha:** já resolvidos na spec 003 e no site principal.
- **Redirecionamento por idioma do navegador:** continua sem existir (spec 001).

## Personas

- Como **visitante**, quero abrir o endereço do site, ver a página carregar rápido e, se errar o caminho,
  cair numa 404 do próprio site, no meu idioma.
- Como **mantenedor**, quero que o merge na `main` publique os dois sites sozinho, que eu consiga desfazer um
  deploy ruim em minutos e que um segredo vazado tenha o menor alcance possível.
- Como **dev que lê o repositório**, quero ver em um lugar só quais cabeçalhos cada site manda e por quê.

## Requisitos funcionais

### RF-01 — Cada site no seu endereço

- **Given** o deploy feito
  **When** o visitante abre `https://webvigil.ryanmorais.com.br/` ou `https://mailvigil.ryanmorais.com.br/`
  **Then** recebe a página inicial em português do site correspondente, com HTTPS válido e status 200, e a
  versão `/en/` responde no mesmo domínio.
- **Given** uma requisição `http://`
  **When** chega a um dos domínios
  **Then** é redirecionada para `https://` ou recusada, nunca servida em texto claro.
- **Given** o endereço `*.workers.dev` de um dos projetos
  **When** alguém o abre
  **Then** não serve o site: o subdomínio é o único endereço.
- **Given** a configuração de cada projeto
  **When** é lida
  **Then** aponta para o `dist` do próprio app e não envia nada fora dele (`node_modules`, `specs/`, `.git`,
  o `dist` do outro site).

### RF-02 — Cabeçalhos de segurança

- **Given** qualquer resposta de um site
  **When** o cabeçalho é examinado
  **Then** traz `X-Content-Type-Options: nosniff`, `Referrer-Policy` restritiva (decidida no design) e
  `Permissions-Policy` desligando os recursos que as páginas não usam.
- **Given** as páginas HTML
  **When** o cabeçalho é examinado
  **Then** traz `Content-Security-Policy` igual ao que `politicaCsp` devolve para o modo do build
  (`frame-ancestors 'none'` incluído), sem `unsafe-inline`, `unsafe-eval` nem `*`.
- **Given** um build sem medição
  **When** a CSP do cabeçalho é lida
  **Then** não lista nenhum domínio externo; com medição, lista só os hosts do Google Analytics.
- **Given** o domínio com HTTPS
  **When** a resposta chega
  **Then** traz `Strict-Transport-Security` com o prazo e a decisão sobre `includeSubDomains` e `preload`
  registrados no design.
- **Given** o arquivo de cabeçalhos
  **When** a hospedagem o aplica
  **Then** valem para o HTML, para `_astro/`, para as fontes, para as imagens e para a 404.

### RF-03 — Página 404

- **Given** um endereço que não existe (`/nada`, `/en/nada`, `/a/b/c.js`)
  **When** é aberto
  **Then** a resposta tem **status 404** e o corpo é a 404 do site, com CSS, logo e link de volta
  funcionando, no idioma do caminho (`/en/…` em inglês, o resto em português).
- **Given** um arquivo que existe
  **When** é aberto
  **Then** não vira 404 nem redireciona para a página inicial (nada de _fallback_ de SPA).
- **Given** a 404
  **When** o HTML é examinado
  **Then** tem `noindex`, não tem `canonical` nem `hreflang` e não entra no sitemap.
- **Given** um erro 5xx da plataforma
  **When** acontece
  **Then** a página de erro é a da plataforma, sem personalização.

### RF-04 — Cache

- **Given** o HTML e os arquivos cujo nome não muda entre versões (`favicon.svg`, `apple-touch-icon.png`,
  imagens sociais, `robots.txt`, `sitemap.xml`)
  **When** o cabeçalho de cache é definido
  **Then** o navegador revalida antes de reusar, e um deploy novo chega a todos sem misturar versões.
- **Given** os arquivos com _hash_ no nome (`_astro/`, fontes)
  **When** o cabeçalho de cache é definido
  **Then** podem ser guardados por longo prazo e `immutable`.
- **Given** o desempenho medido
  **When** o Lighthouse roda contra o endereço real
  **Then** valem os mesmos limites de `.github/lighthouse/`.

### RF-05 — Deploy

- **Given** um merge na `main`
  **When** o CI termina verde
  **Then** o deploy constrói os dois sites **com o identificador de medição real** e publica cada um no seu
  projeto, e o log registra o commit publicado.
- **Given** um PR aberto ou a branch de um fork
  **When** o CI roda
  **Then** nenhum deploy de produção acontece e o segredo nunca é entregue ao código do PR.
- **Given** o token da Cloudflare
  **When** é criado
  **Then** tem o menor escopo possível, vive só como segredo do ambiente `producao` do GitHub, restrito à
  `main`, e nunca aparece em log, no repositório ou em `.claude/`.
- **Given** um deploy ruim
  **When** o mantenedor precisa desfazer
  **Then** existe um caminho documentado para voltar à versão anterior em minutos (reverter o commit na
  `main`), testado uma vez antes de divulgar o endereço.
- **Given** o workflow de deploy
  **When** é lido
  **Then** toda `uses:` está fixada por SHA, o job roda em `ubuntu-26.04` e o `wrangler` entra por `npx`, não
  como dependência.
- **Given** o identificador de medição
  **When** é guardado
  **Then** fica como variável do ambiente `producao` (é público por natureza), nunca no código.

### RF-06 — Sem reescrita pela hospedagem

- **Given** um site no ar
  **When** o HTML servido é comparado ao de `apps/<site>/dist`
  **Then** é idêntico byte a byte: a hospedagem não injetou script nem reescreveu nada (nenhuma minificação
  ou "otimização" automática da Cloudflare).
- **Given** a configuração da conta e da zona
  **When** o mantenedor segue o passo a passo
  **Then** a Web Analytics e as otimizações que mexem no conteúdo estão desligadas para os dois subdomínios,
  sem alterar o que vale para o resto da zona.

### RF-07 — Descoberta

- **Given** a requisição a `/robots.txt` de um site
  **When** responde
  **Then** devolve 200 com `User-agent: *`, `Allow: /` e a linha `Sitemap:` com o endereço absoluto do sitemap.
- **Given** a requisição a `/sitemap.xml` de um site
  **When** responde
  **Then** devolve um sitemap válido com as duas versões de idioma da página inicial, cada uma com os
  `xhtml:link` de alternativas, nos mesmos endereços dos `canonical` e `hreflang` da página.
- **Given** o endereço público de cada site
  **When** aparece em `astro.config.mjs`, no `wrangler`, no `robots.txt`, no sitemap, no workflow e nos
  limites do Lighthouse de produção
  **Then** é o mesmo em todos, com uma fonte só e um teste que compara os demais com ela.

### RF-08 — Conferência do que está no ar

- **Given** os sites recém-publicados
  **When** o passo de conferência roda
  **Then** busca, em cada site, `/`, `/en/`, um caminho inexistente e um arquivo de `_astro/`, e falha se
  faltar um cabeçalho de RF-02, se a 404 não tiver status 404 ou se o HTML diferir do build.
- **Given** o Lighthouse CI
  **When** o deploy termina
  **Then** mede também o endereço real de cada site (celular e desktop), com os limites do repositório.
- **Given** a falha dessa conferência
  **When** acontece depois do deploy
  **Then** o run fica vermelho e avisa o mantenedor; o deploy já feito não é desfeito sozinho.

### RF-09 — Documentação

- **Given** o `README.md`, o `README.en.md`, o `CLAUDE.md`, o `docs/stack.md` e o `specs/README.md`
  **When** a spec é concluída
  **Then** dizem onde cada site está e qual tecnologia o serve, sem prometer data de lançamento.
- **Given** o primeiro deploy
  **When** o mantenedor precisa fazê-lo
  **Then** o guia de operação dele, mantido fora do repositório, traz o passo a passo em ordem (token,
  ambiente `producao`, variável de medição, domínios, desligar `workers.dev` e Web Analytics, deploy,
  conferência), cada passo dizendo quem faz e o que conferir.

## Requisitos não-funcionais

### RNF-01 — Privacidade

A hospedagem guarda, no máximo, a estatística agregada e o log de requisição de arquivo estático da própria
Cloudflare. Além do GA4 com consentimento (spec 003), nenhum rastreador é adicionado.

### RNF-02 — Custo zero

Plano gratuito da Cloudflare e do GitHub. Se a plataforma exigir cartão ou tiver limite que os sites possam
atingir, exige decisão do mantenedor antes de seguir.

### RNF-03 — Configuração como arquivo

Tudo que dá para versionar (projetos, pasta de assets, 404, cabeçalhos, workflow) mora no repositório. O
que só existe no painel (domínios, token, Web Analytics) é listado no guia de operação, com como conferir.

### RNF-04 — Testes sem rede

O `pnpm test` não acessa a rede nem a Cloudflare: confere os arquivos de configuração, a geração dos
cabeçalhos, o sitemap e o workflow. A conferência do que está no ar (RF-08) é passo do deploy, não do portão.

### RNF-05 — Reversibilidade

Apagar os projetos de hospedagem e os registros DNS dos dois subdomínios devolve a zona ao que era antes.

### RNF-06 — Uma fonte para a CSP

O cabeçalho publicado, a conferência do `verificar-dist` e o teste de CSP leem a mesma definição
(`scripts/csp.mjs`); nenhuma cópia manual da política.

## Perguntas em aberto

1. **Medição no primeiro deploy.** O primeiro deploy já sai com `PUBLIC_GA_MEASUREMENT_ID` real (banner
   ligado, `page_view` verificável logo) ou sai sem medição e liga depois? Recomendação: já com medição,
   porque a política e o cookie de domínio estão prontos e a verificação do que só se vê no ar depende dela.
2. **Token.** Um token novo, só para este repositório (alcance mínimo, recomendado), ou reaproveitar o do
   DMARC Fácil?
3. **HSTS.** Repetir o do DMARC Fácil (só `max-age`, sem `includeSubDomains` nem `preload`)?
   Recomendação: sim.

## Decisões resolvidas

1. Endereços `webvigil.ryanmorais.com.br` e `mailvigil.ryanmorais.com.br` (decisão do mantenedor, 2026-11-01).
2. Plataforma: **Workers Static Assets** da Cloudflare, um `wrangler.json` por app, `deploy.yml` e ambiente
   `producao`, no modelo do DMARC Fácil (decisão do mantenedor, 2026-11-07).
3. Analytics: GA4 com Consent Mode, mesma propriedade do site principal (spec 003).
4. Publicar, criar token e conectar domínio são atos do mantenedor.
5. O guia de operação fica fora do repositório.

## Testes

- `test/hospedagem.test.ts`: cada `wrangler.json` aponta para o `dist` do próprio app, `not_found_handling`
  é `404-page`, `workers_dev` e `preview_urls` desligados, rota com o domínio certo.
- `test/cabecalhos.test.ts`: o `_headers` gerado traz os cabeçalhos de RF-02 nos dois modos de medição, a CSP
  é a de `politicaCsp`, sem `unsafe-inline`, `unsafe-eval` nem `*`.
- `test/descoberta.test.ts`: `robots.txt` e sitemap com o endereço de `astro.config.mjs`; 404 sem `canonical`.
- `test/workflow-deploy.test.ts`: toda `uses:` por SHA, `runs-on: ubuntu-26.04`, deploy só na `main`,
  segredo só no ambiente `producao`.
- Conferência do que está no ar (RF-08): passo do workflow de deploy, com o resultado no log.
- O CI roda o portão completo em todo PR.
