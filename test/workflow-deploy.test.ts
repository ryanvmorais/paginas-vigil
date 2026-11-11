/**
 * @file Teste do workflow de deploy (spec 006, ADR-4 e ADR-5).
 *
 * O `deploy.yml` roda a partir da `main` (`workflow_run` usa o arquivo de lá), então não há como
 * experimentá-lo antes do merge: o que o protege são estes testes e a revisão do PR. Eles leem o texto do
 * arquivo (o repositório não tem leitor de YAML, e uma dependência a mais não se justifica para isto) e
 * fixam o que, se mudasse sem querer, abriria um buraco: quem dispara o deploy, onde o segredo entra, que
 * versão da ferramenta roda e que o identificador de teste nunca vai ao ar.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { medicaoValida } from "../scripts/csp.mjs";

const RAIZ = resolve(__dirname, "..");
const lerTexto = (caminho: string) => readFileSync(resolve(RAIZ, caminho), "utf8");

const DEPLOY = lerTexto(".github/workflows/deploy.yml");
const LIGHTHOUSE = lerTexto(".github/workflows/lighthouse.yml");

/** O texto sem as linhas de comentário, para os testes não casarem com a explicação do cabeçalho. */
const SEM_COMENTARIOS = DEPLOY.split("\n")
  .filter((linha) => !linha.trimStart().startsWith("#"))
  .join("\n");

/** Divide o texto do job em passos: cada um começa numa linha `- name:` com seis espaços. */
const passos = SEM_COMENTARIOS.split(/^ {6}- name: /m).slice(1);

/** O passo cujo nome começa com `inicio`; falha se não existir. */
const passo = (inicio: string): string => {
  const achado = passos.find((texto) => texto.startsWith(inicio));
  if (!achado) throw new Error(`Passo "${inicio}" não encontrado no deploy.yml`);
  return achado;
};

/** O valor de uma variável do bloco `env:` de topo (`NOME: "valor"`). */
const variavel = (texto: string, nome: string): string | undefined =>
  new RegExp(`^ {2}${nome}: "?([^"\\n]+)"?$`, "m").exec(texto)?.[1];

describe("deploy.yml: quem dispara", () => {
  const gatilhos = /^on:\n((?: {2}.*\n|\n)+)/m.exec(SEM_COMENTARIOS)?.[1] ?? "";

  it("dispara só por workflow_run do CI na main e por workflow_dispatch", () => {
    const nomes = [...gatilhos.matchAll(/^ {2}([a-z_]+):/gm)].map((m) => m[1]);
    expect(nomes).toEqual(["workflow_run", "workflow_dispatch"]);
    expect(gatilhos).toMatch(/workflows: \[CI\]/);
    expect(gatilhos).toMatch(/types: \[completed\]/);
    expect(gatilhos).toMatch(/branches: \[main\]/);
  });

  it("nunca dispara por pull_request, pull_request_target nem push", () => {
    expect(gatilhos).not.toMatch(/pull_request/);
    expect(gatilhos).not.toMatch(/^ {2}push:/m);
  });

  it("o nome do workflow disparador é o nome do ci.yml", () => {
    expect(lerTexto(".github/workflows/ci.yml")).toMatch(/^name: CI$/m);
  });

  it("o job só roda com o CI verde, vindo de push e do próprio repositório", () => {
    const condicao = /^ {4}if: >-\n((?: {6}.*\n)+)/m.exec(SEM_COMENTARIOS)?.[1] ?? "";
    expect(condicao).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(condicao).toContain("github.event.workflow_run.event == 'push'");
    expect(condicao).toContain(
      "github.event.workflow_run.head_repository.full_name == github.repository",
    );
  });

  it("o disparo manual só vale na main", () => {
    expect(SEM_COMENTARIOS).toContain(
      "github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'",
    );
  });
});

describe("deploy.yml: permissões e segredos", () => {
  it("a permissão do workflow é só leitura do conteúdo, e nenhum job pede mais", () => {
    expect(SEM_COMENTARIOS).toMatch(/^permissions:\n {2}contents: read\n/m);
    expect(SEM_COMENTARIOS.match(/permissions:/g)).toHaveLength(1);
    expect(SEM_COMENTARIOS).not.toMatch(/: write\b/);
  });

  it("usa o ambiente producao", () => {
    expect(SEM_COMENTARIOS).toMatch(/^ {4}environment: producao$/m);
  });

  it("os segredos da Cloudflare entram só no passo que publica", () => {
    const usos = SEM_COMENTARIOS.match(/\$\{\{ secrets\.[A-Z_]+ \}\}/g) ?? [];
    expect(usos.sort()).toEqual([
      "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
      "${{ secrets.CLOUDFLARE_API_TOKEN }}",
    ]);
    const publicar = passo("Publicar na Cloudflare");
    for (const uso of usos) expect(publicar).toContain(uso);
  });

  it("o identificador de medição vem da variável do ambiente, nunca de um valor escrito", () => {
    expect(SEM_COMENTARIOS).toContain(
      "PUBLIC_GA_MEASUREMENT_ID: ${{ vars.PUBLIC_GA_MEASUREMENT_ID }}",
    );
    // Só o passo que recusa o valor de teste do CI o cita.
    const semRecusa = SEM_COMENTARIOS.replace(passo("Conferir o identificador de medição"), "");
    expect(semRecusa).not.toMatch(/G-[A-Z0-9]{10}/);
  });

  it("o checkout não deixa credencial no disco e baixa o commit que o CI aprovou", () => {
    const checkout = passo("Baixar o repositório");
    expect(checkout).toContain("persist-credentials: false");
    expect(checkout).toContain("ref: ${{ env.COMMIT }}");
    expect(SEM_COMENTARIOS).toContain(
      "COMMIT: ${{ github.event.workflow_run.head_sha || github.sha }}",
    );
  });
});

