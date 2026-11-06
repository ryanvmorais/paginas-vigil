---
feature: Medição com consentimento — Google Analytics 4 em Consent Mode, banner e CSP sem inline
status: em andamento
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

- [x] Spike do Astro: com um componente de teste que tem `<script>` e é renderizado atrás de um `if`, construir um app e conferir se o `<script src>` sai no HTML quando a condição é falsa. Registrar a decisão aqui: se sair, o plano é o do "Riscos" do design (script inerte sem o banner, verificador aceitando o `src` só com o banner e, em último caso, um segundo layout por modo). — RF-06, ADR-7
      **Decisão: o Astro não emite o `<script src>` de um componente que não é renderizado.** Com o componente atrás de um `if` falso, o HTML da página saiu sem `<script>` (o arquivo `.js` existe em `_astro/`, mas nenhuma página o referencia); renderizado, a página ganhou um único `<script type="module" src>`. O plano do "Riscos" do design (script inerte, verificador tolerante, segundo layout) não é necessário: o `Consentimento.astro` leva o `<script>` e o `Pagina` o renderiza só com identificador válido.
- [x] Spike do `envDir`: com `vite.envDir: "../.."` nos `astro.config.mjs`, conferir que `import.meta.env.PUBLIC_GA_MEASUREMENT_ID`, lido num `.astro` do tema, vem de um `.env` na raiz do repositório no `pnpm dev` e no `pnpm build`; senão, registrar o recuo (um `.env` por app). — RF-06
      **Decisão: `vite.envDir: "../.."` funciona.** Num componente `.astro` do tema, `import.meta.env.PUBLIC_GA_MEASUREMENT_ID` veio do `.env` da raiz no `astro build` e no `astro dev`, e ficou `undefined` (atributo omitido) sem o `.env`. Sem recuo para um `.env` por app.
- [x] `packages/tema/src/medicao.test.ts`: escrever primeiro os casos de `validarIdMedicao`: `G-ABC1234567` válido; vazio, `undefined`, com espaço, minúsculo, curto e longo demais recusados. — RF-06, RNF-05
- [x] `packages/tema/src/medicao.ts`: `validarIdMedicao(valor)` devolve o identificador ou `undefined` (`^G-[A-Z0-9]{10}$`), com o cabeçalho `@file` no padrão de `idiomas.ts`. — RF-06
- [x] `packages/tema/src/politica.ts`: o endereço da política do site principal por idioma (`href` e `traduzida`) e o domínio do cookie, em um só lugar. — RF-05, ADR-2
- [x] `packages/tema/src/consentimento.test.ts`: escrever primeiro os casos do núcleo, com cookie, armazenamento local e `gtag` montados no teste: estado padrão negado nos quatro campos; aceitar concede só `analytics_storage`; recusar mantém tudo negado e não carrega o `gtag.js`; restauração do cookie, do armazenamento local e da memória; cookie que não confirma na leitura cai para o local; local que lança cai para a memória; o cookie vence o local; valor diferente de `true`/`false` é "sem escolha"; revogação só nega `analytics_storage`; `criarGtag` empurra `arguments`; ordem `default` → `update` → `js` → `config` e um único `config` com aceitar, recusar e aceitar de novo. — RF-01, RF-03, RF-04, RF-07, RNF-04, RNF-05
- [x] `packages/tema/src/consentimento.ts`: tipos `Escolha`, `Armazem` e `Meios`; `lerEscolha`, `gravarEscolha` (grava, lê de volta e recua), `estadoPadrao`, `estadoAceito`, `estadoRevogado`, `criarGtag`, o aplicador da escolha (`criarMedicao`, com `iniciar` e `aplicar`) e a constante da URL do `gtag.js` (`URL_GTAG`). Também `montarCookie` e `lerCookie`, puras, para o script de entrada só repassar `document.cookie`. — RF-01, RF-03, RF-04, RF-07, ADR-1, ADR-2, ADR-3
- [x] `packages/tema/src/textos.ts`: dicionários `pt` e `en` de `consentimento` (título, texto, "Saiba mais na", política, aceitar, recusar, fechar, escolha atual, rótulo da região) e `rodape.politica`/`rodape.gerenciar`, com o texto do banner do site principal; o `textos.test.ts` existente cobre a paridade. — RF-05, RF-08
      **Sem chave de rótulo da região:** a região é nomeada pelo título (`aria-labelledby`), como o design manda. Entraram `foraDoIdioma` ("(em português)"/"(in Portuguese)", usado quando `traduzida` é falso) e as palavras da escolha atual (`escolhaAceita`/`escolhaRecusada`).
