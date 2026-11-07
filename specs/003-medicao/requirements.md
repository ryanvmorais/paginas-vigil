---
feature: Medição com consentimento — Google Analytics 4 em Consent Mode, banner e CSP sem inline
status: concluído
date: 2026-11-06
related: [001-fundacao, 002-tema]
origin: conception
---

# 003 — Medição

## Contexto e problema

Os dois sites medem as visitas com o Google Analytics 4, na mesma propriedade do site principal do
mantenedor, para saber quais páginas e idiomas são lidos. Medir sem aviso e sem consentimento não é
aceitável (LGPD): o visitante precisa ser informado, poder recusar, e recusar precisa ser tão fácil quanto
aceitar. Hoje a medição não existe no código: `PUBLIC_GA_MEASUREMENT_ID` está no `.env.example`, mas nada o
lê, não há banner e o rodapé não aponta para política nenhuma.

Há uma restrição de segurança que molda a solução: a política de segurança de conteúdo (CSP) do deploy não
vai permitir `unsafe-inline` ([`001-fundacao`](../001-fundacao/requirements.md), RNF-02). O snippet padrão
do Google é um `<script>` inline; aqui todo script, inclusive o que define o consentimento negado por
padrão, precisa ser um arquivo externo. A mesma política deve abrir só os domínios da medição, e só
quando a medição existe.

**A política de privacidade é única e mora no site principal.** Os dois sites são subdomínios dele e usam a
mesma propriedade do GA4, então não mantêm política própria: o banner e o rodapé trazem um texto curto e
apontam para a política do site principal, que identifica o controlador, fixa a retenção e lista os direitos
do titular. Assim há um só texto para manter.

Esta spec entrega a medição **inteira e honesta** deste lado: consentimento negado por padrão, banner,
gerenciamento da escolha depois dela e a CSP que o deploy vai aplicar. O que depende do site principal está
em "Dependências externas".

## Objetivos

- **Nada é medido sem consentimento**: antes da escolha do visitante, nenhum cookie de medição é gravado
  e nenhum dado de navegação sai para o Google além do que o Consent Mode negado permite.
- **Banner claro e simétrico**: aceitar e recusar com o mesmo peso visual e o mesmo esforço, nos dois
  idiomas, acessível por teclado e leitor de tela, com a mesma estrutura do banner do site principal.
- **Revogável a qualquer momento**: o visitante muda a escolha pelo rodapé, sem apagar cookies à mão.
- **Uma escolha para todos os sites**: guardada num cookie do domínio do site principal, vale para ele e
  para os dois subdomínios.
- **Sem medição sem identificador**: `PUBLIC_GA_MEASUREMENT_ID` vazio significa página sem script de
  medição, sem banner e sem controle de gerenciar cookies.
- **CSP documentada e testada**: a política que o deploy aplicará está escrita, sem `unsafe-inline`, e o
  build confere que o HTML é compatível com ela.

## Não-objetivos

- A política de privacidade em si, a versão dela em inglês e o ajuste de escopo para os subdomínios: são
  trabalho do site principal (ver "Dependências externas"). Este repositório não tem página de política.
- O deploy, os cabeçalhos HTTP em produção e o domínio: ficam na fase de publicação. Esta spec define a
  política de segurança de conteúdo e confere o HTML contra ela; quem a emite é o deploy.
- Eventos personalizados, metas, funis e qualquer medição além da visualização de página.
- Publicidade, remarketing, sinais do Google e personalização de anúncios: permanecem negados sempre.
- Ferramenta de medição alternativa ou cookieless; a escolha pelo GA4 está fixada.
- O texto das páginas de produto (specs dos sites); aqui entram só o banner e os rótulos de consentimento.

## Personas

- Como **visitante**, quero ser avisado e escolher sem pressão, e mudar de ideia depois, para decidir o
  que acontece com os meus dados.
- Como **visitante que usa teclado ou leitor de tela**, quero decidir no banner sem armadilha de foco e
  com os botões anunciados, para ter a mesma escolha de quem usa mouse.
- Como **visitante que circula entre o site principal e os subdomínios**, quero escolher uma vez só, para
  não ser perguntado de novo a cada site.
- Como **mantenedor**, quero ligar e desligar a medição só por uma variável de ambiente, para não
  precisar mexer em código nem publicar medição por engano.
- Como **auditor de segurança**, quero uma CSP sem `unsafe-inline` e restrita aos domínios necessários,
  para a medição não abrir uma brecha para script de terceiros.

## Requisitos funcionais

### RF-01 — Consentimento negado por padrão

- **Given** uma página com identificador de medição configurado
  **When** ela é carregada pela primeira vez
  **Then** o consentimento começa com `analytics_storage`, `ad_storage`, `ad_user_data` e
  `ad_personalization` negados, definido por um script em arquivo externo executado antes de qualquer
  carregamento do `gtag.js`.
- **Given** o consentimento negado
  **When** a página é exibida
  **Then** nenhum cookie de medição (`_ga*`) é gravado.

### RF-02 — Banner de consentimento

