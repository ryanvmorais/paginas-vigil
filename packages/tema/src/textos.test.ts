/**
 * @file Testes de paridade dos textos do tema entre português e inglês.
 */

import { describe, expect, it } from "vitest";

import { chavesFaltantes } from "./idiomas";
import { textos } from "./textos";

describe("textos do tema", () => {
  it("tem em inglês todos os textos do português", () => {
    expect(chavesFaltantes(textos.pt, textos.en)).toEqual([]);
  });

  it("tem em português todos os textos do inglês", () => {
    expect(chavesFaltantes(textos.en, textos.pt)).toEqual([]);
  });

  it("não deixa nenhum texto vazio", () => {
    for (const idioma of ["pt", "en"] as const) {
      const vazios = JSON.stringify(textos[idioma]).includes('""');
      expect(vazios).toBe(false);
    }
  });
});
