/**
 * @file Configuração do Astro da página do MailVigil.
 *
 * Site 100% estático: o build gera HTML pronto em `dist/`. `site` é o endereço canônico, usado
 * nas URLs absolutas do sitemap e das tags `canonical` e `hreflang`.
 *
 * Nada de código ou estilo inline no HTML (RNF-01 da spec 002): a política de segurança de conteúdo
 * do deploy não vai permitir `unsafe-inline`. Duas opções impedem o Astro de inserir CSS ou ativo
 * pequeno direto na página, e o `scripts/verificar-dist.mjs`, rodado no `build`, falha se algo escapar.
 */

import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mailvigil.ryanmorais.com.br",
  build: {
    // Todo CSS vira arquivo `.css` externo, por menor que seja (o padrão do Astro inlina o pequeno).
    inlineStylesheets: "never",
  },
  vite: {
    build: {
      // Nenhum ativo (fonte, imagem) vira `data:` URI embutido no CSS ou no HTML.
      assetsInlineLimit: 0,
    },
  },
});
