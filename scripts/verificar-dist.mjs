/**
 * @file Confere o HTML que o build do Astro gerou: sem código ou estilo inline e com a marcação de idioma.
 *
 * Duas regras, ambas guardadas aqui para não dependerem de alguém lembrar (spec 002, ADR-2):
 *
 * 1. **Sem inline (RNF-01).** A política de segurança de conteúdo (CSP) do deploy não vai permitir
 *    `unsafe-inline`. O Astro decide sozinho inserir um estilo ou script pequeno direto no HTML, então
 *    o verificador falha se achar `<script>` sem `src`, `<style>` ou o atributo `style=`.
 * 2. **Marcação de idioma (RF-03).** Em página que declara `hreflang`, exige `lang` no `<html>`, o
 *    `canonical`, o trio de `alternate` (`pt-BR`, `en`, `x-default`) e o `og:locale`.
 *
 * Uso, a partir da pasta de um site: `node ../../scripts/verificar-dist.mjs dist`. Sai com código 1 e
 * lista cada arquivo e problema se achar algo, ou com 0 se estiver tudo certo. A função
 * `verificarHtml` é pura (recebe o HTML, devolve os problemas) para poder ser testada sem disco.
 */

import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Valores de `hreflang` que toda página bilíngue precisa declarar em `<link rel="alternate">`.
const ALTERNATES_OBRIGATORIOS = ["pt-BR", "en", "x-default"];

// Comentário HTML: o conteúdo dele não vale como marcação.
const COMENTARIO = /<!--[\s\S]*?-->/g;

