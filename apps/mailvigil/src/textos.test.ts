/**
 * @file Testes de paridade dos textos da vitrine do MailVigil entre português e inglês.
 */

import { chavesFaltantes } from "@paginas-vigil/tema/idiomas";
import { describe, expect, it } from "vitest";

import { textos } from "./textos";

describe("textos da vitrine do MailVigil", () => {
  it("tem em inglês todos os textos do português", () => {
    expect(chavesFaltantes(textos.pt, textos.en)).toEqual([]);
  });

  it("tem em português todos os textos do inglês", () => {
    expect(chavesFaltantes(textos.en, textos.pt)).toEqual([]);
  });

  it.each(["pt", "en"] as const)(
    "mantém o título (até 60 caracteres) e a descrição (até 160) de %s",
    (idioma) => {
      const { titulo, descricao } = textos[idioma].meta;
      expect(titulo.length).toBeLessThanOrEqual(60);
      expect(descricao.length).toBeLessThanOrEqual(160);
    },
  );
});