- [x] `packages/tema/package.json`: `exports` com `./consentimento`, `./medicao` e `./politica`. — ADR-1
- [x] Portão de qualidade. — `format:check`, `lint`, `typecheck` (tema e os dois apps, 0 erros), `test` (80 testes em 9 arquivos) e `build` (`verificar-dist` sem problemas nos dois sites) verdes. Decisão dos spikes: ver as duas primeiras tarefas.

## Etapa 1 — CSP e verificação do HTML

- [x] `scripts/csp.test.mjs`: escrever primeiro os casos de `politicaCsp`: com medição, `script-src` com `'self'` e só o domínio do `gtag.js`; sem medição, nenhuma diretiva com domínio externo; nunca `unsafe-inline`, `unsafe-eval` nem `*`; `default-src`, `base-uri`, `form-action`, `object-src` e `frame-ancestors` em `'none'`. — RF-09, RNF-01
- [x] `scripts/csp.mjs`: `politicaCsp({ medicao })` devolve as diretivas e o texto do cabeçalho, conforme a tabela do design; `urlPermitida(politica, diretiva, url)` diz se a política deixa buscar uma URL (relativa vale `'self'`, absoluta só se o host está na lista, curinga só para subdomínio). — RF-09, ADR-5
- [x] `test/csp.test.ts`: a URL do `gtag.js` do núcleo é aceita pelo `script-src` de `politicaCsp({ medicao: true })`. — RF-09, ADR-5
- [x] `scripts/verificar-dist.test.mjs`: escrever primeiro os casos novos, com HTML montado no teste: com medição, sem inline e compatível; sem medição, sem banner, controle nem referência externa; banner sem `data-medicao` válido, ou banner sem controle (meio-termo), reprovados; `<script src>`, `<link>` e `<img>` de domínio fora da CSP reprovados; inline reprovado. — RF-06, RF-09
- [x] `scripts/verificar-dist.mjs`: detectar o modo pelo HTML (`data-consentimento`, `data-medicao`, `data-gerenciar-cookies`), exigir a coerência dos três e conferir cada recurso buscado pelo HTML (`script src`, `link` de `stylesheet`, `preload`, `modulepreload` e `icon`, `img`, `source`) contra `politicaCsp` do modo; `<a>`, `canonical` e `alternate` ficam fora. O script de consentimento é reconhecido pelo nome do arquivo (`consentimento`, o que o Astro deriva do componente); a Etapa 2 confirma o nome real no build com medição. — RF-06, RF-09, ADR-5
- [x] Portão de qualidade. — `format:check`, `lint`, `typecheck` (0 erros nos três pacotes), `test` (114 testes em 11 arquivos) e `build` (`verificar-dist` sem problemas nos dois sites, no modo sem medição) verdes. O modo com medição só tem o que conferir de verdade na Etapa 2, quando o banner existir.

## Etapa 2 — Banner, script, rodapé e integração

- [x] `apps/*/astro.config.mjs`: `vite.envDir: "../.."` (ou o recuo registrado no spike) e o comentário do porquê. — RF-06
- [x] `packages/tema/src/componentes/Consentimento.astro`: a estrutura do design (região nomeada, título com o ícone, texto com o link da política, escolha atual, "Recusar" e "Aceitar" na mesma classe, X com rótulo "Fechar e recusar cookies"), `hidden` por padrão, `data-medicao` com o identificador, e o estilo da alternativa A do mockup, com os tokens do tema e a reserva de rolagem. O ícone `cookie-bite` do Font Awesome Free entra como SVG embutido, com a atribuição no cabeçalho do arquivo. — RF-02, RF-05, RNF-02, ADR-4
      **Acrescentou o token `--sombra-banner`** em `tokens.css` (claro e escuro), que o mockup chamava `--cb-shadow`. O ícone é o desenho oficial da versão 6.7.2 (viewBox 512, o do mockup era uma aproximação em 640).
