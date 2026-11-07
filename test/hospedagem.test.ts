/**
 * @file Teste da configuração de hospedagem de cada site (spec 006, ADR-1, ADR-2).
 *
 * O `wrangler.json` de cada app é um Worker só de assets: sem `main`, servindo o `dist` do próprio app, com
 * a 404 própria, sem endereço `workers.dev` nem de pré-visualização e sem observabilidade. A rota é o
 * mesmo domínio do `site` do `astro.config.mjs` (o endereço do `canonical`, do sitemap e da conferência),
 * e o `wrangler` entra só por `npx`, nunca como dependência (RNF-03: a árvore dele derrubaria o `pnpm audit`).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const RAIZ = resolve(__dirname, "..");
const SITES = ["webvigil", "mailvigil"] as const;

/** Lê e interpreta um JSON do repositório (falha se não for JSON estrito). */
const lerJson = (caminho: string) => JSON.parse(readFileSync(resolve(RAIZ, caminho), "utf8"));

/** Lê o `site` do `astro.config.mjs` de um app, a fonte única do domínio (ADR-2). */
const lerSite = async (site: string): Promise<string> => {
  const modulo = await import(`../apps/${site}/astro.config.mjs`);
  return modulo.default.site;
};

describe.each(SITES)("wrangler.json de %s", (site) => {
  const configuracao = lerJson(`apps/${site}/wrangler.json`);

  it("é um Worker só de assets, sem main", () => {
    expect(configuracao).not.toHaveProperty("main");
    expect(configuracao.name).toBe(site);
  });

  it("usa uma data de compatibilidade válida e que já chegou", () => {
    expect(configuracao.compatibility_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const data = new Date(`${configuracao.compatibility_date}T00:00:00Z`);
    expect(Number.isNaN(data.getTime())).toBe(false);
    expect(data.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("não publica endereço workers.dev nem de pré-visualização", () => {
    expect(configuracao.workers_dev).toBe(false);
    expect(configuracao.preview_urls).toBe(false);
  });

  it("serve o dist do próprio app, com a 404 própria e a barra final automática", () => {
    expect(configuracao.assets).toEqual({
      directory: "./dist",
      not_found_handling: "404-page",
      html_handling: "auto-trailing-slash",
    });
  });

  it("deixa a observabilidade desligada", () => {
    expect(configuracao.observability).toEqual({ enabled: false });
  });

  it("tem uma só rota, de domínio personalizado, igual ao site do astro.config.mjs", async () => {
    const endereco = new URL(await lerSite(site));
    expect(configuracao.routes).toEqual([{ pattern: endereco.hostname, custom_domain: true }]);
  });
});

describe("domínios dos dois sites", () => {
  it("são distintos entre si", async () => {
    const dominios = await Promise.all(SITES.map(lerSite));
    expect(new Set(dominios).size).toBe(SITES.length);
  });
});

describe("wrangler fora das dependências", () => {
  const pacotes = [
    "package.json",
    "packages/tema/package.json",
    ...SITES.map((site) => `apps/${site}/package.json`),
  ];

  it.each(pacotes)("%s não lista o wrangler", (pacote) => {
    const manifesto = lerJson(pacote);
    for (const campo of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      expect(Object.keys(manifesto[campo] ?? {})).not.toContain("wrangler");
    }
  });
});
