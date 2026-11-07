/**
 * @file Testes dos destinos da política de privacidade (`POLITICA`).
 */

import { describe, expect, it } from "vitest";

import { IDIOMAS } from "./idiomas";
import { POLITICA } from "./politica";

describe("POLITICA", () => {
  it("tem um destino para cada idioma publicado", () => {
    expect(Object.keys(POLITICA).sort()).toEqual([...IDIOMAS].sort());
  });

  it("aponta cada idioma para a política do site principal nesse idioma", () => {
    expect(POLITICA.pt.href).toBe("https://ryanmorais.com.br/politica-de-privacidade/");
    expect(POLITICA.en.href).toBe("https://ryanmorais.com.br/en/privacy-policy/");
  });

  it("não avisa 'fora do idioma' em nenhum idioma", () => {
    for (const idioma of IDIOMAS) expect(POLITICA[idioma].traduzida).toBe(true);
  });
});
