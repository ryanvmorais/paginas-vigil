/**
 * @file Testes de `politicaCsp` e `urlPermitida`, a política de segurança de conteúdo do deploy.
 *
 * Conferem o que a spec 003 exige da CSP (RF-09, RNF-01): sem medição, nenhum domínio externo; com
 * medição, só o domínio do `gtag.js` para script e os hosts do Google Analytics para o resto; em
 * nenhum caso `unsafe-inline`, `unsafe-eval` ou o curinga `*` sozinho.
 */

import { describe, expect, it } from "vitest";

import { politicaCsp, urlPermitida } from "./csp.mjs";

const DIRETIVAS_FECHADAS = [
  "default-src",
  "base-uri",
  "form-action",
  "object-src",
  "frame-ancestors",
];

// Todas as fontes de todas as diretivas, de um modo, em uma lista só.
const todasAsFontes = (medicao) => Object.values(politicaCsp({ medicao }).diretivas).flat();

describe("politicaCsp: com medição", () => {
  const { diretivas } = politicaCsp({ medicao: true });

  it("libera para script só 'self' e o domínio do gtag.js", () => {
    expect(diretivas["script-src"]).toEqual(["'self'", "https://www.googletagmanager.com"]);
  });

  it("libera para imagem e conexão só hosts do Google Analytics nomeados", () => {
    const externas = [...diretivas["img-src"], ...diretivas["connect-src"]].filter((fonte) =>
      fonte.startsWith("https://"),
    );
    expect(externas.length).toBeGreaterThan(0);
    for (const fonte of externas) {
      expect(fonte).toMatch(
        /^https:\/\/(\*\.)?(google-analytics\.com|analytics\.google\.com|googletagmanager\.com)$/,
      );
    }
  });

  it("mantém estilo e fonte só do próprio site", () => {
    expect(diretivas["style-src"]).toEqual(["'self'"]);
    expect(diretivas["font-src"]).toEqual(["'self'"]);
  });
});

describe("politicaCsp: sem medição", () => {
  const { diretivas } = politicaCsp({ medicao: false });

  it("não lista domínio externo em nenhuma diretiva", () => {
    for (const fonte of todasAsFontes(false)) {
      expect(fonte).not.toMatch(/:\/\/|\*/);
    }
  });

  it("deixa o script só do próprio site e fecha a conexão", () => {
    expect(diretivas["script-src"]).toEqual(["'self'"]);
    expect(diretivas["connect-src"]).toEqual(["'none'"]);
  });

  it("mantém o data: da imagem, que o ícone vazio da página usa", () => {
    expect(diretivas["img-src"]).toEqual(["'self'", "data:"]);
  });
});

describe("politicaCsp: nos dois modos", () => {
  it.each([true, false])("nunca libera inline, eval nem curinga (medicao: %s)", (medicao) => {
    for (const fonte of todasAsFontes(medicao)) {
      expect(fonte).not.toBe("'unsafe-inline'");
      expect(fonte).not.toBe("'unsafe-eval'");
      expect(fonte).not.toBe("*");
      expect(fonte).not.toMatch(/^'(nonce|sha\d+)-/);
    }
  });

  it.each([true, false])("fecha as diretivas que não precisam de nada (medicao: %s)", (medicao) => {
    const { diretivas } = politicaCsp({ medicao });
    for (const diretiva of DIRETIVAS_FECHADAS) {
      expect(diretivas[diretiva]).toEqual(["'none'"]);
    }
  });

  it.each([true, false])(
    "monta o cabeçalho com uma entrada por diretiva (medicao: %s)",
    (medicao) => {
      const { diretivas, cabecalho } = politicaCsp({ medicao });
      const entradas = cabecalho.split("; ");
      expect(entradas).toHaveLength(Object.keys(diretivas).length);
      for (const [nome, fontes] of Object.entries(diretivas)) {
        expect(entradas).toContain(`${nome} ${fontes.join(" ")}`);
      }
      expect(cabecalho).not.toMatch(/;\s*$/);
    },
  );
});

describe("urlPermitida", () => {
  const comMedicao = politicaCsp({ medicao: true });
  const semMedicao = politicaCsp({ medicao: false });

  it("aceita caminho relativo quando a diretiva tem 'self'", () => {
    for (const url of ["/_astro/a.js", "_astro/a.js", "../a.js", "a.js?v=1"]) {
      expect(urlPermitida(semMedicao, "script-src", url)).toBe(true);
    }
  });

  it("recusa qualquer URL quando a diretiva é 'none'", () => {
    expect(urlPermitida(semMedicao, "connect-src", "/api")).toBe(false);
    expect(urlPermitida(semMedicao, "frame-ancestors", "/a")).toBe(false);
  });

  it("aceita data: só onde a diretiva o lista", () => {
    expect(urlPermitida(semMedicao, "img-src", "data:,")).toBe(true);
    expect(urlPermitida(semMedicao, "script-src", "data:text/javascript,x")).toBe(false);
  });

  it("aceita o host nomeado e recusa os outros", () => {
    const gtag = "https://www.googletagmanager.com/gtag/js?id=G-ABC1234567";
    expect(urlPermitida(comMedicao, "script-src", gtag)).toBe(true);
    expect(urlPermitida(comMedicao, "script-src", "https://cdn.exemplo.test/a.js")).toBe(false);
    expect(urlPermitida(semMedicao, "script-src", gtag)).toBe(false);
  });

  it("aceita subdomínio coberto por curinga de host, mas não o domínio sozinho nem um parecido", () => {
    expect(
      urlPermitida(comMedicao, "img-src", "https://region1.google-analytics.com/g/collect"),
    ).toBe(true);
    expect(urlPermitida(comMedicao, "img-src", "https://google-analytics.com/a.gif")).toBe(false);
    expect(
      urlPermitida(comMedicao, "img-src", "https://google-analytics.com.evil.test/a.gif"),
    ).toBe(false);
    expect(urlPermitida(comMedicao, "img-src", "https://evilgoogle-analytics.com/a.gif")).toBe(
      false,
    );
  });

  it("recusa http, //host e esquemas que não são de recurso", () => {
    expect(urlPermitida(comMedicao, "img-src", "http://region1.google-analytics.com/a.gif")).toBe(
      false,
    );
    expect(urlPermitida(semMedicao, "script-src", "//cdn.exemplo.test/a.js")).toBe(false);
    expect(urlPermitida(semMedicao, "script-src", "javascript:alert(1)")).toBe(false);
    expect(urlPermitida(semMedicao, "img-src", "blob:https://a.test/1")).toBe(false);
  });

  it("recusa URL absoluta do próprio site, que o verificador não sabe reconhecer", () => {
    expect(urlPermitida(semMedicao, "script-src", "https://webvigil.exemplo.test/a.js")).toBe(
      false,
    );
  });

  it("cai em default-src quando a diretiva não existe", () => {
    expect(urlPermitida(semMedicao, "frame-src", "/a")).toBe(false);
  });
});