// Tag de abertura. Os valores entre aspas podem conter `>` (por exemplo `alt="a > b"`), então o
// fim da tag só vale fora de aspas; por isso não basta `[^>]*`.
const TAG =
  /<([a-z][a-z0-9-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/gi;

// Um atributo dentro do trecho de atributos de uma tag: nome e valor (aspas duplas, simples ou sem).
const ATRIBUTO = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

// ---------------------------------------------------------------------------
// Leitura do HTML
// Um tokenizador pequeno basta: o Astro gera HTML bem formado, e ele evita uma dependência.
// ---------------------------------------------------------------------------

/**
 * Lê os atributos de uma tag.
 *
 * @param {string} trecho - texto dos atributos, entre o nome da tag e o `>`
 * @returns {Map<string, string>} nome do atributo (minúsculo) para o valor; vazio se não tem valor
 */
const lerAtributos = (trecho) => {
  const atributos = new Map();
  for (const [, nome, duplas, simples, semAspas] of trecho.matchAll(ATRIBUTO)) {
    atributos.set((nome ?? "").toLowerCase(), duplas ?? simples ?? semAspas ?? "");
  }
  return atributos;
};

/**
 * Lista as tags de abertura de um HTML, sem os comentários.
 *
 * @param {string} html - documento HTML
 * @returns {{ nome: string, atributos: Map<string, string> }[]} nome da tag (minúsculo) e atributos
 */
const lerTags = (html) => {
  return [...html.replace(COMENTARIO, "").matchAll(TAG)].map(([, nome, atributos]) => ({
    nome: (nome ?? "").toLowerCase(),
    atributos: lerAtributos(atributos ?? ""),
  }));
};

// ---------------------------------------------------------------------------
// Verificação
// As regras de "sem inline" (RNF-01) e de marcação de idioma (RF-03). Função pura, sem disco.
// ---------------------------------------------------------------------------

/**
 * Diz se alguma tag `<link>` tem o `rel` pedido (e, opcionalmente, o `hreflang`) e um `href`.
 *
 * @param {{ nome: string, atributos: Map<string, string> }[]} tags - tags do documento
 * @param {string} rel - valor de `rel` procurado (`canonical`, `alternate`)
 * @param {string} [hreflang] - valor de `hreflang` exigido, se houver
 * @returns {boolean} `true` se existe um `<link>` assim com `href` não vazio
 */
const temLink = (tags, rel, hreflang) => {
  return tags.some(
    ({ nome, atributos }) =>
      nome === "link" &&
      (atributos.get("rel") ?? "").toLowerCase().split(/\s+/).includes(rel) &&
      (hreflang === undefined || atributos.get("hreflang") === hreflang) &&
      (atributos.get("href") ?? "") !== "",
  );
};

/**
 * Confere um documento HTML contra as regras de "sem inline" e de marcação de idioma.
 *
 * @param {string} html - documento HTML completo
 * @returns {string[]} um texto por problema encontrado; vazio se o documento está correto
 */
export const verificarHtml = (html) => {
  const tags = lerTags(html);
  const problemas = [];

  // 1. Sem inline: nada de código, regra ou atributo de estilo direto no HTML.
  for (const { nome, atributos } of tags) {
    if (nome === "script" && !atributos.has("src")) {
      problemas.push("<script> sem src (código inline)");
    }
    if (nome === "style") {
      problemas.push("<style> (estilo inline)");
    }
    if (atributos.has("style")) {
      problemas.push(`atributo style= na tag <${nome}> (estilo inline)`);
    }
  }

  // 2. Marcação de idioma: só em página que declara `hreflang` (a 404, por exemplo, não precisa).
  if (!tags.some(({ atributos }) => atributos.has("hreflang"))) {
    return problemas;
  }
  if (
    !tags.some(({ nome, atributos }) => nome === "html" && (atributos.get("lang") ?? "") !== "")
  ) {
    problemas.push("falta lang no <html>");
  }
  if (!temLink(tags, "canonical")) {
    problemas.push('falta <link rel="canonical">');
  }
  for (const idioma of ALTERNATES_OBRIGATORIOS) {
    if (!temLink(tags, "alternate", idioma)) {
      problemas.push(`falta <link rel="alternate" hreflang="${idioma}">`);
    }
  }
  const temOgLocale = tags.some(
    ({ nome, atributos }) =>
      nome === "meta" &&
      atributos.get("property") === "og:locale" &&
      (atributos.get("content") ?? "") !== "",
  );
  if (!temOgLocale) {
    problemas.push('falta <meta property="og:locale">');
  }
  return problemas;
};

// ---------------------------------------------------------------------------
// Linha de comando
// Varre a pasta do build, imprime os problemas e define o código de saída.
// ---------------------------------------------------------------------------

/**
 * Confere todos os `.html` de uma pasta de build, em qualquer profundidade.
 *
 * @param {string} pasta - pasta do build (por exemplo `dist`)
 * @returns {Promise<{ arquivo: string, problemas: string[] }[]>} um item por arquivo com problema;
 *   se a pasta não tem nenhum `.html`, um único item avisando (build vazio é build quebrado)
 */
export const verificarPasta = async (pasta) => {
  const arquivos = (await readdir(pasta, { recursive: true }))
    .filter((arquivo) => arquivo.endsWith(".html"))
    .sort();
  if (arquivos.length === 0) {
    return [{ arquivo: pasta, problemas: ["nenhum arquivo .html encontrado"] }];
  }
  const achados = [];
  for (const arquivo of arquivos) {
    const problemas = verificarHtml(await readFile(join(pasta, arquivo), "utf8"));
    if (problemas.length > 0) {
      achados.push({ arquivo: join(pasta, arquivo), problemas });
    }
  }
  return achados;
};

/**
 * Ponto de entrada da linha de comando.
 *
 * @param {string[]} argumentos - argumentos depois do nome do script; o primeiro é a pasta do build
 * @returns {Promise<number>} código de saída: 0 sem problemas, 1 com problemas, 2 sem a pasta
 */
const main = async (argumentos) => {
  const pasta = argumentos[0];
  if (!pasta) {
    console.error("Uso: node verificar-dist.mjs <pasta-do-build>");
    return 2;
  }
  const achados = await verificarPasta(pasta);
  for (const { arquivo, problemas } of achados) {
    for (const problema of problemas) {
      console.error(`${arquivo}: ${problema}`);
    }
  }
  if (achados.length > 0) {
    console.error(`verificar-dist: ${achados.length} arquivo(s) com problema.`);
    return 1;
  }
  console.log(`verificar-dist: ${pasta} sem problemas.`);
  return 0;
};

// Só roda como comando; importado pelo teste, não faz nada.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await main(process.argv.slice(2));
}
