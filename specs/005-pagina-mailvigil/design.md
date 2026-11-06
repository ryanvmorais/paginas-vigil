---
feature: Página do MailVigil — revisão completa de fatos, texto, imagens, links, botões e estrutura, em português e em inglês
status: em andamento
date: 2026-11-06
related: [002-tema, 003-medicao, 004-pagina-webvigil]
origin: conception
---

# 005 — Página do MailVigil: design

## Visão geral

Quase todo o trabalho está em `apps/mailvigil` e na conferência contra a ferramenta. O tema compartilhado
(`packages/tema`) não deve mudar: a 004 já entregou o menu do celular, a seção do relatório, a escala `--fs-*`,
o bloco do comando e a verificação do HTML, e a página do MailVigil já usa tudo isso. Só uma falha objetiva do
MailVigil que o tema causa abre uma mudança nele, e então ela é conferida também no WebVigil (RF-08). As peças:

1. **Fatos:** inventário das afirmações e dos comandos, conferidos na ferramenta publicada (RF-02, RF-03).
2. **Menu:** o item "Relatório" entra na navegação (RF-06).
3. **Passos:** os comandos funcionam em ordem (RF-06), ADR-1.
4. **Saída do terminal e capturas do relatório:** regeradas pela ferramenta, nos dois idiomas (RF-07), ADR-2 e
   ADR-3.
5. **Textos:** revisão bloco a bloco, português e depois inglês (RF-04, RF-05, RF-09).
6. **Verificação:** a da 004, agora sobre as duas páginas (RNF-01, RNF-02).

A ordem do trabalho segue a dependência: primeiro os fatos e a versão consultada, porque a saída, as capturas
e os textos dependem deles; depois o menu e a saída com as capturas; por fim os textos, com a estrutura e as
imagens já no lugar, como na 004 (a quebra das linhas depende do que está na página).

## Mockup: não há interface nova

A regra do projeto pede mockup aprovado antes de qualquer código de interface. Esta spec **não propõe interface
nova**: o item "Relatório" do menu repete o padrão aprovado no mockup da 004, e o resto é conteúdo (texto,
comandos, saída e imagens) dentro dos blocos que já existem. **Se a revisão propuser mudar a interface**, a
tarefa para e abre mockup em 390 e 1280 px antes do código. O caso conhecido é o do quarto passo, que a
ADR-1 descarta justamente por exigir isso: o bloco de passos tem três colunas fixas no desktop.

## Estrutura

```text
apps/mailvigil/src/
  componentes/Vitrine.astro   # item "Relatório" no menu; imagens regeradas
  textos.ts                   # revisão dos textos e do convite ao DMARC Fácil (fase de textos)
  terminais.ts                # saída regerada, nos dois idiomas
  assets/relatorio/           # oito capturas regeradas (dois idiomas × celular/desktop × claro/escuro)
specs/005-pagina-mailvigil/
  fatos.md                    # novo: inventário das afirmações conferidas (RF-02)
```

Nenhum arquivo do tema, do `verificar-dist` ou da CSP muda por esta spec. O `verificar-dist` já roda no build
do MailVigil e confere âncoras, destinos repetidos, inline e CSP.

## Fatos

- **`fatos.md`** segue o formato do da 004: versão consultada, método, e uma tabela por assunto, cada
  afirmação com número (`F-NN`), a fonte e o resultado: confere, corrigida ou removida.
- **Versão e método:** a mais recente publicada no PyPI no momento da conferência (hoje a 1.7.0), executada de
  forma efêmera (`uvx --from mailvigil==<versão> mailvigil …`), mais o `README.md` e o `README.pt-BR.md` do
  repositório da ferramenta e a ajuda de cada comando (`--help`).
- **Afirmações a cobrir:** Python 3.12, `pipx install mailvigil`, os comandos e flags de cada passo, os formatos
  lidos, o idioma e os acentos da saída, as cinco regras e os limites, os códigos de saída (0, 3 e 4), o que
  usa a rede (só o `fetch`), os limites contra arquivos hostis, o contrato de estabilidade, o que a ferramenta
  não faz, e a licença.
