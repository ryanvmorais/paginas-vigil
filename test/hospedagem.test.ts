/**
 * @file Teste da configuração de hospedagem de cada site (spec 006, ADR-1, ADR-2).
 *
 * O `wrangler.json` de cada app é um Worker só de assets: sem `main`, servindo o `dist` do próprio app, com
 * a 404 própria, sem endereço `workers.dev` nem de pré-visualização e sem observabilidade. A rota é o
 * mesmo domínio do `site` do `astro.config.mjs` (o endereço do `canonical`, do sitemap e da conferência),
 * e o `wrangler` entra só por `npx`, nunca como dependência (RNF-03: a árvore dele derrubaria o `pnpm audit`).
 *
 * O `security.txt` de cada site (`public/.well-known/`) tem os campos da RFC 9116, o `Canonical` no domínio
 * do `site` e um `Expires` que o teste obriga a renovar um mês antes de vencer.
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

/**
 * Limite de um teste que importa o `astro.config.mjs`: o primeiro `import` carrega o Astro inteiro e, numa
 * máquina carregada, passa dos 5 s padrão do Vitest sem que nada esteja errado.
 */
const LIMITE_IMPORTAR_CONFIG_MS = 30_000;

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

  it(
    "tem uma só rota, de domínio personalizado, igual ao site do astro.config.mjs",
    async () => {
      const endereco = new URL(await lerSite(site));
      expect(configuracao.routes).toEqual([{ pattern: endereco.hostname, custom_domain: true }]);
    },
    LIMITE_IMPORTAR_CONFIG_MS,
  );
});

describe("domínios dos dois sites", () => {
  it(
    "são distintos entre si",
    async () => {
      const dominios = await Promise.all(SITES.map(lerSite));
      expect(new Set(dominios).size).toBe(SITES.length);
    },
    LIMITE_IMPORTAR_CONFIG_MS,
  );
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

// O `Expires` do security.txt é obrigatório (RFC 9116, 2.5.5) e vence: este prazo deixa o portão
// vermelho um mês antes, com tempo de renovar sem o arquivo passar a valer como vencido.
const AVISO_EXPIRES_DIAS = 30;
// A RFC recomenda `Expires` a menos de um ano; a folga de um dia cobre a renovação no dia exato.
const MAXIMO_EXPIRES_DIAS = 366;
const DIA_MS = 24 * 60 * 60 * 1000;

describe.each(SITES)("security.txt de %s", (site) => {
  /** Os valores de cada campo do arquivo, sem os comentários. */
  const campos = new Map<string, string[]>();
  const texto = readFileSync(resolve(RAIZ, `apps/${site}/public/.well-known/security.txt`), "utf8");
  for (const linha of texto.split("\n")) {
    const casou = /^([A-Za-z-]+): (.+)$/.exec(linha);
    if (casou?.[1] !== undefined && casou[2] !== undefined) {
      campos.set(casou[1], [...(campos.get(casou[1]) ?? []), casou[2]]);
    }
  }

  it("tem Contact https, Policy e Preferred-Languages, e um Expires só", () => {
    const contatos = campos.get("Contact") ?? [];
    expect(contatos.length).toBeGreaterThan(0);
    for (const contato of contatos) expect(contato).toMatch(/^https:\/\//);
    expect(campos.get("Policy")).toHaveLength(1);
    expect(campos.get("Preferred-Languages")).toEqual(["pt, en"]);
    expect(campos.get("Expires")).toHaveLength(1);
  });

  it(
    "o Canonical é o endereço do site do astro.config.mjs",
    async () => {
      expect(campos.get("Canonical")).toEqual([`${await lerSite(site)}/.well-known/security.txt`]);
    },
    LIMITE_IMPORTAR_CONFIG_MS,
  );

  it(`o Expires vale por mais ${AVISO_EXPIRES_DIAS} dias e por menos de um ano`, () => {
    const expira = campos.get("Expires")?.[0] ?? "";
    expect(expira).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
    const restam = (Date.parse(expira) - Date.now()) / DIA_MS;
    expect(restam, "Expires perto de vencer: renove para até um ano à frente").toBeGreaterThan(
      AVISO_EXPIRES_DIAS,
    );
    expect(restam, "Expires a mais de um ano (RFC 9116, 2.5.5)").toBeLessThanOrEqual(
      MAXIMO_EXPIRES_DIAS,
    );
  });
});
