/**
 * @file Testes da validação do identificador de medição do Google Analytics 4.
 */

import { describe, expect, it } from "vitest";

import { validarIdMedicao } from "./medicao";

describe("validarIdMedicao", () => {
  it("aceita um identificador no formato G- mais dez maiúsculas ou dígitos", () => {
    expect(validarIdMedicao("G-ABC1234567")).toBe("G-ABC1234567");
    expect(validarIdMedicao("G-0123456789")).toBe("G-0123456789");
  });

  it("recusa vazio e ausente", () => {
    expect(validarIdMedicao("")).toBeUndefined();
    expect(validarIdMedicao(undefined)).toBeUndefined();
  });

  it("recusa espaço, mesmo nas pontas", () => {
    expect(validarIdMedicao("G-ABC1234567 ")).toBeUndefined();
    expect(validarIdMedicao(" G-ABC1234567")).toBeUndefined();
    expect(validarIdMedicao("G-ABC123 4567")).toBeUndefined();
    expect(validarIdMedicao("G-ABC1234567\n")).toBeUndefined();
  });

  it("recusa minúsculas, no prefixo e no corpo", () => {
    expect(validarIdMedicao("g-ABC1234567")).toBeUndefined();
    expect(validarIdMedicao("G-abc1234567")).toBeUndefined();
  });

  it("recusa identificador curto ou longo demais", () => {
    expect(validarIdMedicao("G-ABC123456")).toBeUndefined();
    expect(validarIdMedicao("G-ABC12345678")).toBeUndefined();
  });

  it("recusa outros prefixos e símbolos", () => {
    expect(validarIdMedicao("UA-12345678-1")).toBeUndefined();
    expect(validarIdMedicao("GTM-ABC1234")).toBeUndefined();
    expect(validarIdMedicao("G-ABC123456!")).toBeUndefined();
    expect(validarIdMedicao("ABC1234567")).toBeUndefined();
  });
});
