/**
 * @file Testes da função `verificarHtml`, que confere o HTML gerado pelo build.
 *
 * Usam HTML montado aqui mesmo, sem tocar o disco do build (spec 002, seção Testes).
 */

import { describe, expect, it } from "vitest";

import { verificarHtml } from "./verificar-dist.mjs";

// Cabeça completa de uma página bilíngue: o que o `Pagina.astro` emite.
const CABECA_BILINGUE = `
  <link rel="canonical" href="https://exemplo.test/">
  <link rel="alternate" hreflang="pt-BR" href="https://exemplo.test/">
  <link rel="alternate" hreflang="en" href="https://exemplo.test/en/">
  <link rel="alternate" hreflang="x-default" href="https://exemplo.test/en/">
  <meta property="og:locale" content="pt_BR">
`;

// Monta um documento com a cabeça e o corpo dados.
const pagina = ({ lang = ' lang="pt-BR"', cabeca = "", corpo = "" } = {}) => {
  return `<!doctype html><html${lang}><head><meta charset="utf-8">${cabeca}</head><body>${corpo}</body></html>`;
};

describe("verificarHtml: sem inline (RNF-01)", () => {
  it("aceita uma página com script e estilo externos", () => {
    const html = pagina({
      cabeca:
        '<link rel="stylesheet" href="/_astro/a.css"><script type="module" src="/_astro/a.js"></script>',
    });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("recusa <script> sem src", () => {
    const html = pagina({ corpo: "<script>window.x = 1;</script>" });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("<script>")]);
  });

  it("recusa <script> sem src mesmo com outros atributos", () => {
    const html = pagina({ corpo: '<script type="module">import "/a.js";</script>' });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("<script>")]);
  });

  it("recusa <style>", () => {
    const html = pagina({ cabeca: "<style>body{margin:0}</style>" });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("<style>")]);
  });

  it("recusa o atributo style=, com aspas duplas, simples ou sem aspas", () => {
    for (const atributo of ['style="color:red"', "style='color:red'", "style=color:red"]) {
      const html = pagina({ corpo: `<p ${atributo}>oi</p>` });
      expect(verificarHtml(html)).toEqual([expect.stringContaining("style=")]);
    }
  });

  it("não confunde texto com tag: 'style=' e '<style>' escritos no conteúdo são aceitos", () => {
    const html = pagina({
      corpo:
        "<p>Escreva style=&quot;x&quot; ou &lt;style&gt; no seu CSS.</p><pre><code>&lt;script&gt;x&lt;/script&gt;</code></pre>",
    });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("não confunde um valor de atributo que contém '>' com o fim da tag", () => {
    const html = pagina({ corpo: '<img alt="a > b" src="/a.png"><p style="x">oi</p>' });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("style=")]);
  });

  it("ignora comentários HTML", () => {
    const html = pagina({ corpo: "<!-- <style>a{}</style> <script>x()</script> -->" });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("termina o comentário no primeiro -->, como o navegador, e confere o que vem depois", () => {
    const html = pagina({ corpo: "<!-- <!-- a --> <script>x()</script> -->" });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("<script>")]);
  });

  it("relata cada problema encontrado", () => {
    const html = pagina({
      cabeca: "<style>a{}</style>",
      corpo: '<script>x()</script><p style="y">z</p>',
    });
    expect(verificarHtml(html)).toHaveLength(3);
  });
});

describe("verificarHtml: marcação de idioma (RF-03)", () => {
  it("aceita uma página bilíngue completa", () => {
    expect(verificarHtml(pagina({ cabeca: CABECA_BILINGUE }))).toEqual([]);
  });

  it("não exige a marcação em página sem hreflang", () => {
    expect(verificarHtml(pagina({ lang: "" }))).toEqual([]);
  });

  it("exige lang no <html> quando há hreflang", () => {
    const html = pagina({ lang: "", cabeca: CABECA_BILINGUE });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("lang")]);
  });

  it("exige canonical", () => {
    const html = pagina({ cabeca: CABECA_BILINGUE.replace(/<link rel="canonical"[^>]*>/, "") });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("canonical")]);
  });

  it("exige cada um dos três alternate", () => {
    for (const idioma of ["pt-BR", "en", "x-default"]) {
      const cabeca = CABECA_BILINGUE.replace(
        new RegExp(`<link rel="alternate" hreflang="${idioma}"[^>]*>`),
        "",
      );
      expect(verificarHtml(pagina({ cabeca }))).toEqual([expect.stringContaining(idioma)]);
    }
  });

  it("exige og:locale", () => {
    const html = pagina({
      cabeca: CABECA_BILINGUE.replace(/<meta property="og:locale"[^>]*>/, ""),
    });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("og:locale")]);
  });

  it("vê o hreflang de um link do corpo e passa a exigir a marcação da cabeça", () => {
    const html = pagina({ corpo: '<a href="/en/" hreflang="en">EN</a>' });
    expect(verificarHtml(html).length).toBeGreaterThan(0);
  });
});