- [x] `packages/tema/src/scripts/consentimento.ts`: liga o núcleo ao DOM, ao cookie, ao `localStorage` e ao `gtag` reais; define o estado negado, restaura a escolha, revela o banner sem escolha, trata Aceitar, Recusar, X e Esc, revela e liga "Gerenciar cookies", cria o `<script>` do `gtag.js` só com consentimento, põe e tira a classe de reserva de rolagem no `<body>` e cuida do foco (primeira visita: `main`; reaberto: título do banner e volta ao botão que abriu). — RF-01, RF-02, RF-03, RF-04, RF-07, ADR-1, ADR-4
- [x] `packages/tema/src/layouts/Pagina.astro`: renderizar o `Consentimento` como primeiro filho do `<body>` só com `validarIdMedicao` válido. — RF-06, ADR-7
- [x] `packages/tema/src/componentes/Rodape.astro`: o link "Política de privacidade" sempre; o botão "Gerenciar cookies" (`hidden`, `data-gerenciar-cookies`) só com medição; os dois fora da navegação "Mais projetos". — RF-04, RF-05
- [x] `NOTICE` (raiz, arquivo novo): registrar a atribuição do ícone do Font Awesome Free (CC BY 4.0). — RF-02
- [x] `.env.example`: ajustar o comentário (o banner e o controle só existem com o identificador). — RF-06
- [x] Conferir os dois modos: `pnpm build` sem a variável (HTML sem script de medição, banner nem controle, `verificar-dist` verde) e com `PUBLIC_GA_MEASUREMENT_ID=G-TESTE12345` (banner, controle e `verificar-dist` verdes nos dois sites e idiomas); `pnpm dev` com o banner a 390 e a 1280 px, claro e escuro. — RF-02, RF-06, RF-09
      **Resultado:** o nome real do script no build com medição é `Consentimento.astro_astro_type_script_index_0_lang.<hash>.js`, que o `verificar-dist` reconhece pelo `consentimento` (sem diferenciar maiúsculas); sem medição o HTML não tem banner, controle nem esse `<script>`. A conferência em navegador foi feita no build servido (Chrome real, sem `pnpm dev`; o `envDir` do dev já foi provado no spike): 179 verificações verdes em 390 e 1280 px, claro e escuro, pt e en, nos dois sites (primeira visita, aceitar, recarregar, reabrir pelo rodapé, Esc, recusar e o X). Em `localhost` o cookie de domínio é recusado e a escolha recuou para o armazenamento local, como projetado.
- [x] Portão de qualidade. — `format:check`, `lint`, `typecheck` (0 erros nos três pacotes), `test` (114 testes em 11 arquivos) e `build` (`verificar-dist` sem problemas nos dois sites, sem medição e com `G-TESTE12345`) verdes. Decisão do spike: o Astro não emite o `<script src>` do banner quando ele não é renderizado (ver a Etapa 0).

## Etapa 3 — CI, Lighthouse e documentação

- [x] `.github/workflows/ci.yml`: no job `qualidade`, além do `pnpm build`, construir os dois sites com `PUBLIC_GA_MEASUREMENT_ID=G-TESTE12345` para o `verificar-dist` exercitar o modo com medição. — RF-06, RF-09
- [x] `.github/workflows/lighthouse.yml`: construir com o identificador de teste, para medir a primeira visita com o banner aberto. — RNF-03
- [x] `CLAUDE.md` e `docs/stack.md`: tirar a nota "a medição ainda não existe", acrescentar o consentimento, a CSP e o `verificar-dist` com a CSP; conferir os READMEs nos dois idiomas. — RF-09
- [x] `specs/README.md`: nota de manutenção da CSP e do contrato do cookie de escolha. — RF-03, RF-09
- [x] Portão de qualidade. — `format:check`, `lint`, `typecheck` (0 erros nos três pacotes), `test` (114 testes em 11 arquivos) e `build` (`verificar-dist` sem problemas nos dois sites, sem medição e com `G-TESTE12345`) verdes. O CI e o Lighthouse CI com o banner aberto só se confirmam no PR.

## Etapa 4 — Verificação em navegador real e fechamento

- [ ] Banner a 390 e a 1280 px (e 360 e 430), claro e escuro, nos dois idiomas, primeira visita e reaberto; o estilo calculado de "Aceitar" e "Recusar" idêntico; sem rolagem horizontal; o rodapé e "Gerenciar cookies" alcançáveis com o banner aberto. — RF-02, RF-04, RNF-02
- [ ] Teclado e leitor de tela: conferir com o NVDA a ordem de tabulação, o anúncio do banner, o foco depois da escolha e o rótulo do X; registrar a cobertura real. — RF-02, RNF-02
- [ ] Rede e cookies: antes do aceite, nenhum pedido ao Google e nenhum cookie `_ga*`; depois do aceite, o `gtag.js` carregado, um `page_view` por página, nenhuma violação de CSP no console com a CSP de `politicaCsp` aplicada (pelo servidor de teste); depois de recusar, nenhum envio novo. — RF-01, RF-03, RF-07, RF-09, RNF-04
- [ ] Escolha em cookie de domínio, armazenamento local e memória: conferir a gravação e o recuo em `localhost`; a escolha entre os três sites só pode ser conferida depois do deploy. — RF-03
- [ ] `axe-core` com o banner aberto e fechado, e Lighthouse CI com o banner aberto: sem violações e dentro dos limites. — RNF-02, RNF-03
- [ ] Auditoria de segurança do repositório (dependências, análise estática, segredos, configuração e revisão lógica) e tratamento dos achados. — RNF-01, RF-09
- [ ] Marcar a spec `concluído` (os três arquivos e a linha do roadmap em `specs/README.md`) e anotar o que só se confere depois do deploy. — RF-03
- [ ] Portão de qualidade. — anotar o resultado real.
