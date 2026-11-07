/**
 * @file Testes do gerador da hospedagem (`hospedagem.mjs`): `_headers`, `robots.txt` e `sitemap.xml`.
 *
 * Conferem o que a spec 006 exige (RF-02, RF-04, RF-07, RNF-04): a CSP é a de `politicaCsp` nos dois
 * modos, sem `unsafe-*` nem `*`; os limites da plataforma valem; o cache longo é só de `_astro/`; o
 * sitemap traz as duas páginas com o trio de `hreflang`; e a escrita em disco usa uma pasta temporária.
 */

import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { politicaCsp } from "./csp.mjs";
import { gerarHospedagem, montarCabecalhos, montarRobots, montarSitemap } from "./hospedagem.mjs";

const SITE = "https://exemplo.test";

// Limites do `_headers` da hospedagem: 100 regras e 2.000 caracteres por linha.
const MAX_REGRAS = 100;
const MAX_LINHA = 2000;

describe.each([false, true])("montarCabecalhos (medicao: %s)", (medicao) => {
  const texto = montarCabecalhos({ medicao });
  const linhas = texto.split("\n");

  it("traz a CSP igual à de politicaCsp", () => {
    expect(linhas).toContain(`  Content-Security-Policy: ${politicaCsp({ medicao }).cabecalho}`);
  });

  it("não tem unsafe-inline, unsafe-eval nem o curinga * como fonte", () => {
    expect(texto).not.toMatch(/unsafe-(inline|eval)/);
    const csp = politicaCsp({ medicao }).cabecalho;
    expect(csp.split(/[\s;]+/)).not.toContain("*");
  });

  it("traz os cabeçalhos de segurança de toda resposta", () => {
    for (const nome of [
      "Strict-Transport-Security",
      "X-Content-Type-Options: nosniff",
      "Referrer-Policy: no-referrer",
      "Permissions-Policy: camera=()",
      "Cross-Origin-Opener-Policy: same-origin",
      "Cross-Origin-Resource-Policy: same-origin",
    ]) {
      expect(texto).toContain(`  ${nome}`);
    }
  });

  it("usa HSTS só com max-age, sem includeSubDomains nem preload", () => {
    const hsts = linhas.find((linha) => linha.includes("Strict-Transport-Security"));
    expect(hsts).toBe("  Strict-Transport-Security: max-age=31536000");
  });

  it("põe o cache longo só em /_astro/*", () => {
    const cache = linhas.filter((linha) => linha.includes("Cache-Control"));
    expect(cache).toEqual(["  Cache-Control: public, max-age=31536000, immutable"]);
    const regra = linhas.findIndex((linha) => linha === "/_astro/*");
    expect(linhas[regra + 1]).toBe(cache[0]);
    expect(linhas.slice(0, regra)).not.toContain(cache[0]);
  });

  it("respeita os limites da plataforma", () => {
    const regras = linhas.filter((linha) => linha.startsWith("/"));
    expect(regras.length).toBeLessThanOrEqual(MAX_REGRAS);
    for (const linha of linhas) {
      expect(linha.length).toBeLessThanOrEqual(MAX_LINHA);
    }
  });

  it("termina em quebra de linha", () => {
    expect(texto.endsWith("\n")).toBe(true);
  });
});

describe("montarCabecalhos: os dois modos", () => {
  it("só a linha da CSP muda", () => {
    const sem = montarCabecalhos({ medicao: false }).split("\n");
    const com = montarCabecalhos({ medicao: true }).split("\n");
    expect(com).toHaveLength(sem.length);
    const diferentes = sem.filter((linha, i) => linha !== com[i]);
    expect(diferentes).toHaveLength(1);
    expect(diferentes[0]).toContain("Content-Security-Policy");
  });
});

describe("montarRobots", () => {
  it("libera tudo e aponta para o sitemap pelo endereço absoluto", () => {
    expect(montarRobots(SITE)).toBe(
      "User-agent: *\nAllow: /\n\nSitemap: https://exemplo.test/sitemap.xml\n",
    );
  });

  it("aceita o site com barra no fim", () => {
    expect(montarRobots(`${SITE}/`)).toContain("Sitemap: https://exemplo.test/sitemap.xml\n");
  });

  it("recusa um site que não é https", () => {
    expect(() => montarRobots("http://exemplo.test")).toThrow(/https/);
  });
});

describe("montarSitemap", () => {
  const xml = montarSitemap(SITE);
  const blocos = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1] ?? "");

  it("lista as duas versões de idioma e nada mais", () => {
    const enderecos = blocos.map((b) => b.match(/<loc>(.*?)<\/loc>/)?.[1]);
    expect(enderecos).toEqual(["https://exemplo.test/", "https://exemplo.test/en/"]);
  });

  it("repete em cada página o trio de hreflang, com endereço absoluto", () => {
    const trio = [
      '<xhtml:link rel="alternate" hreflang="pt-BR" href="https://exemplo.test/"/>',
      '<xhtml:link rel="alternate" hreflang="en" href="https://exemplo.test/en/"/>',
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://exemplo.test/en/"/>',
    ];
    for (const bloco of blocos) {
      for (const link of trio) {
        expect(bloco).toContain(link);
      }
      expect(bloco.match(/<xhtml:link/g)).toHaveLength(3);
    }
  });

  it("declara os dois espaços de nomes e não traz lastmod", () => {
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).not.toContain("lastmod");
  });

  it("começa pela declaração XML", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
  });
});

describe("gerarHospedagem", () => {
  const pastas = [];
  afterEach(async () => {
    await Promise.all(pastas.splice(0).map((p) => rm(p, { recursive: true, force: true })));
  });

  const pastaTemporaria = async () => {
    const pasta = await mkdtemp(join(tmpdir(), "hospedagem-"));
    pastas.push(pasta);
    return pasta;
  };

  it("escreve os três arquivos com o conteúdo das funções montar*", async () => {
    const pasta = await pastaTemporaria();
    const escritos = await gerarHospedagem({ pasta, site: SITE, medicao: true });

    expect(escritos).toEqual(["_headers", "robots.txt", "sitemap.xml"]);
    expect(await readFile(join(pasta, "_headers"), "utf8")).toBe(
      montarCabecalhos({ medicao: true }),
    );
    expect(await readFile(join(pasta, "robots.txt"), "utf8")).toBe(montarRobots(SITE));
    expect(await readFile(join(pasta, "sitemap.xml"), "utf8")).toBe(montarSitemap(SITE));
  });

  it("cria a pasta se ela não existe", async () => {
    const pasta = join(await pastaTemporaria(), "dist");
    await gerarHospedagem({ pasta, site: SITE, medicao: false });
    expect(await readFile(join(pasta, "robots.txt"), "utf8")).toContain("Allow: /");
  });

  it("copia a 404 em inglês, que o Astro emite em en/404/index.html, para en/404.html", async () => {
    const pasta = await pastaTemporaria();
    await mkdir(join(pasta, "en", "404"), { recursive: true });
    await writeFile(join(pasta, "en", "404", "index.html"), "<p>404</p>");

    const escritos = await gerarHospedagem({ pasta, site: SITE, medicao: false });

    expect(escritos).toContain("en/404.html");
    expect(await readFile(join(pasta, "en", "404.html"), "utf8")).toBe("<p>404</p>");
  });

  it("não inventa en/404.html quando o build não tem a página", async () => {
    const pasta = await pastaTemporaria();
    const escritos = await gerarHospedagem({ pasta, site: SITE, medicao: false });
    expect(escritos).not.toContain("en/404.html");
  });
});
