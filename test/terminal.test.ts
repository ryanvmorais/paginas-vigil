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

const RAIZ = join(import.meta.dirname, "..");
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

  it("revela a saída por `clip-path`, a animação que a caixa larga não pode deixar recortar", () => {
    // Se a animação deixar de usar `clip-path`, a regra acima pode ser revista.
    const css = readFileSync(
      join(RAIZ, "packages", "tema", "src", "estilos", "terminal.css"),
      "utf8",
    );
    expect(css).toMatch(/clip-path:\s*inset\(0\)/);
  });
});