- **Given** um visitante sem escolha registrada
  **When** a página carrega
  **Then** aparece um banner (cartão fixo na tela, como o do site principal) com o texto de aviso, o link
  para a política de privacidade e os botões "Aceitar" e "Recusar" com o mesmo tamanho, a mesma altura e o
  mesmo peso visual, no idioma da página, mais um botão de fechar que vale como recusa e diz isso no
  rótulo acessível.
- **Given** o banner aberto
  **When** o visitante escolhe uma das opções
  **Then** o banner some, a escolha é gravada e o foco volta a um ponto previsível da página.
- **Given** o banner aberto
  **When** o visitante navega por teclado ou leitor de tela
  **Then** os botões são alcançáveis, têm rótulo claro, o banner é anunciado sem tomar o foco à força, o
  foco inicial não vai a "Aceitar" por padrão e o banner não cobre o conteúdo a ponto de impedir a leitura
  a 390 px.

### RF-03 — Aceitar, recusar e lembrar

- **Given** o visitante que aceita
  **When** a escolha é gravada
  **Then** o consentimento passa a `analytics_storage: granted`, os outros três continuam negados e a
  medição da página atual começa.
- **Given** o visitante que recusa
  **When** a escolha é gravada
  **Then** tudo continua negado, o `gtag.js` não é carregado e nenhum cookie de medição é gravado.
- **Given** uma escolha já gravada
  **When** o visitante abre outra página ou volta depois
  **Then** o banner não reaparece e o consentimento é restaurado conforme a escolha, antes da primeira
  visualização de página ser enviada.
- **Given** a escolha de um visitante
  **When** ela é gravada
  **Then** vai para um cookie do domínio do site principal (`cookies-accepted`, valor `true` ou `false`,
  sem dado pessoal), lido por qualquer dos três sites; a escolha não expira por decisão do visitante, e o
  prazo do cookie é o máximo que os navegadores permitem, renovado a cada escolha.
- **Given** um endereço em que o cookie de domínio não pode ser gravado (`localhost`, pré-visualização em
  outro domínio) ou um navegador sem cookies
  **When** o visitante faz a escolha
  **Then** ela é guardada no armazenamento local do navegador e, se nem esse existir, vale só para a
  página aberta; nada quebra.

### RF-04 — Gerenciar a escolha

- **Given** qualquer página com medição configurada
  **When** o visitante usa o controle "Gerenciar cookies" do rodapé
  **Then** o banner reabre (a linha que indicava a escolha atual saiu na spec 004; os dois botões bastam), e mudar de aceitar para recusar revoga o
  consentimento, remove os cookies `_ga*` do navegador e passa a não enviar mais medição.

### RF-05 — Aviso curto e link para a política

- **Given** o banner e o rodapé de qualquer página com medição configurada
  **When** são renderizados
  **Then** o banner traz o título, o ícone de cookie e o texto curto do banner do site principal, no
  idioma da página (que há cookies para entender quais conteúdos são mais acessados e que só são
  ativados se o visitante aceitar), com o link para a política; o que o texto não diz (a ferramenta de
  medição, a retenção, os direitos e como mudar a escolha) está na política e no controle "Gerenciar
  cookies". O rodapé traz o link "Política de privacidade" e esse controle; os dois links apontam para a
  política do site principal, cujo endereço mora em um só lugar do tema.
- **Given** a versão em inglês de uma página, enquanto a política do site principal só existe em
  português
  **When** o link é renderizado
  **Then** o rótulo diz que o destino está em português; quando a versão em inglês existir, o link passa a
  apontar para ela e o rótulo extra sai.
- **Given** uma página sem medição configurada
  **When** o rodapé é renderizado
  **Then** o link da política continua presente e o controle "Gerenciar cookies" não aparece.

### RF-06 — Sem identificador, sem medição

- **Given** `PUBLIC_GA_MEASUREMENT_ID` vazio ou inválido (fora do formato `G-XXXXXXXXXX`)
  **When** o site é construído
  **Then** o HTML não contém script de medição, banner nem controle de gerenciar cookies, e o build
  não falha.
- **Given** um identificador válido
  **When** o site é construído
  **Then** o identificador aparece no HTML só depois de ser lido do ambiente, nunca escrito no código.

### RF-07 — Carregamento da medição sob consentimento

- **Given** o consentimento `analytics_storage` concedido
  **When** o script de consentimento aceita (ou restaura a escolha)
  **Then** o `gtag.js` é carregado a partir de um elemento criado pelo script externo, sem sinais de
  publicidade e com um único `page_view` por página.
- **Given** uma navegação entre páginas do mesmo site
  **When** o consentimento já foi concedido
  **Then** cada página envia exatamente um `page_view`, sem duplicar.

### RF-08 — Textos de consentimento

- **Given** os textos do banner e os rótulos de consentimento
  **When** o teste de paridade roda nas duas direções
  **Then** `pt` e `en` têm as mesmas chaves.

### RF-09 — Política de segurança de conteúdo

- **Given** o site construído com medição configurada
  **When** a verificação do build compara o HTML com a CSP documentada
  **Then** todo `script`, `style`, fonte, imagem e conexão do HTML é permitido por ela, e ela contém
  `script-src 'self'` mais apenas os domínios do Google Analytics necessários, sem `unsafe-inline`
  e sem `unsafe-eval`.
