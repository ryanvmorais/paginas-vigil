---
feature: Medição com consentimento — Google Analytics 4 em Consent Mode, banner e CSP sem inline
status: aprovado
date: 2026-11-06
related: [001-fundacao, 002-tema]
origin: conception
---

# 003 — Medição — Tasks

Sugestão de entrega: uma branch e um PR por etapa, cada um com o portão de qualidade verde. Em toda etapa, o
portão é `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, e o resultado real
fica anotado na última tarefa. Os documentos desta spec entram num PR próprio, antes da Etapa 0. A verificação
com o identificador de teste (`PUBLIC_GA_MEASUREMENT_ID=G-TESTE12345`) é descrita na Etapa 2; sem a variável,
o build é o do modo sem medição.

## Etapa 0 — Spikes e lógica pura: identificador, política e consentimento

- [ ] Spike do Astro: com um componente de teste que tem `<script>` e é renderizado atrás de um `if`, construir um app e conferir se o `<script src>` sai no HTML quando a condição é falsa. Registrar a decisão aqui: se sair, o plano é o do "Riscos" do design (script inerte sem o banner, verificador aceitando o `src` só com o banner e, em último caso, um segundo layout por modo). — RF-06, ADR-7
- [ ] Spike do `envDir`: com `vite.envDir: "../.."` nos `astro.config.mjs`, conferir que `import.meta.env.PUBLIC_GA_MEASUREMENT_ID`, lido num `.astro` do tema, vem de um `.env` na raiz do repositório no `pnpm dev` e no `pnpm build`; senão, registrar o recuo (um `.env` por app). — RF-06
- [ ] `packages/tema/src/medicao.test.ts`: escrever primeiro os casos de `validarIdMedicao`: `G-ABC1234567` válido; vazio, `undefined`, com espaço, minúsculo, curto e longo demais recusados. — RF-06, RNF-05
- [ ] `packages/tema/src/medicao.ts`: `validarIdMedicao(valor)` devolve o identificador ou `undefined` (`^G-[A-Z0-9]{10}$`), com o cabeçalho `@file` no padrão de `idiomas.ts`. — RF-06
- [ ] `packages/tema/src/politica.ts`: o endereço da política do site principal por idioma (`href` e `traduzida`) e o domínio do cookie, em um só lugar. — RF-05, ADR-2
- [ ] `packages/tema/src/consentimento.test.ts`: escrever primeiro os casos do núcleo, com cookie, armazenamento local e `gtag` montados no teste: estado padrão negado nos quatro campos; aceitar concede só `analytics_storage`; recusar mantém tudo negado e não carrega o `gtag.js`; restauração do cookie, do armazenamento local e da memória; cookie que não confirma na leitura cai para o local; local que lança cai para a memória; o cookie vence o local; valor diferente de `true`/`false` é "sem escolha"; revogação só nega `analytics_storage`; `criarGtag` empurra `arguments`; ordem `default` → `update` → `js` → `config` e um único `config` com aceitar, recusar e aceitar de novo. — RF-01, RF-03, RF-04, RF-07, RNF-04, RNF-05
- [ ] `packages/tema/src/consentimento.ts`: tipos `Escolha`, `Armazem` e `Meios`; `lerEscolha`, `gravarEscolha` (grava, lê de volta e recua), `estadoPadrao`, `estadoAceito`, `estadoRevogado`, `criarGtag`, o aplicador da escolha e a constante da URL do `gtag.js`. — RF-01, RF-03, RF-04, RF-07, ADR-1, ADR-2, ADR-3
- [ ] `packages/tema/src/textos.ts`: dicionários `pt` e `en` de `consentimento` (título, texto, "Saiba mais na", política, aceitar, recusar, fechar, escolha atual, rótulo da região) e `rodape.politica`/`rodape.gerenciar`, com o texto do banner do site principal; o `textos.test.ts` existente cobre a paridade. — RF-05, RF-08
- [ ] `packages/tema/package.json`: `exports` com `./consentimento`, `./medicao` e `./politica`. — ADR-1
- [ ] Portão de qualidade. — anotar o resultado real e a decisão dos dois spikes.

## Etapa 1 — CSP e verificação do HTML

- [ ] `scripts/csp.test.mjs`: escrever primeiro os casos de `politicaCsp`: com medição, `script-src` com `'self'` e só o domínio do `gtag.js`; sem medição, nenhuma diretiva com domínio externo; nunca `unsafe-inline`, `unsafe-eval` nem `*`; `default-src`, `base-uri`, `form-action`, `object-src` e `frame-ancestors` em `'none'`. — RF-09, RNF-01
- [ ] `scripts/csp.mjs`: `politicaCsp({ medicao })` devolve as diretivas e o texto do cabeçalho, conforme a tabela do design. — RF-09, ADR-5
- [ ] `test/csp.test.ts`: a URL do `gtag.js` do núcleo é aceita pelo `script-src` de `politicaCsp({ medicao: true })`. — RF-09, ADR-5
- [ ] `scripts/verificar-dist.test.mjs`: escrever primeiro os casos novos, com HTML montado no teste: com medição, sem inline e compatível; sem medição, sem banner, controle nem referência externa; banner sem `data-medicao` válido, ou banner sem controle (meio-termo), reprovados; `<script src>`, `<link>` e `<img>` de domínio fora da CSP reprovados; inline reprovado. — RF-06, RF-09
- [ ] `scripts/verificar-dist.mjs`: detectar o modo pelo HTML (`data-consentimento`, `data-medicao`, `data-gerenciar-cookies`), exigir a coerência dos três e conferir cada recurso buscado pelo HTML (`script src`, `link` de `stylesheet`, `preload`, `modulepreload` e `icon`, `img`, `source`) contra `politicaCsp` do modo; `<a>`, `canonical` e `alternate` ficam fora. — RF-06, RF-09, ADR-5
- [ ] Portão de qualidade. — anotar o resultado real.

## Etapa 2 — Banner, script, rodapé e integração

- [ ] `apps/*/astro.config.mjs`: `vite.envDir: "../.."` (ou o recuo registrado no spike) e o comentário do porquê. — RF-06
- [ ] `packages/tema/src/componentes/Consentimento.astro`: a estrutura do design (região nomeada, título com o ícone, texto com o link da política, escolha atual, "Recusar" e "Aceitar" na mesma classe, X com rótulo "Fechar e recusar cookies"), `hidden` por padrão, `data-medicao` com o identificador, e o estilo da alternativa A do mockup, com os tokens do tema e a reserva de rolagem. O ícone `cookie-bite` do Font Awesome Free entra como SVG embutido, com a atribuição no cabeçalho do arquivo. — RF-02, RF-05, RNF-02, ADR-4
- [ ] `packages/tema/src/scripts/consentimento.ts`: liga o núcleo ao DOM, ao cookie, ao `localStorage` e ao `gtag` reais; define o estado negado, restaura a escolha, revela o banner sem escolha, trata Aceitar, Recusar, X e Esc, revela e liga "Gerenciar cookies", cria o `<script>` do `gtag.js` só com consentimento, põe e tira a classe de reserva de rolagem no `<body>` e cuida do foco (primeira visita: `main`; reaberto: título do banner e volta ao botão que abriu). — RF-01, RF-02, RF-03, RF-04, RF-07, ADR-1, ADR-4
- [ ] `packages/tema/src/layouts/Pagina.astro`: renderizar o `Consentimento` como primeiro filho do `<body>` só com `validarIdMedicao` válido. — RF-06, ADR-7
- [ ] `packages/tema/src/componentes/Rodape.astro`: o link "Política de privacidade" sempre; o botão "Gerenciar cookies" (`hidden`, `data-gerenciar-cookies`) só com medição; os dois fora da navegação "Mais projetos". — RF-04, RF-05
- [ ] `NOTICE` (raiz, arquivo novo): registrar a atribuição do ícone do Font Awesome Free (CC BY 4.0). — RF-02
- [ ] `.env.example`: ajustar o comentário (o banner e o controle só existem com o identificador). — RF-06
- [ ] Conferir os dois modos: `pnpm build` sem a variável (HTML sem script de medição, banner nem controle, `verificar-dist` verde) e com `PUBLIC_GA_MEASUREMENT_ID=G-TESTE12345` (banner, controle e `verificar-dist` verdes nos dois sites e idiomas); `pnpm dev` com o banner a 390 e a 1280 px, claro e escuro. — RF-02, RF-06, RF-09
- [ ] Portão de qualidade. — anotar o resultado real e a decisão do spike sobre o `<script>` condicional.

## Etapa 3 — CI, Lighthouse e documentação

- [ ] `.github/workflows/ci.yml`: no job `qualidade`, além do `pnpm build`, construir os dois sites com `PUBLIC_GA_MEASUREMENT_ID=G-TESTE12345` para o `verificar-dist` exercitar o modo com medição. — RF-06, RF-09
- [ ] `.github/workflows/lighthouse.yml`: construir com o identificador de teste, para medir a primeira visita com o banner aberto. — RNF-03
- [ ] `CLAUDE.md` e `docs/stack.md`: tirar a nota "a medição ainda não existe", acrescentar o consentimento, a CSP e o `verificar-dist` com a CSP; conferir os READMEs nos dois idiomas. — RF-09
- [ ] `specs/README.md`: nota de manutenção da CSP e do contrato do cookie de escolha. — RF-03, RF-09
- [ ] Portão de qualidade. — anotar o resultado real.

## Etapa 4 — Verificação em navegador real e fechamento

- [ ] Banner a 390 e a 1280 px (e 360 e 430), claro e escuro, nos dois idiomas, primeira visita e reaberto; o estilo calculado de "Aceitar" e "Recusar" idêntico; sem rolagem horizontal; o rodapé e "Gerenciar cookies" alcançáveis com o banner aberto. — RF-02, RF-04, RNF-02
- [ ] Teclado e leitor de tela: conferir com o NVDA a ordem de tabulação, o anúncio do banner, o foco depois da escolha e o rótulo do X; registrar a cobertura real. — RF-02, RNF-02
- [ ] Rede e cookies: antes do aceite, nenhum pedido ao Google e nenhum cookie `_ga*`; depois do aceite, o `gtag.js` carregado, um `page_view` por página, nenhuma violação de CSP no console com a CSP de `politicaCsp` aplicada (pelo servidor de teste); depois de recusar, nenhum envio novo. — RF-01, RF-03, RF-07, RF-09, RNF-04
- [ ] Escolha em cookie de domínio, armazenamento local e memória: conferir a gravação e o recuo em `localhost`; a escolha entre os três sites só pode ser conferida depois do deploy. — RF-03
- [ ] `axe-core` com o banner aberto e fechado, e Lighthouse CI com o banner aberto: sem violações e dentro dos limites. — RNF-02, RNF-03
- [ ] Auditoria de segurança do repositório (dependências, análise estática, segredos, configuração e revisão lógica) e tratamento dos achados. — RNF-01, RF-09
- [ ] Marcar a spec `concluído` (os três arquivos e a linha do roadmap em `specs/README.md`) e anotar o que só se confere depois do deploy. — RF-03
- [ ] Portão de qualidade. — anotar o resultado real.
