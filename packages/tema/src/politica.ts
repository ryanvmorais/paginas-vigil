/**
 * @file Onde mora a política de privacidade e onde a escolha de cookies é gravada.
 *
 * A política é única e fica no site principal do mantenedor: os dois sites são subdomínios dele e
 * usam a mesma propriedade do GA4, então o banner e o rodapé só apontam para ela (decisão 5 da
 * spec 003). O endereço e o domínio do cookie moram aqui, num lugar só, para o banner, o rodapé e o
 * núcleo de consentimento não divergirem (RF-05, ADR-2).
 */

import type { Idioma } from "./idiomas";

/** Destino da política de privacidade numa versão de idioma da página. */
export interface DestinoPolitica {
  /** Endereço absoluto da política. */
  href: string;
  /** `false` enquanto o destino está em outro idioma que o da página; o rótulo então avisa. */
  traduzida: boolean;
}

/**
 * Política de privacidade por idioma da página.
 *
 * Hoje só existe em português; a página em inglês aponta para ela e avisa no rótulo. Quando a
 * versão em inglês existir, troca-se o `href` de `en` e `traduzida` vira `true`.
 */
export const POLITICA: Record<Idioma, DestinoPolitica> = {
  pt: { href: "https://ryanmorais.com.br/politica-de-privacidade/", traduzida: true },
  en: { href: "https://ryanmorais.com.br/politica-de-privacidade/", traduzida: false },
};

/** Domínio do cookie da escolha: o do site principal, para valer também nos subdomínios. */
export const DOMINIO_COOKIE = ".ryanmorais.com.br";