- **Given** o site construído sem medição
  **When** a mesma verificação roda
  **Then** a CSP documentada para esse caso não lista domínio externo algum.

## Requisitos não-funcionais

### RNF-01 — Sem inline

Continuam valendo as guardas de [`002-tema`](../002-tema/requirements.md) (RNF-01): nenhum `<script>` sem
`src`, nenhum `<style>`, nenhum `style=`. O banner não pode enfraquecer o `verificar-dist`; se a medição
exigir uma exceção (por exemplo, `nonce`), a spec a recusa e busca outro caminho.

### RNF-02 — Acessibilidade

O banner segue [`002-tema`](../002-tema/requirements.md) (RNF-02): contraste de 4,5:1 nos dois temas,
foco visível, alvo de toque de 44 px, sem rolagem horizontal entre 360 e 1280 px, movimento reduzido
respeitado.

### RNF-03 — Desempenho

O banner não causa deslocamento de layout (CLS abaixo de 0,1), e a página sem consentimento não
baixa o `gtag.js`. Os limites do Lighthouse CI continuam respeitados com o banner aberto, que é o caso
da primeira visita.

### RNF-04 — Privacidade por padrão

Só `analytics_storage` pode ser concedido; publicidade, `ad_user_data` e `ad_personalization` ficam
negados mesmo depois do aceite. Nenhum dado pessoal vai para o `dataLayer` além do que o GA4 coleta
sozinho, e o cookie de escolha guarda apenas `true` ou `false`.

### RNF-05 — Testes offline e determinísticos

A lógica de consentimento (ler, gravar, aplicar e revogar a escolha, escolher entre cookie, armazenamento
local e memória, validar o identificador) é uma função pura ou recebe cookie, `storage` e `gtag`
injetados, com teste unitário sem rede, sem relógio e sem navegador real; a integração é conferida pelo
build, pelo `verificar-dist` e pela verificação em navegador.

## Dependências externas

A política de privacidade e o cookie de escolha pertencem ao site principal, que este repositório não
contém. Nada disso bloqueia o desenvolvimento desta spec:

- A política é a do site principal; enquanto ela só existir em português, vale o rótulo do RF-05.
- A escolha vale nos três sites porque o cookie `cookies-accepted` é de domínio; o contrato dele é o do
  RF-03, que o `design.md` desta spec fecha.

## Perguntas em aberto

Nenhuma. O desenho do banner (RF-02) é decisão de interface e passa pelo mockup aprovado antes do
`tasks`, como manda o fluxo.

## Decisões resolvidas

1. GA4 com Consent Mode, na mesma propriedade do site principal; consentimento negado por padrão
   (2026-11-05).
2. Identificador em `PUBLIC_GA_MEASUREMENT_ID`; vazio significa nenhuma medição.
3. Script de consentimento em arquivo externo; sem `unsafe-inline` na CSP.
4. A medição não é ligada na zona inteira por produto de analytics da hospedagem: a zona também serve
   projetos que prometem não rastrear o visitante, e a medição de um site não pode alcançá-los.
5. Política de privacidade única, a do site principal, com link no banner e no rodapé; este repositório
   não tem página de política. O controlador e a retenção do GA4 são os que a política dele já declara
   (2026-11-06). Princípio DRY: toda informação sobre cookies (ferramenta, finalidade, retenção, direitos,
   como mudar a escolha) vive só na política; o banner, o rodapé e as páginas não a repetem, só apontam
   para ela.
6. A escolha não expira por decisão do visitante, como no site principal (2026-11-06).
7. A escolha vale para o domínio e os subdomínios, por cookie de domínio; o cookie `_ga` já é
   compartilhado pelo mesmo motivo (2026-11-06).
8. O banner reaproveita a estrutura do site principal (cartão fixo, fechar como recusa, "Gerenciar
   cookies" no rodapé), com "Aceitar" e "Recusar" de mesmo peso (2026-11-06). O título, o ícone e o texto do banner são os do site
   principal (2026-11-06).

## Testes

- Consentimento: estado padrão negado; aceitar concede só `analytics_storage`; recusar mantém tudo
  negado; escolha restaurada do cookie, do armazenamento local ou da memória, montados no teste; cookie
  e armazenamento que lançam erro; revogação; o cookie vence o armazenamento local quando os dois
  existem.
- Identificador: `G-ABC1234567` válido; vazio, com espaço, minúsculo e fora do formato recusados.
- Paridade dos textos de consentimento, nas duas direções, com `chavesFaltantes`.
- `verificar-dist`: HTML com medição configurada sem inline e compatível com a CSP; HTML sem medição
  sem script, banner nem controle; HTML com inline reprovado.
- Navegador real: banner a 390 e 1280 px, claro e escuro, teclado e leitor de tela (NVDA), cookies
  vazios antes do aceite e presentes depois, nenhum pedido ao Google antes do aceite, e a escolha
  feita em um site respeitada no outro depois do deploy.
