/**
 * @file Teste do bloco de terminal: a saída não pode ser recortada no celular.
 *
 * O `<pre>` rola na horizontal, e a saída (`.saida`) é um bloco animado por `clip-path`. Um bloco só tem
 * a largura visível do `<pre>`, e o `clip-path` recorta na borda da caixa: no fim da animação o
 * `inset(0)` continua valendo, então o texto que passa da largura (e que o visitante rola para ver)
 * sumia, como se estivesse pintado de preto. A caixa tem de cobrir a linha mais larga. Este teste lê o
 * CSS do componente, porque o Vitest não renderiza a página; o corte em si só aparece num navegador
 * com a tela estreita e a saída rolada para o lado.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { saidaTerminal as saidaMailvigil } from "../apps/mailvigil/src/terminais";
import { saidaTerminal as saidaWebvigil } from "../apps/webvigil/src/terminais";
import { IDIOMAS } from "../packages/tema/src/idiomas";

const RAIZ = join(import.meta.dirname, "..");

const TERMINAL_CSS = readFileSync(
  join(RAIZ, "packages", "tema", "src", "estilos", "terminal.css"),
  "utf8",
);

/** As classes `t-*` que o `terminal.css` define. */
const CLASSES_DE_COR = [...TERMINAL_CSS.matchAll(/\.(t-[a-z]+)\b/g)].map((achado) => achado[1]);
const TERMINAL = readFileSync(
  join(RAIZ, "packages", "tema", "src", "componentes", "Terminal.astro"),
  "utf8",
);

/** As declarações da regra `.saida { ... }` do bloco `<style>` do componente. */
const regraSaida = () => {
  const estilo = TERMINAL.slice(TERMINAL.indexOf("<style>"));
  const achado = estilo.match(/\n\s*\.saida\s*\{([^}]*)\}/);
  expect(achado, "a regra .saida do <style> do Terminal.astro").not.toBeNull();
  return achado![1];
};

describe("terminal", () => {
  it("faz a caixa da saída cobrir a linha mais larga, sem ficar mais estreita que o bloco", () => {
    const regra = regraSaida();
    expect(regra).toMatch(/width:\s*max-content\s*;/);
    expect(regra).toMatch(/min-width:\s*100%\s*;/);
  });

  it.each([
    ["webvigil", saidaWebvigil],
    ["mailvigil", saidaMailvigil],
  ])("monta a saída do %s só com as tags e as cores do terminal.css", (_app, saidas) => {
    for (const idioma of IDIOMAS) {
      const saida = saidas[idioma];
      const tags = [...saida.matchAll(/<\/?([a-z]+)([^>]*)>/g)];
      expect(tags.length).toBeGreaterThan(0);

      // `set:html` põe o texto como está: só `<b>`, `<i>` e `<span class="t-…">`, sem outro atributo.
      const abertas: string[] = [];
      for (const [tag, nome = "", atributos = ""] of tags) {
        expect(["b", "i", "span"], tag).toContain(nome);
        if (tag.startsWith("</")) {
          expect(abertas.pop(), `${tag} fecha a última aberta`).toBe(nome);
          continue;
        }
        abertas.push(nome);
        if (nome !== "span") {
          expect(atributos, tag).toBe("");
          continue;
        }
        const classes = /^ class="([^"]+)"$/.exec(atributos)?.[1]?.split(" ") ?? [];
        expect(classes.length, tag).toBeGreaterThan(0);
        for (const classe of classes) expect(CLASSES_DE_COR, tag).toContain(classe);
      }
      expect(abertas, `tags sem fechar na saída em ${idioma}`).toEqual([]);
    }
  });

  it("revela a saída por `clip-path`, a animação que a caixa larga não pode deixar recortar", () => {
    // Se a animação deixar de usar `clip-path`, a regra acima pode ser revista.
    expect(TERMINAL_CSS).toMatch(/clip-path:\s*inset\(0\)/);
  });
});
