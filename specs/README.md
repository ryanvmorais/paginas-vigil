# Specs

As Páginas Vigil são construídas com spec-driven development. Cada funcionalidade é desenhada como uma spec em `specs/NNN-nome/` antes de ser implementada, conduzida por um fluxo de quatro fases com aprovação humana entre elas. As specs são Markdown puro e continuam legíveis sem nenhuma ferramenta.

## Convenções

- **Numeração:** `NNN` sequencial, três dígitos (`001`, `002`, …), na ordem em que as specs são abertas. O nome é curto e em português (`001-fundacao`).
- **Arquivos:** cada spec tem `requirements.md` (o quê e por quê), `design.md` (como) e `tasks.md` (a quebra executável). Os três levam o mesmo frontmatter: `feature`, `status`, `date`, `related`, `origin`.
- **Fases e portões:** `requirements → design → tasks → implementação`. Cada fase termina com aprovação humana explícita antes de a próxima começar.
- **Status válidos:** `rascunho` → `aprovado` → `em andamento` → `concluído`. `origin: conception` para spec escrita antes da implementação; `reverse-engineering` só para documentar algo já terminado.
- **Critério de aceite:** Given / When / Then, um item por cenário.
- **Rastreabilidade:** requisitos são `RF-NN` (funcional) e `RNF-NN` (não funcional). Cada tarefa e cada decisão de design cita o requisito que atende.
- **Idioma:** as specs são em português, como o código.
- **Interface:** spec que entrega tela traz no `design.md` o mockup aprovado (390 e 1280 px) com a decisão e o motivo.

## Como uma spec é testada

1. **A lógica tem teste unitário** (Vitest), chamando a função com entradas montadas, nunca pela página inteira.
2. **Texto e dado de teste são sintéticos**, montados no próprio teste.
3. **O portão de qualidade é a última tarefa de cada etapa**, com o resultado real registrado: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`.

## Fluxo

```text
requirements → design → tasks → implementação
```

Nenhuma fase começa sem a aprovação explícita da anterior.

| Fase           | O que acontece                                                                          |
| -------------- | --------------------------------------------------------------------------------------- |
| Requisitos     | Abre `specs/NNN-nome/` com o `requirements.md` em `rascunho`                            |
| Design         | Escreve o `design.md` depois de os requisitos serem aprovados                           |
| Tarefas        | Escreve o `tasks.md` depois de o design ser aprovado                                    |
| Implementação  | Executa as tarefas uma a uma e registra o resultado de cada portão de qualidade         |
| Acompanhamento | O `status` do frontmatter e a tabela do roadmap abaixo dizem em que fase cada spec está |

## Roadmap

Os sites não têm versão numerada: cada merge na `main` com o CI verde é uma entrega, e a coluna `entrega` fica em `—`.

| Spec                            | Escopo                                                                                                           | Entrega | Status    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------- | --------- |
| [`001-fundacao`](001-fundacao/) | workspace pnpm, tema com a paridade de idiomas, portão de qualidade, CI, cadeia de suprimentos, `main` protegida | —       | concluído |
| [`002-tema`](002-tema/)         | tokens, fontes locais, layout bilíngue e blocos de interface compartilhados pelos dois sites                     | —       | concluído |
| [`003-medicao`](003-medicao/)   | Google Analytics 4 com Consent Mode, banner de consentimento e política de segurança de conteúdo sem inline      | —       | aprovado  |

## Notas de manutenção

Invariantes frágeis que cruzam specs:

- **Nenhum script inline nas páginas.** A política de segurança de conteúdo do deploy não vai permitir `unsafe-inline`; todo script vai em arquivo externo. Origem: [`001-fundacao`](001-fundacao/requirements.md) (RNF-02).
- **`verificar-dist` no build.** O `scripts/verificar-dist.mjs` roda no `build` de cada site e falha se o HTML gerado tiver `<script>` sem `src`, `<style>` ou `style=`; o `build.inlineStylesheets: "never"` dos `astro.config.mjs` mantém o CSS em arquivo. Quem adicionar um componente precisa manter essas duas guardas. Origem: [`002-tema`](002-tema/design.md) (ADR-2).
- **Paridade de idiomas.** Todo dicionário de texto tem um teste que roda `chavesFaltantes` nas duas direções (`pt` contra `en` e `en` contra `pt`). Origem: [`001-fundacao`](001-fundacao/requirements.md) (RF-01).

## Spec-ouro

Use `001-fundacao/` como padrão de formato até existir uma spec mais completa.
