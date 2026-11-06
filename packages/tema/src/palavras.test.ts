/**
 * @file Testes de `palavrasEmHtml`: cada palavra inteira num `span`, espaços e texto preservados.
 */

import { describe, expect, it } from "vitest";

import { palavrasEmHtml } from "./palavras";

/** Tira as tags `span` e desfaz o escape, para comparar com o comando original. */
function textoDe(html: string): string {
  return html
    .replaceAll(/<\/?span[^>]*>/g, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
}

describe("palavrasEmHtml", () => {
  const comando =
    "mailvigil verdict --domain seu-dominio.com reports/ --lang pt-BR --html --output relatorio.html";

  it("mantém inteiras as opções com hífen e o domínio com hífen", () => {
    const html = palavrasEmHtml(comando);
    for (const palavra of ["--domain", "seu-dominio.com", "--html", "--output", "pt-BR"]) {
      expect(html).toContain(`<span class="palavra">${palavra}</span>`);
    }
  });

  it("não deixa hífen nem ponto fora de um span (só os espaços ficam soltos)", () => {
    const soltos = palavrasEmHtml(comando).replaceAll(/<span class="palavra">[^<]*<\/span>/g, "");
    expect(soltos).toMatch(/^ +$/);
  });

  it("devolve o mesmo texto sem as tags, para o botão de copiar e o leitor de tela", () => {
    expect(textoDe(palavrasEmHtml(comando))).toBe(comando);
  });

  it("preserva espaços repetidos e quebras de linha", () => {
    const texto = "a  b\n  c";
    expect(textoDe(palavrasEmHtml(texto))).toBe(texto);
  });

  it("escapa o que o HTML trata de modo especial", () => {
    const html = palavrasEmHtml('echo "<a&b>"');
    expect(html).toContain("&lt;a&amp;b&gt;");
    expect(html).not.toContain("<a");
    expect(textoDe(html)).toBe('echo "<a&b>"');
  });

  it("aceita texto vazio", () => {
    expect(palavrasEmHtml("")).toBe("");
  });
});
