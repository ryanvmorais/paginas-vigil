/**
 * @file Idiomas das páginas e a conferência de paridade dos dicionários de texto.
 *
 * Cada app guarda os textos num dicionário por idioma (`pt` na raiz, `en` em `/en/`). O que
 * impede uma página de sair com um texto faltando num dos idiomas é comparar as chaves dos dois
 * dicionários: `chavesFaltantes` faz essa comparação e serve ao teste de cada app.
 */

/** Idiomas publicados: português na raiz e inglês em `/en/`. */
export const IDIOMAS = ["pt", "en"] as const;

/** Um dos idiomas publicados. */
export type Idioma = (typeof IDIOMAS)[number];

/** Dicionário de textos: cada valor é um texto ou um subdicionário. */
export interface Dicionario {
  [chave: string]: string | Dicionario;
}

/**
 * Lista os caminhos das folhas (textos) de um dicionário, com as chaves unidas por ponto.
 *
 * @param dicionario - dicionário a percorrer
 * @param prefixo - caminho já percorrido até aqui; vazio na chamada de fora
 * @returns caminhos como `topo.titulo`, na ordem em que as chaves aparecem
 */
function caminhosDasFolhas(dicionario: Dicionario, prefixo = ""): string[] {
  return Object.entries(dicionario).flatMap(([chave, valor]) => {
    const caminho = prefixo === "" ? chave : `${prefixo}.${chave}`;
    return typeof valor === "string" ? [caminho] : caminhosDasFolhas(valor, caminho);
  });
}

/**
 * Diz se o dicionário tem um texto no caminho dado.
 *
 * @param dicionario - dicionário onde procurar
 * @param caminho - chaves unidas por ponto, como `topo.titulo`
 * @returns `true` só se o caminho termina num texto (não num subdicionário nem no vazio)
 */
function temTexto(dicionario: Dicionario, caminho: string): boolean {
  let atual: string | Dicionario | undefined = dicionario;
  for (const chave of caminho.split(".")) {
    if (typeof atual !== "object") return false;
    atual = atual[chave];
  }
  return typeof atual === "string";
}

/**
 * Compara dois dicionários e devolve os textos que o candidato não tem.
 *
 * Chave a mais no candidato não conta: a conferência existe para achar texto que falta, e o teste
 * de cada app a roda nas duas direções (`pt` contra `en` e `en` contra `pt`).
 *
 * @param referencia - dicionário que define o conjunto esperado de textos
 * @param candidato - dicionário a conferir
 * @returns caminhos presentes na referência e ausentes no candidato; vazio quando não falta nada
 */
export function chavesFaltantes(referencia: Dicionario, candidato: Dicionario): string[] {
  return caminhosDasFolhas(referencia).filter((caminho) => !temTexto(candidato, caminho));
}
