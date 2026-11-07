---
feature: Hospedagem — os dois sites no ar, cada um no seu subdomínio, com cabeçalhos de segurança, 404 e descoberta
status: aprovado
date: 2026-11-07
related: [001-fundacao, 002-tema, 003-medicao, 004-pagina-webvigil, 005-pagina-mailvigil]
origin: conception
---

# 006 — Hospedagem — tasks

Tarefas pequenas, na ordem. Cada etapa de código fecha com o portão de qualidade (`pnpm format:check`, `pnpm lint`,
`pnpm typecheck`, `pnpm test` e `pnpm build`) e o resultado real registrado na própria tarefa. Uma etapa, um PR.
Nenhuma tarefa publica nada: o token, o ambiente `producao`, os domínios e o primeiro deploy são do mantenedor
(Etapas 5 e 8), e só a Etapa 8 muda o que está no ar. Os testes não acessam a rede (RNF-04); endereços e
registros em teste são sintéticos, menos o endereço público de cada site, que é o `site` do `astro.config.mjs`.
A tela nova (a 404) só vira código depois do mockup aprovado (Etapa 1).

## Etapa 1 — Mockup da 404

Etapa sem código de interface: o que ela entrega é a decisão.

- [x] Montar o mockup da 404 num Artifact, em 390 e 1280 px, português e inglês, com a variação clara e escura, a partir da seção "Página 404" do `design.md` (2 ou 3 alternativas, uma recomendada). — RF-03
- [x] O mantenedor aprova uma alternativa; a decisão, o motivo e o rascunho final entram na seção "Página 404" do `design.md` (sem link de Artifact privado). — RF-03

## Etapa 2 — Página 404

- [x] `packages/tema/src/textos.ts`: os rótulos da 404 (título, frase, botão de volta) em português e em inglês, como no mockup aprovado. O teste de paridade de idiomas cobre as chaves novas. — RF-03
- [x] `packages/tema/src/layouts/Pagina.astro`: propriedade `indexavel` (padrão `true`); com `false` emite `<meta name="robots" content="noindex">` e omite `canonical`, `alternate` e `og:*`. Teste da propriedade. — RF-03, ADR-7
      Desvio: o projeto não tem como renderizar um `.astro` no Vitest (o `astro` não resolve da raiz e não há `vitest.config` com o plugin do Astro). A propriedade é testada no HTML que ela gera: a regra da página `noindex` do `verificar-dist` (sem `canonical`, `alternate` nem `og:*`; o `hreflang` do seletor de idioma não conta), com testes em `verificar-dist.test.mjs`, e roda em todo build. Também omite `twitter:card`. `imagemSocialAlt` passou a opcional, e o layout falha no build se faltar numa página indexável.
- [x] `packages/tema/src/componentes/NaoEncontrada.astro`: bloco central da 404, com o botão de volta à página inicial do idioma. — RF-03
- [x] `apps/webvigil/src/pages/404.astro` e `en/404.astro`, e o mesmo em `apps/mailvigil/`: `Pagina` com `indexavel={false}`, cabeçalho sem menu, seletor de idioma levando às páginas iniciais, rodapé. Conferir qual arquivo o Astro emite para `en/404.astro` (`en/404.html` ou `en/404/index.html`); se não for `en/404.html`, registrar o desvio e tratá-lo no gerador da Etapa 3. — RF-03, ADR-3
      Feito: a montagem fica em `apps/<site>/src/componentes/Erro404.astro` (como a `Vitrine`), e as duas páginas só passam o idioma. Desvio registrado no `design.md`: o Astro emite `en/404/index.html`, não `en/404.html`; o gerador da Etapa 3 copia o arquivo.
