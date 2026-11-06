/**
 * @file Testes de paridade dos textos da vitrine do WebVigil entre português e inglês.
 */

import { chavesFaltantes } from "@paginas-vigil/tema/idiomas";
import { describe, expect, it } from "vitest";

import { textos } from "./textos";

describe("textos da vitrine do WebVigil", () => {
  it("tem em inglês todos os textos do português", () => {
    expect(chavesFaltantes(textos.pt, textos.en)).toEqual([]);
  });

  it("tem em português todos os textos do inglês", () => {
    expect(chavesFaltantes(textos.en, textos.pt)).toEqual([]);
  });
});
