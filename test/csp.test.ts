/**
 * @file Teste de costura entre o núcleo de consentimento e a política de segurança de conteúdo.
 *
 * O `gtag.js` é criado pelo script de consentimento depois do aceite, então o domínio dele nunca
 * aparece no HTML e o `verificar-dist` não o vê. Este teste fecha a lacuna: a URL que o núcleo monta
 * precisa caber no `script-src` da política com medição e não caber na sem medição (spec 003, ADR-5).
 */

import { describe, expect, it } from "vitest";

import { URL_GTAG, urlGtag } from "../packages/tema/src/consentimento";
import { politicaCsp, urlPermitida } from "../scripts/csp.mjs";

describe("CSP e o gtag.js do núcleo de consentimento", () => {
  it("com medição, o script-src aceita a URL do gtag.js", () => {
    const politica = politicaCsp({ medicao: true });
    expect(urlPermitida(politica, "script-src", URL_GTAG)).toBe(true);
    expect(urlPermitida(politica, "script-src", urlGtag("G-ABC1234567"))).toBe(true);
  });

  it("sem medição, o script-src recusa a URL do gtag.js", () => {
    const politica = politicaCsp({ medicao: false });
    expect(urlPermitida(politica, "script-src", urlGtag("G-ABC1234567"))).toBe(false);
  });
});