- **Cada comando copiável é executado** na ordem dos passos, numa pasta de relatórios sintéticos, e o
  resultado vai para o inventário: o pacote existe, a flag existe, o comando funciona sem arquivo que nenhum
  passo cria. Isso inclui o `--config mailvigil.toml` do passo 2 (ADR-1) e o `--html` do passo 3.
- **Idioma do relatório do passo 3:** o comando em português não leva `--lang pt-BR`, então gera o relatório em
  inglês, enquanto a captura mostrada é em português. O inventário confere e a revisão decide (o comando passa
  a levar a flag ou o texto deixa de sugerir o contrário).
- **Rótulos da saída:** o inventário registra os rótulos reais do veredito (`PRONTO` e os outros dois) e das
  colunas, em cada idioma, porque o texto dos passos e o alt da captura os citam.
- **Destinos externos:** o inventário confere cada link da página (repositório e o README de cada idioma, pasta
  `docs/`, o DMARC Fácil em cada idioma, o outro produto). Um destino que ainda não existe é anotado como não
  verificável, não como erro, até o deploy.

## Menu

A navegação do MailVigil ganha `navegacao.relatorio` ("Relatório" e "Report"), na ordem da página: Como
funciona, Relatório, O que ele faz, Instalar. O `Vitrine.astro` do MailVigil passa a montar os quatro itens
como o do WebVigil. A paridade de `textos.ts` cobre a chave nova, e o `verificar-dist` confirma que o `#relatorio`
existe. O painel do celular e o menu do desktop são o mesmo componente do tema.

## Passos e comandos

O bloco de passos continua com **três passos**. A forma do passo 2 é a decisão da ADR-1, tomada na revisão do
bloco 2. Valem para os dois passos, qualquer que seja a forma:

- O comando mostrado é o que roda, na ordem, sem arquivo que nenhum passo cria.
- O passo 3 diz que o código de saída acompanha a resposta (0, 3 ou 4), e não só o do "pronto".
- Os rótulos citados no texto são os que a saída mostra no idioma da página (ADR-5).

## Saída do terminal e capturas

**Procedimento (ADR-3).** O repositório da ferramenta traz o gerador da demonstração (`docs/demo/build_demo.py`)
e o roteiro das capturas no próprio docstring: o gerador escreve relatórios agregados sintéticos de
`example.com` (um período que não está pronto e outro que está), roda `mailvigil verdict` neles e deixa a
pasta de trabalho pronta para o relatório HTML. Nada ali é dado real e todo endereço é de faixa de
documentação, então, ao contrário do scan ativo da 004, **não escreve em alvo nenhum e não pede autorização
na hora**. Para não alterar o repositório da ferramenta, o gerador roda numa cópia limpa da tag da versão
consultada, numa pasta temporária.

- **Saída do terminal (`terminais.ts`):** a saída real de `mailvigil verdict --config mailvigil.toml reports/`
  em cada idioma (`--lang pt-BR` e o padrão), tirada num terminal UTF-8, no mesmo período não pronto do
  relatório. Mostra o veredito, o motivo, o endereço e as cinco regras, com as quebras em 80 colunas que a
  própria ferramenta faz, e o código de saída. Cabe nas faixas do `terminal.css` (120 caracteres de comando e
  80 linhas), o que o build confere. Os números da página (período, mensagens, percentuais, endereço) são os
  que sairem dessa execução, e o texto se ajusta a eles, nunca o contrário.
