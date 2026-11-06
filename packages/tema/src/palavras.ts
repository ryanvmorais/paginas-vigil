/**
 * @file Palavras de um comando: o HTML que impede a linha de quebrar dentro de uma opção.
 *
 * O navegador quebra a linha depois de qualquer hífen, e num comando isso parte `--html` em `--` e
 * `html` ou `seu-dominio.com` em `seu-` e `dominio.com`, o que parece outro comando. Cada palavra
 * (o que fica entre espaços) vai num `<span class="palavra">`, e o CSS do componente a mantém inteira;
 * a linha só quebra nos espaços. O texto não muda: copiar o bloco devolve o mesmo comando.
 * Função pura, sem DOM, por isso testável (RF-01 da spec 005).
 */

/** Troca os caracteres que o HTML trata de modo especial, já que o resultado entra por `set:html`. */
function escaparHtml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Envolve cada palavra do comando em `<span class="palavra">`, mantendo os espaços como estão.
 *
 * @param comando - texto do comando, uma ou mais linhas
 * @returns HTML com as palavras envolvidas; sem as tags, é o `comando` original
 */
export function palavrasEmHtml(comando: string): string {
  return comando
    .split(/(\s+)/)
    .map((trecho) =>
      trecho === "" || /^\s+$/.test(trecho)
        ? trecho
        : `<span class="palavra">${escaparHtml(trecho)}</span>`,
    )
    .join("");
}
