/**
 * @file Configuração do Astro da página do WebVigil.
 *
 * Site 100% estático: o build gera HTML pronto em `dist/`. `site` é o endereço canônico, usado
 * nas URLs absolutas do sitemap e das tags `canonical` e `hreflang`.
 */

import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://webvigil.ryanmorais.com.br",
});