- **Capturas do relatório:** o relatório HTML (`--html`) de cada idioma, aberto numa janela de 1024 px
  (desktop) e de 360 px (celular), a 2x, nos dois temas, cortado nas bordas do conteúdo e no fim de um bloco
  completo. Como o MailVigil não tem o primeiro achado crítico da 004, o corte é no fim do bloco das cinco
  regras ou, se couber sem estourar a largura, no do gráfico dia a dia que o `lead` descreve; o que ficar
  fora da imagem sai do `lead` e do texto alternativo na revisão. As capturas são feitas com `puppeteer-core`
  e o Chrome instalado, e o tema escuro vem de `emulateMediaFeatures` (`prefers-color-scheme: dark`), sem
  alterar o HTML do relatório.
- **Oito arquivos**, nos nomes atuais (`mail-<idioma>-<phone|wide>-<light|dark>.png`), que o `Vitrine.astro`
  já importa; `width` e `height` vêm do `ImageMetadata`. O peso fica dentro do limite do Lighthouse; se
  estourar, a conversão para WebP entra como tarefa (RNF-04).
- **Conferência cruzada:** terminal, captura, legenda e texto alternativo contam a mesma história, nos dois
  idiomas e com os mesmos números (RF-07).

## Textos

- **Revisão** bloco a bloco, em português e depois em inglês, aprovada pelo mantenedor, com o resultado
  registrado no `tasks.md`, como na 004. Os blocos são: título e descrição, topo, passos, relatório, grupos
  "O que ele responde" e "O que ele garante", limites e convite ao DMARC Fácil, chamada final, e a legenda e o
  texto alternativo das capturas.
- **Regra de termos** (ADR-5), proposta para a aprovação do mantenedor no primeiro bloco.
- **O que a revisão resolve** (do inventário): a contradição entre "roda offline" e o `fetch` (RF-03), os dois
  idiomas do passo 3 (rótulos do veredito), o código de saída do passo 3, o nome de cada conceito
  ("origem", "remetente", "fonte"), e o que o veredito mede e não mede.
- **Conteúdo novo:** só se o mantenedor pedir, item a item, e passando pelo `fatos.md` como qualquer outro
  fato (decisão herdada da 004).
- **Metadados** (RF-09): título até 60 e descrição até 160 caracteres, que o teste de `textos.test.ts` já
  confere nos dois idiomas, mais os `hreflang` e o `x-default`, conferidos no HTML gerado.

## Botões, links e menu

| Elemento                     | Destino                                                                     |
| ---------------------------- | --------------------------------------------------------------------------- |
| "Ver no GitHub" (topo)       | pt: `README.pt-BR.md` do repositório; en: o `README.md`                     |
| "Como funciona" (topo)       | `#como-funciona`                                                            |
| "Ver no GitHub" (fim)        | o mesmo do topo (repetição aceita)                                          |
| "Ler a documentação"         | pasta `docs/` do repositório (`.../tree/main/docs`)                         |
| Convite ao DMARC Fácil       | pt: `https://dmarc-facil.ryanmorais.com.br/`; en: a mesma página sob `/en/` |
| Rodapé: outro produto        | o site do WebVigil                                                          |
| Menu do desktop e do celular | `#como-funciona`, `#relatorio`, `#o-que-faz`, `#instalar`, nesta ordem      |

Os destinos já estão assim na página; a tarefa é **conferi-los**, não mudá-los (RF-06). A pasta `docs/` da
ferramenta é em inglês, e o rótulo ou o texto ao lado só diz isso se a revisão decidir (a 004 decidiu que não
precisa).

## ADRs

### ADR-1 — Passo 2 que roda como está: três passos, e a forma é decidida na revisão

- **Decisão:** manter três passos. O comando do passo 2 não pode depender de um arquivo que nenhum passo
  apresenta. A forma exata é decidida na revisão do bloco 2, com a **opção A recomendada**:
  - **A.** `mailvigil verdict --domain seu-dominio.com reports/`, que roda sem arquivo nenhum (o `--domain` é
    exigido quando não há configuração), e uma frase do passo diz que um `mailvigil.toml` opcional dá os
    nomes dos remetentes reconhecidos.
  - **B.** Manter `--config mailvigil.toml reports/`, que é o comando do README, e dizer no passo o que é o
    arquivo e como criá-lo, com o link para a seção de configuração do README.
  - **C.** Um quarto passo ("Descreva o seu domínio").