- [x] Conferir as quatro 404 no build servido, no celular e no desktop, claro e escuro, e rodar o axe sobre elas (acessibilidade sem violações, contraste incluído). — RF-03, ADR-8
      Resultado: build com medição servido como a hospedagem (caminho inexistente responde 404 com a página mais próxima, com a CSP de `csp.mjs`); axe em 80 combinações (2 sites, 2 idiomas, claro e escuro, 360 a 1280 px, banner aberto e fechado): 0 violações, 0 rolagem horizontal, 0 erro de console além do 404 do próprio documento. Capturas conferidas em 390 e 1280 px. Botão de volta e seletor levam a `/` e `/en/`.
- [x] Portão de qualidade. — registrar o resultado
      Resultado: `format:check`, `lint` e `typecheck` sem erro; `pnpm test`: 14 arquivos, 179 testes verdes; `pnpm build` dos dois sites, sem e com `G-TESTE12345`, com `verificar-dist` sem problemas.

## Etapa 3 — Arquivos da hospedagem gerados no build

- [x] `scripts/csp.mjs`: exportar `medicaoValida(id)` (o formato `G-` e dez maiúsculas ou dígitos); `verificar-dist.mjs` passa a importá-la no lugar da cópia. Teste de que ela concorda com `validarIdMedicao` do tema. — RNF-06, ADR-3
- [x] `scripts/hospedagem.mjs`: `montarCabecalhos`, `montarRobots`, `montarSitemap` e `gerarHospedagem`; execução que lê o `site` do `astro.config.mjs` da pasta atual e o modo de `PUBLIC_GA_MEASUREMENT_ID`. `@ts-check` e JSDoc, como os outros scripts. — RF-02, RF-04, RF-07, ADR-3, ADR-7
      Feito: o gerador também copia `en/404/index.html` para `en/404.html` (desvio da Etapa 2) e recusa um `site` que não seja `https`. Desvio: sem `// @ts-check`, porque nenhum outro script de `scripts/` o usa (só JSDoc). O modo vem de `process.env`: um identificador só no `.env` liga o banner mas não o gerador, e a regra 8 derruba o build (conferido).
- [x] `scripts/hospedagem.test.mjs`: os testes de `scripts/hospedagem.mjs` listados no design (dois modos, limites da plataforma, sitemap com o trio de `hreflang`, escrita em pasta temporária). — RF-02, RF-04, RF-07, RNF-04
- [x] `apps/webvigil/package.json` e `apps/mailvigil/package.json`: `build` passa a `astro build && node ../../scripts/hospedagem.mjs dist && node ../../scripts/verificar-dist.mjs dist`. — RF-02, ADR-3
- [x] `scripts/verificar-dist.mjs`: a regra 8 (cabeçalhos, `robots.txt`, `sitemap.xml` e as duas 404 coerentes com o modo do build), com a documentação do cabeçalho do arquivo atualizada. — RF-02, RF-03, RF-07, ADR-3
- [x] `scripts/verificar-dist.test.mjs`: uma variação por falha da regra 8, listadas no design. — RF-02, RF-03, RF-07, RNF-04
- [x] `.github/lighthouse/<site>-{mobile,desktop}.json` (4 arquivos): `collect.url` com `/index.html` e `/en/index.html`, para a medição por pasta não incluir as 404. — ADR-8
      Feito na Etapa 2 (PR da 404): os quatro JSON já listavam só `/index.html` e `/en/index.html`.
- [x] Portão de qualidade, com o build dos dois sites sem e com medição (`G-TESTE12345`) e o Lighthouse local de um site. — registrar o resultado
      Resultado: `format:check`, `lint` e `typecheck` sem erro; `pnpm test`: 15 arquivos, 238 testes verdes; `pnpm build` dos dois sites, sem e com `G-TESTE12345`, com `verificar-dist` sem problemas (regra 8 incluída; `_headers` de outro modo derruba o build). Lighthouse local do WebVigil, celular e desktop, sobre as duas páginas indexáveis: sem asserção falha.

## Etapa 4 — Configuração dos projetos e conferência do que está no ar

