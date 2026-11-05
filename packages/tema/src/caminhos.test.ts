/**
 * @file Testes da ajuda de idioma (`outroIdioma` e `caminhoNoIdioma`).
 */

import { describe, expect, it } from "vitest";

import { IDIOMAS } from "./idiomas";
import { caminhoNoIdioma, outroIdioma } from "./caminhos";

describe("outroIdioma", () => {
  it("devolve o inglês para o português e o português para o inglês", () => {
    expect(outroIdioma("pt")).toBe("en");
    expect(outroIdioma("en")).toBe("pt");
  });

  it("aplicada duas vezes devolve o idioma de partida", () => {
    for (const idioma of IDIOMAS) {
      expect(outroIdioma(outroIdioma(idioma))).toBe(idioma);
    }
  });
});

describe("caminhoNoIdioma", () => {
  it("leva a raiz para /en/ e /en/ para a raiz", () => {
    expect(caminhoNoIdioma("/", "en")).toBe("/en/");
    expect(caminhoNoIdioma("/en/", "pt")).toBe("/");
  });

  it("leva uma página interna entre os dois idiomas", () => {
    expect(caminhoNoIdioma("/x/", "en")).toBe("/en/x/");
    expect(caminhoNoIdioma("/en/x/", "pt")).toBe("/x/");
  });

  it("devolve sempre o caminho com barra final", () => {
    expect(caminhoNoIdioma("/x", "en")).toBe("/en/x/");
    expect(caminhoNoIdioma("/en/x", "pt")).toBe("/x/");
    expect(caminhoNoIdioma("/x", "pt")).toBe("/x/");
  });

  it("trata /en sem barra como a raiz em inglês", () => {
    expect(caminhoNoIdioma("/en", "pt")).toBe("/");
    expect(caminhoNoIdioma("/en", "en")).toBe("/en/");
  });

  it("mantém caminhos aninhados", () => {
    expect(caminhoNoIdioma("/a/b/", "en")).toBe("/en/a/b/");
    expect(caminhoNoIdioma("/en/a/b", "pt")).toBe("/a/b/");
  });

  it("só tira o prefixo quando /en é um segmento inteiro", () => {
    expect(caminhoNoIdioma("/entrada/", "pt")).toBe("/entrada/");
    expect(caminhoNoIdioma("/entrada/", "en")).toBe("/en/entrada/");
  });

  it("é idempotente: aplicar duas vezes dá o mesmo caminho", () => {
    const caminhos = ["/", "/en/", "/x", "/x/", "/en/x", "/en/x/", "/en", "/a/b"];

    for (const caminho of caminhos) {
      for (const idioma of IDIOMAS) {
        const uma = caminhoNoIdioma(caminho, idioma);
        expect(caminhoNoIdioma(uma, idioma)).toBe(uma);
      }
    }
  });

  it("volta ao caminho de partida ao ir para o outro idioma e voltar", () => {
    expect(caminhoNoIdioma(caminhoNoIdioma("/x/", "en"), "pt")).toBe("/x/");
    expect(caminhoNoIdioma(caminhoNoIdioma("/en/x/", "pt"), "en")).toBe("/en/x/");
  });
});