- **Porquê:** o RF-06 pede que os comandos funcionem em ordem. A opção A é a única que o faz sem texto
  adicional e sem mudar a estrutura. A B mantém o comando igual ao do README e ao do terminal da página, mas
  quem copia sem ler o texto continua recebendo erro. A C descumpre a regra de não propor interface nova: o
  bloco de passos tem `repeat(3, 1fr)` no desktop.
- **Trade-off:** com a A, o terminal da página (que usa `--config`) e o passo 2 mostram comandos diferentes; a
  legenda do terminal diz com que arquivo ele foi gerado. Sem a configuração, o veredito trata mais origens
  como não reconhecidas, o que a execução em `fatos.md` mostra antes da decisão; se o resultado sem arquivo
  não for significativo, a recomendação passa para a B.

### ADR-2 — Saída em português com acentos, como a ferramenta imprime em terminal UTF-8

- **Decisão:** a saída em português mostrada na página é a de um terminal UTF-8, com acentos (`NÃO PRONTO`,
  `não reconhecido`).
- **Alternativas:** manter a versão sem acentos que a página mostra hoje (a que a ferramenta imprime para
  um pipe ou para outra codificação).
- **Porquê:** é o que o visitante vê no terminal dele, e o relatório HTML que a página mostra ao lado também
  tem acentos; a versão sem acento é o recuo da ferramenta, não o uso normal.
- **Trade-off:** a fonte do terminal da página precisa ter os glifos acentuados (o subconjunto de
  JetBrains Mono do tema); a conferência no build, como a da moldura na 004, confirma que saem na fonte da
  página e com a largura dela. Se faltar glifo, o problema é do subconjunto de fonte do tema, e vira tarefa
  própria conferida nos dois sites.

### ADR-3 — Saída e capturas regeradas pelo gerador da ferramenta, em cópia limpa da tag

- **Decisão:** usar o gerador de relatórios sintéticos e o roteiro de captura do repositório da ferramenta,
  numa cópia da tag da versão consultada, fora do repositório dela.
- **Alternativas:** montar relatórios à mão para a página; reaproveitar as imagens do mockup.
- **Porquê:** é o procedimento que a própria ferramenta documenta, os dados são sintéticos e reproduzíveis, e a
  saída e o relatório saem da mesma execução, o que faz o terminal e a captura contarem a mesma história.
- **Trade-off:** os arquivos precisam ser regerados quando a ferramenta mudar o relatório ou a saída; a
  versão usada fica em `fatos.md` e na legenda.

### ADR-4 — Estrutura herdada da 004, sem mockup novo

- **Decisão:** o tema e a estrutura da página ficam como a 004 os deixou; só entra o item "Relatório" no menu.
- **Alternativas:** repensar a página do MailVigil (por exemplo, uma seção própria para o convite ao DMARC
  Fácil, ou o gráfico do relatório em destaque).
- **Porquê:** o requisito é revisar fatos, texto, imagens e links, e as duas páginas devem seguir uma regra só
  (RF-08). Qualquer desenho novo precisa de mockup aprovado, e nada no inventário inicial o exige.
- **Trade-off:** se o inventário completo achar falha de estrutura própria do MailVigil, a tarefa se abre
  depois, com mockup, e o custo é um PR a mais.

### ADR-5 — Regra de termos e rótulos no idioma da página

- **Decisão:** ficam em inglês as siglas e os nomes técnicos universais (DMARC, DKIM, SPF, `p=reject`,
  `DOCTYPE`, `ENTITY`, IMAP, `fetch`, os nomes de comandos e flags) e as palavras naturalizadas entre
  desenvolvedores (`issue`, `CI`, `build`); o resto vai para o português. Os **rótulos que a ferramenta emite**
  (o veredito e as respostas) aparecem no texto como a saída os mostra no idioma da página, e cada conceito
  tem um nome só ("origem", "remetente" e "fonte" não alternam).