- [ ] `apps/webvigil/wrangler.json` e `apps/mailvigil/wrangler.json`: JSON estrito, sem `main`; `name`, `compatibility_date` (o dia da implementação), `workers_dev` e `preview_urls` `false`, rota `custom_domain` para o subdomínio, `assets` com `./dist`, `404-page` e `auto-trailing-slash`, `observability` desligada. — RF-01, RF-03, ADR-1
- [ ] `test/hospedagem.test.ts`: cada chave dos `wrangler.json` conforme o ADR-1; rota igual ao `site` do `astro.config.mjs` (ADR-2); `package.json` sem `wrangler` entre as dependências. — RF-01, RF-07, RNF-03, RNF-04, ADR-2
- [ ] `scripts/conferir-hospedagem.mjs`: `@ts-check`, JSDoc; `lerCabecalhosEsperados`, `compararCabecalhos` e `conferirHospedagem` com a espera pelo domínio e as nove verificações do design; o endereço vem da rota do `wrangler.json` do app e os bytes esperados, do `dist`; tabela em `$GITHUB_STEP_SUMMARY` quando existir; código de saída 1 se algo falhar; executa só quando chamado direto. — RF-06, RF-08, ADR-5, ADR-6
- [ ] `package.json` da raiz: script `hospedagem:conferir`. `tsconfig.json` e `eslint.config.mjs` cobrem os scripts novos, se ainda não cobrem. — RF-08
- [ ] `scripts/conferir-hospedagem.test.mjs`: os testes listados no design, com `buscar` e `esperar` falsos. — RF-06, RF-08, RNF-04, ADR-5, ADR-6
- [ ] Portão de qualidade, com a cobertura de `conferir-hospedagem.mjs` e `hospedagem.mjs`. — registrar o resultado

## Etapa 5 — Preparação da publicação (o mantenedor)

Etapa sem código e sem portão. Vem **antes** do merge do PR da Etapa 6: o `deploy.yml` roda a partir da `main`
e, sem o ambiente pronto, o primeiro run falharia. Cada passo é do mantenedor.

- [ ] Guia de operação do mantenedor, mantido fora do repositório: criar o token novo da Cloudflare com o menor escopo, o ambiente `producao` (branch de deploy só a `main`, segredos `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`, variável `PUBLIC_GA_MEASUREMENT_ID`), conferir o que a zona faz sozinha com os dois subdomínios, publicar, ler o resumo, validar cada página no navegador e os dois caminhos de volta. — RF-05, RF-06, RF-09, ADR-6, ADR-9
- [ ] O token, o ambiente `producao`, os segredos e a variável criados, e a zona conferida (Web Analytics e demais otimizações que reescrevem conteúdo desligadas para os dois subdomínios). — RF-05, RF-06

## Etapa 6 — Workflow de deploy e Lighthouse de produção

