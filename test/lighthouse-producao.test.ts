/**
 * @file Teste dos limites do Lighthouse de produção (spec 006, ADR-2 e ADR-8).
 *
 * O Lighthouse de produção mede o endereço real de cada site, depois do deploy, com os mesmos limites do
 * que mede o build antes dele. Este teste garante que os dois pares de arquivos não divergem (um limite
 * afrouxado só num deles passaria despercebido), que as URLs medidas são as duas páginas do `site` do
 * `astro.config.mjs` e que o Lighthouse de origem lista só as páginas indexáveis (as 404 têm `noindex` de
 * propósito, e isso reprovaria a auditoria `is-crawlable`).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const RAIZ = resolve(__dirname, "..");
const SITES = ["webvigil", "mailvigil"] as const;
const MODOS = ["mobile", "desktop"] as const;
const COMBINACOES = SITES.flatMap((site) => MODOS.map((modo) => [site, modo] as const));

/** Lê e interpreta um JSON do repositório (falha se não for JSON estrito). */
const lerJson = (caminho: string) => JSON.parse(readFileSync(resolve(RAIZ, caminho), "utf8"));

/** Lê o `site` do `astro.config.mjs` de um app, a fonte única do endereço (ADR-2). */
const lerSite = async (site: string): Promise<string> => {
  const modulo = await import(`../apps/${site}/astro.config.mjs`);
  return modulo.default.site;
};

/**
 * Limite de um teste que importa o `astro.config.mjs`: o primeiro `import` carrega o Astro inteiro e, numa
 * máquina carregada, passa dos 5 s padrão do Vitest sem que nada esteja errado.
 */
const LIMITE_IMPORTAR_CONFIG_MS = 30_000;

describe.each(COMBINACOES)("Lighthouse de produção de %s (%s)", (site, modo) => {
  const producao = lerJson(`.github/lighthouse/producao-${site}-${modo}.json`);
  const origem = lerJson(`.github/lighthouse/${site}-${modo}.json`);

  it(
    "mede as duas páginas do site, no endereço do astro.config.mjs",
    async () => {
      const endereco = new URL(await lerSite(site));
      expect(producao.ci.collect.url).toEqual([
        new URL("/", endereco).href,
        new URL("/en/", endereco).href,
      ]);
    },
    LIMITE_IMPORTAR_CONFIG_MS,
  );

  it("não mede a pasta do build: o que mede é o que está no ar", () => {
    expect(producao.ci.collect).not.toHaveProperty("staticDistDir");
  });

  it("tem as mesmas asserções do Lighthouse de origem", () => {
    expect(producao.ci.assert).toEqual(origem.ci.assert);
  });

  it("tem as mesmas medições e o mesmo formato de tela do Lighthouse de origem", () => {
    expect(producao.ci.collect.numberOfRuns).toBe(origem.ci.collect.numberOfRuns);
    expect(producao.ci.collect.settings).toEqual(origem.ci.collect.settings);
  });

  it("ignora só o robots-txt, que a CSP impede o Lighthouse de baixar (ADR-8)", () => {
    expect(producao.ci.collect.settings.skipAudits).toEqual(["robots-txt"]);
  });

  it("grava os relatórios numa pasta própria, que não colide com a de origem", () => {
    expect(producao.ci.upload).toEqual({
      target: "filesystem",
      outputDir: `.lighthouseci/producao-${site}-${modo}`,
    });
    expect(producao.ci.upload.outputDir).not.toBe(origem.ci.upload.outputDir);
  });

  it("o Lighthouse de origem lista só as duas páginas indexáveis (ADR-8)", () => {
    expect(origem.ci.collect.url).toEqual(["/index.html", "/en/index.html"]);
  });
});
