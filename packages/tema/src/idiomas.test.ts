/**
 * @file Testes da conferência de paridade dos dicionários (`chavesFaltantes`).
 */

import { describe, expect, it } from "vitest";

import { chavesFaltantes, IDIOMAS, type Dicionario } from "./idiomas";

describe("IDIOMAS", () => {
  it("publica português e inglês, nessa ordem", () => {
    expect(IDIOMAS).toEqual(["pt", "en"]);
  });
});

describe("chavesFaltantes", () => {
  const referencia: Dicionario = {
    topo: { titulo: "Título", apoio: "Apoio" },
    rodape: "Rodapé",
  };

  it("devolve vazio quando os dois dicionários têm os mesmos textos", () => {
    expect(chavesFaltantes(referencia, structuredClone(referencia))).toEqual([]);
  });

  it("aponta o caminho completo de um texto que falta num subdicionário", () => {
    const candidato: Dicionario = { topo: { titulo: "Title" }, rodape: "Footer" };

    expect(chavesFaltantes(referencia, candidato)).toEqual(["topo.apoio"]);
  });

  it("aponta todos os textos de um subdicionário inteiro que falta", () => {
    const candidato: Dicionario = { rodape: "Footer" };

    expect(chavesFaltantes(referencia, candidato)).toEqual(["topo.titulo", "topo.apoio"]);
  });

  it("conta como faltante o texto que no candidato virou subdicionário", () => {
    const candidato: Dicionario = { topo: { titulo: "Title", apoio: "Support" }, rodape: {} };

    expect(chavesFaltantes(referencia, candidato)).toEqual(["rodape"]);
  });

  it("ignora a chave que só existe no candidato", () => {
    const candidato: Dicionario = { ...structuredClone(referencia), extra: "Extra" };

    expect(chavesFaltantes(referencia, candidato)).toEqual([]);
  });
});