- [ ] `.github/lighthouse/producao-<site>-{mobile,desktop}.json` (4 arquivos): as asserções dos arquivos de origem, com `collect.url` nas duas URLs do site, `numberOfRuns`, `robots-txt` ignorada (ADR-8) e `outputDir` próprio. — RF-08, ADR-5, ADR-8
- [ ] `test/lighthouse-producao.test.ts`: `collect.url` igual às duas URLs do `site`; asserções iguais às de origem; os de origem listam só as páginas indexáveis. — RF-07, RF-08, ADR-2, ADR-8
- [ ] `.github/workflows/deploy.yml`: gatilhos `workflow_run` do `CI` na `main` e `workflow_dispatch`; condição de sucesso, `push` e mesmo repositório; matriz de dois sites com `fail-fast: false`; `permissions: contents: read`; ambiente `producao`; concorrência no grupo `deploy` sem cancelar; passo que recusa variável de medição vazia, inválida ou `G-TESTE12345`; checkout do `head_sha` sem credencial no disco; build do site com `PUBLIC_GA_MEASUREMENT_ID` da variável; passo que só segue se o commit ainda for a ponta da `main`; `WRANGLER_VERSION` (a estável mais nova com mais de 7 dias, conferida no dia) e `npx --yes wrangler@${{ env.WRANGLER_VERSION }} deploy --config apps/<site>/wrangler.json --message "<sha>"`; `node scripts/conferir-hospedagem.mjs <site>`; Lighthouse de produção por `npx` com o `LHCI_VERSION` do `lighthouse.yml`; relatórios guardados; `uses:` por SHA, `runs-on: ubuntu-26.04`, `timeout-minutes`. O comentário de topo diz por que `workflow_run` e por que o `wrangler` não é dependência. — RF-05, RF-08, ADR-4, ADR-5
- [ ] `test/workflow-deploy.test.ts`: os testes do `deploy.yml` listados no design. — RF-05, RNF-04, ADR-4
- [ ] `pnpm dlx wrangler@<versão> deploy --dry-run --config apps/<site>/wrangler.json` em cada app, depois de um `pnpm build`, lendo a configuração e os arquivos sem erro (nada é publicado). — RF-01, ADR-1
- [ ] Portão de qualidade. — registrar o resultado. O `deploy.yml` não roda antes do merge (`workflow_run` usa o arquivo da `main`); a leitura de cada passo é conferida pelo teste e pela revisão do PR.

## Etapa 7 — Documentação

- [ ] `CLAUDE.md` (manter abaixo de ~20 KB): árvore de arquitetura com `wrangler.json`, `deploy.yml`, `hospedagem.mjs`, `conferir-hospedagem.mjs` e `producao-*.json`; um aviso `⚠️` de que `_headers`, `robots.txt` e `sitemap.xml` são gerados no build e nunca escritos à mão; a seção de qualidade cita o deploy e a conferência; a linha de estado deixa de dizer que a hospedagem está por fazer. — RF-09, Impacto
- [ ] `docs/stack.md`: Workers Static Assets, `wrangler` por `npx`, `_headers`, HSTS, ambiente `producao`. — RF-09, Impacto
- [ ] `README.md` e `README.en.md`: o endereço de cada site e a tecnologia que o serve, sem data de lançamento. — RF-09, Impacto
- [ ] `specs/README.md`: linha da 006 como `em andamento` e a nota de manutenção sobre o `_headers` gerado a partir de `scripts/csp.mjs`. — RF-09, Impacto
- [ ] Portão de qualidade final, com o total de testes e a cobertura. — registrar o resultado. A spec fica `em andamento` até a Etapa 8.

## Etapa 8 — Publicação (o mantenedor)

Etapa sem código e sem portão: o que ela entrega são os sites no ar, conferidos pelo `deploy.yml` (RF-08).

- [ ] Merge do PR da Etapa 6 com a Etapa 5 pronta; o primeiro deploy sai pelo run do CI na `main` ou por `workflow_dispatch`. — RF-01, RF-05
- [ ] Resumo da conferência lido, nos dois sites: todas as verificações verdes, ou cada falha tratada (cabeçalhos na 404, `Cache-Control` de `/_astro/*`, `en/404.html`, permissão do token, os riscos do design) com o desvio registrado no `design.md`. — RF-02, RF-03, RF-04, RF-06, RF-08
- [ ] Lighthouse de produção verde nos dois sites e nos dois modos, com as notas e o peso registrados aqui; cada página aberta no navegador, só com o próprio site e os hosts do GA4 depois do aceite, sem violação de CSP no console. — RF-08, ADR-6
- [ ] Um rollback real feito e desfeito num dos sites, antes de divulgar os endereços. — RF-05, ADR-9
- [ ] `*.workers.dev` e a pré-visualização conferidos como fora do ar nos dois projetos (só o subdomínio aparece). — RF-01
- [ ] Os três arquivos da spec com `status: concluído` e a linha da 006 em `specs/README.md` como `concluído`. — Impacto
