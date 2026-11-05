/**
 * @file Ajuda de idioma: troca o idioma de uma página e calcula o caminho da outra versão.
 *
 * Português vive na raiz (`/x/`) e inglês sob `/en/` (`/en/x/`). O layout e o seletor de idioma
 * precisam do caminho da mesma página no outro idioma para os links `alternate` e para o
 * seletor; são funções puras, sem DOM, rede nem estado global (RF-04).
 */

import type { Idioma } from "./idiomas";

/** Prefixo de caminho do inglês; o português não leva prefixo. */
const PREFIXO_EN = "/en";

/**
 * Devolve o outro idioma publicado.
 *
 * @param idioma - idioma atual
 * @returns `en` para `pt` e `pt` para `en`
 */
export function outroIdioma(idioma: Idioma): Idioma {
  return idioma === "pt" ? "en" : "pt";
}

/**
 * Normaliza o caminho para ter barra no começo e no fim.
 *
 * @param caminho - caminho de página, com ou sem as barras das pontas
 * @returns o caminho com as duas barras; vazio vira a raiz `/`
 */
function comBarras(caminho: string): string {
  const inicio = caminho.startsWith("/") ? caminho : `/${caminho}`;
  return inicio.endsWith("/") ? inicio : `${inicio}/`;
}

/**
 * Devolve o caminho da mesma página no idioma pedido.
 *
 * Aceita o caminho de qualquer das duas versões, com ou sem a barra final (`/`, `/en/`, `/x`,
 * `/en/x/`). O prefixo `/en` só é tirado quando é um segmento inteiro: `/entrada/` não o tem.
 *
 * @param caminho - caminho da página na versão atual
 * @param idioma - idioma em que se quer o caminho
 * @returns o caminho no idioma pedido, sempre com barra final; `pt` sem prefixo e `en` com `/en`
 */
export function caminhoNoIdioma(caminho: string, idioma: Idioma): string {
  const normalizado = comBarras(caminho);
  const base = normalizado.startsWith(`${PREFIXO_EN}/`)
    ? normalizado.slice(PREFIXO_EN.length)
    : normalizado;
  return idioma === "pt" ? base : `${PREFIXO_EN}${base}`;
}