describe("deploy.yml: execução", () => {
  it("toda ação vem fixada por SHA de 40 caracteres", () => {
    const usos = [...SEM_COMENTARIOS.matchAll(/^\s+uses: (\S+)(?: #.*)?$/gm)].map((m) => m[1]);
    expect(usos.length).toBeGreaterThan(0);
    for (const uso of usos) expect(uso).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
  });

  it("roda no ubuntu-26.04 e nunca no ubuntu-latest", () => {
    expect(SEM_COMENTARIOS).toMatch(/^ {4}runs-on: ubuntu-26\.04$/m);
    expect(SEM_COMENTARIOS).not.toContain("ubuntu-latest");
  });

  it("tem limite de tempo", () => {
    expect(SEM_COMENTARIOS).toMatch(/^ {4}timeout-minutes: \d+$/m);
  });

  it("publica um site por job, e a falha de um não cancela o outro", () => {
    expect(SEM_COMENTARIOS).toMatch(/fail-fast: false/);
    expect(SEM_COMENTARIOS).toMatch(/site: \[webvigil, mailvigil\]/);
  });

  it("usa um grupo de concorrência só e não cancela o deploy em andamento", () => {
    expect(SEM_COMENTARIOS).toMatch(
      /^concurrency:\n {2}group: deploy\n {2}cancel-in-progress: false$/m,
    );
  });

  it("o wrangler tem versão fixa, vem por npx e leva o commit como mensagem", () => {
    const versao = variavel(SEM_COMENTARIOS, "WRANGLER_VERSION");
    expect(versao).toMatch(/^\d+\.\d+\.\d+$/);
    const publicar = passo("Publicar na Cloudflare");
    expect(publicar).toContain(
      "npx --yes wrangler@${{ env.WRANGLER_VERSION }} deploy --config apps/${{ matrix.site }}/wrangler.json",
    );
    expect(publicar).toContain('--message "$COMMIT"');
    expect(SEM_COMENTARIOS).not.toMatch(/wrangler@(latest|next)/);
  });

  it("o wrangler é baixado num passo sem segredo, com a mesma versão do que publica", () => {
    const baixar = passo("Baixar o wrangler");
    expect(baixar).toContain("npx --yes wrangler@${{ env.WRANGLER_VERSION }} --version");
    expect(baixar).not.toMatch(/secrets\./);
  });

  it("o npx tem a mesma carência de release do pnpm, nos dois workflows", () => {
    const minutos = Number(
      /^minimumReleaseAge: (\d+)$/m.exec(lerTexto("pnpm-workspace.yaml"))?.[1],
    );
    expect(minutos).toBeGreaterThan(0);
    const dias = String(minutos / (24 * 60));
    for (const workflow of [SEM_COMENTARIOS, LIGHTHOUSE]) {
      expect(variavel(workflow, "npm_config_min_release_age")).toBe(dias);
    }
  });

  it("o Lighthouse de produção usa a mesma versão do lighthouse.yml", () => {
    const versao = variavel(SEM_COMENTARIOS, "LHCI_VERSION");
    expect(versao).toMatch(/^\d+\.\d+\.\d+$/);
    expect(variavel(LIGHTHOUSE, "LHCI_VERSION")).toBe(versao);
    for (const nome of ["Medir o endereço real, no celular", "Medir o endereço real, no desktop"]) {
      expect(passo(nome)).toContain("npx --yes @lhci/cli@${{ env.LHCI_VERSION }} autorun");
    }
  });

  it("os limites do Lighthouse e as pastas de relatório são os de cada site e modo", () => {
    expect(passo("Medir o endereço real, no celular")).toContain(
      "--config=.github/lighthouse/producao-${{ matrix.site }}-mobile.json",
    );
    expect(passo("Medir o endereço real, no desktop")).toContain(
      "--config=.github/lighthouse/producao-${{ matrix.site }}-desktop.json",
    );
    expect(passo("Guardar os relatórios")).toContain(
      "path: .lighthouseci/producao-${{ matrix.site }}-*",
    );
  });

  it("não repete o endereço de nenhum site: ele vem do wrangler.json de cada app", () => {
    expect(SEM_COMENTARIOS).not.toContain("ryanmorais.com.br");
    for (const site of ["webvigil", "mailvigil"]) {
      expect(existsSync(resolve(RAIZ, `apps/${site}/wrangler.json`))).toBe(true);
      expect(existsSync(resolve(RAIZ, `apps/${site}/astro.config.mjs`))).toBe(true);
      expect(existsSync(resolve(RAIZ, `.github/lighthouse/producao-${site}-mobile.json`))).toBe(
        true,
      );
      expect(existsSync(resolve(RAIZ, `.github/lighthouse/producao-${site}-desktop.json`))).toBe(
        true,
      );
    }
    expect(passo("Conferir o que está no ar")).toContain(
      "node scripts/conferir-hospedagem.mjs ${{ matrix.site }}",
    );
  });
});

describe("deploy.yml: identificador de medição", () => {
  const conferir = passo("Conferir o identificador de medição");

  it("é o primeiro passo, antes de baixar qualquer coisa", () => {
    expect(passos[0]).toBe(conferir);
  });

  it("recusa o que a medição não aceita: o formato é o de medicaoValida", () => {
    const formato = /=~ \^(G-\[A-Z0-9\]\{10\})\$ \]\]/.exec(conferir)?.[1];
    expect(formato).toBeDefined();
    const regex = new RegExp(`^${formato}$`);
    for (const id of [
      "",
      "G-",
      "g-ABCDEF1234",
      "G-ABCDEF123",
      "G-ABCDEF12345",
      "UA-1234567-1",
      "G-TESTE12345",
    ]) {
      expect(regex.test(id), id).toBe(medicaoValida(id));
    }
    expect(medicaoValida("G-ABCDEF1234")).toBe(true);
  });

  it("recusa o identificador de teste do CI, que tem o formato certo", () => {
    expect(medicaoValida("G-TESTE12345")).toBe(true);
    expect(conferir).toContain('"$PUBLIC_GA_MEASUREMENT_ID" == "G-TESTE12345"');
    expect(conferir.match(/exit 1/g)).toHaveLength(2);
  });

  it("lê a variável pelo ambiente do shell, sem interpolar o valor no script", () => {
    expect(conferir).not.toContain("${{");
  });
});

describe("deploy.yml: ordem e ponta da main", () => {
  const ordem = passos.map((texto) => texto.split("\n")[0]);
  const indice = (inicio: string) => ordem.findIndex((nome) => nome.startsWith(inicio));

  it("gera o site, confere a ponta da main e só então publica, confere e mede", () => {
    expect(indice("Gerar o site")).toBeLessThan(indice("Conferir a ponta da main"));
    expect(indice("Conferir a ponta da main")).toBeLessThan(indice("Baixar o wrangler"));
    expect(indice("Baixar o wrangler")).toBeLessThan(indice("Publicar na Cloudflare"));
    expect(indice("Publicar na Cloudflare")).toBeLessThan(indice("Conferir o que está no ar"));
    expect(indice("Conferir o que está no ar")).toBeLessThan(
      indice("Medir o endereço real, no celular"),
    );
    expect(indice("Medir o endereço real, no desktop")).toBeLessThan(
      indice("Guardar os relatórios"),
    );
  });

  it("compara o commit com a ponta de refs/heads/main", () => {
    const ponta = passo("Conferir a ponta da main");
    expect(ponta).toContain("id: ponta");
    expect(ponta).toContain("refs/heads/main");
    expect(ponta).toContain('"$ponta" == "$COMMIT"');
  });

  it("baixar, publicar, conferir, medir e guardar dependem da ponta da main", () => {
    for (const inicio of [
      "Baixar o wrangler",
      "Publicar na Cloudflare",
      "Conferir o que está no ar",
      "Medir o endereço real, no celular",
      "Medir o endereço real, no desktop",
      "Guardar os relatórios",
    ]) {
      expect(passo(inicio), inicio).toContain("if: steps.ponta.outputs.atual == 'true'");
    }
  });

  it("a medição e os relatórios rodam mesmo se um passo anterior falhou, menos se cancelado", () => {
    for (const inicio of [
      "Medir o endereço real, no celular",
      "Medir o endereço real, no desktop",
      "Guardar os relatórios",
    ]) {
      expect(passo(inicio), inicio).toContain("&& !cancelled()");
    }
  });

  it("o build do site usa a variável do ambiente do job, sem valor próprio", () => {
    const gerar = passo("Gerar o site");
    expect(gerar).toContain("pnpm --filter @paginas-vigil/${{ matrix.site }} build");
    expect(gerar).not.toContain("PUBLIC_GA_MEASUREMENT_ID");
  });
});