- **Alternativas:** deixar cada bloco com o termo que a redação original usou; citar sempre o rótulo em inglês.
- **Porquê:** é a regra da 004 aplicada ao outro produto, e resolve o desencontro entre os dois idiomas do
  passo 3. A ferramenta já tem a saída nos dois idiomas, então não há razão para citar o rótulo em inglês na
  página em português.
- **Trade-off:** a regra é proposta aqui e vira definitiva só quando o mantenedor a aprova no primeiro bloco
  de texto.

## Interfaces e URLs

- Páginas: `/` (português) e `/en/` (inglês), como hoje; sem rota nova.
- Âncoras: `#como-funciona`, `#relatorio`, `#o-que-faz`, `#instalar`.
- Destinos externos: o repositório da ferramenta (README no idioma da página e pasta `docs/`), o DMARC Fácil
  em cada idioma e o outro produto.
- Sem dado, cookie ou domínio novo: a CSP (`script-src 'self'`, sem host externo sem medição) não muda.

## Impacto

- **WebVigil:** nenhum, já que o tema não muda. Se mudar, o RF-08 manda conferir a página dele.
- **Banner (003):** nenhum.
- **Testes:** a paridade de `textos.ts` cobre o rótulo novo do menu; `terminais.ts` segue com a paridade e com
  as faixas do `terminal.css`.
- **Documentação:** `specs/README.md` ganha a linha da 005. O `CLAUDE.md`, o `docs/stack.md` e os READMEs
  mudam só se algo que descrevem mudar (a lista de componentes e de scripts não muda).

## Riscos

- **A saída real difere da do mockup.** Período, contagens, percentuais e endereço podem ser outros na 1.7.0,
  e o gerador pode ter mudado. Mitigação: os números da página saem da execução, e os textos (`lead`, legenda
  e texto alternativo) se ajustam a eles.
- **Glifo acentuado ausente na fonte do terminal** (ADR-2). Mitigação: conferência no build, como a da moldura
  na 004; recuo para a versão sem acento só por decisão registrada do mantenedor.
- **Captura que não cabe no que o `lead` promete** (veredito, cinco regras e o dia a dia). Mitigação: o recorte
  é por bloco completo e o texto se ajusta ao que a imagem mostra, como na 004.
- **Sem a configuração, o veredito do passo 2 muda** (ADR-1). Mitigação: a execução em `fatos.md` antes da
  decisão do bloco 2.
- **Destinos que só existem depois do deploy** (o outro produto e, conforme o caso, o DMARC Fácil). Mitigação:
  anotados como não verificáveis no inventário; a conferência de verdade é do deploy.
- **A ferramenta publica nova versão no meio do trabalho.** Mitigação: a versão consultada fica registrada; uma
  versão nova repete a conferência dos itens que ela mudou.

## Testes

- **Mantidos:** paridade de `textos.ts` e `terminais.ts` nos dois sentidos, tamanho de título e descrição,
  `verificar-dist` (inline, `style=`, CSP, âncoras e destinos repetidos) e CSP.
- **Em navegador real** (Chrome, não headless), em 360, 390, 430, 768 e 1280 px, claro e escuro, nos dois
  idiomas e nos dois sites: layout sem corte, menu do celular com o item novo, saída do terminal com
  acentos e pista de rolagem, capturas sem margem vazia e com texto legível, bloco do comando com e sem botão,
  banner aberto e fechado.
- **Acessibilidade e desempenho:** axe-core sem violação, Tab e foco, leitor de tela (NVDA) nas páginas
  alteradas, Lighthouse CI nos limites do projeto, peso das oito capturas.
- **Fatos:** conferência manual em `fatos.md`, com a versão da ferramenta e o resultado de cada comando.
