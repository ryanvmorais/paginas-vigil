/**
 * @file Confere o HTML que o build do Astro gerou: sem inline, com a marcação de idioma, com a medição
 * coerente e com todo recurso dentro da política de segurança de conteúdo (CSP).
 *
 * Seis regras, todas guardadas aqui para não dependerem de alguém lembrar (specs 002, 003 e 004):
 *
 * 1. **Sem inline (RNF-01).** A política de segurança de conteúdo (CSP) do deploy não vai permitir
 *    `unsafe-inline`. O Astro decide sozinho inserir um estilo ou script pequeno direto no HTML, então
 *    o verificador falha se achar `<script>` sem `src`, `<style>` ou o atributo `style=`.
 * 2. **Marcação de idioma (RF-03).** Em página que declara `hreflang`, exige `lang` no `<html>`, o
 *    `canonical`, o trio de `alternate` (`pt-BR`, `en`, `x-default`) e o `og:locale`.
 * 3. **Modo de medição coerente (RF-06).** A página tem o banner, o controle "Gerenciar Cookies" e o
 *    script de consentimento, ou não tem nenhum dos três; o banner leva um `data-medicao` válido.
 * 4. **Compatível com a CSP (RF-09).** Todo `<script src>`, `<link>` que busca recurso, `<img>` e
 *    `<source>` aponta para o próprio site ou para um domínio que `politicaCsp` do modo libera.
 * 5. **Âncoras (RF-06, spec 004).** Todo `<a href="#algo">` aponta para um `id` que existe na página.
 * 6. **Destinos dos botões (RF-06, spec 004).** Dois botões da mesma página não levam ao mesmo destino
 *    externo, salvo o par de botões primários (o "Ver no GitHub" do topo e o do fim), que repete de
 *    propósito.
 *
 * Uso, a partir da pasta de um site: `node ../../scripts/verificar-dist.mjs dist`. Sai com código 1 e
 * lista cada arquivo e problema se achar algo, ou com 0 se estiver tudo certo. A função
 * `verificarHtml` é pura (recebe o HTML, devolve os problemas) para poder ser testada sem disco.
 */

import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { politicaCsp, urlPermitida } from "./csp.mjs";

// Valores de `hreflang` que toda página bilíngue precisa declarar em `<link rel="alternate">`.
const ALTERNATES_OBRIGATORIOS = ["pt-BR", "en", "x-default"];

// Comentário HTML: o conteúdo dele não vale como marcação.
const COMENTARIO = /<!--[\s\S]*?-->/g;

// Tag de abertura. Os valores entre aspas podem conter `>` (por exemplo `alt="a > b"`), então o
// fim da tag só vale fora de aspas; por isso não basta `[^>]*`.
const TAG =
  /<([a-z][a-z0-9-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/gi;

// Comentário ou tag, o que vier primeiro. Os grupos 1 e 2 são os da `TAG` (ficam vazios no comentário).
const COMENTARIO_OU_TAG = new RegExp(`${COMENTARIO.source}|${TAG.source}`, "gi");

// Um atributo dentro do trecho de atributos de uma tag: nome e valor (aspas duplas, simples ou sem).
const ATRIBUTO = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

// Formato do identificador do GA4; é o mesmo de `validarIdMedicao` (packages/tema/src/medicao.ts),
// copiado aqui porque este script roda em Node puro, sem importar TypeScript do tema.
const FORMATO_ID_MEDICAO = /^G-[A-Z0-9]{10}$/;

// O Astro nomeia o arquivo do script pelo componente que o carrega (`Consentimento.astro_...js`).
const SCRIPT_CONSENTIMENTO = /consentimento/i;

// Diretiva da CSP que governa cada `as` de `<link rel="preload">`; o que não está aqui cai em `default-src`.
const DIRETIVA_DO_PRELOAD = {
  style: "style-src",
  script: "script-src",
  font: "font-src",
  image: "img-src",
};

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
 * Lista as tags de abertura de um HTML, ignorando o que está dentro de comentários.
 *
 * @param {string} html - documento HTML
 * @returns {{ nome: string, atributos: Map<string, string> }[]} nome da tag (minúsculo) e atributos
 */
const lerTags = (html) => {
  // Uma passada só: o comentário entra na mesma busca da tag e, quando casa, é pulado. Apagar os
  // comentários antes com `replace` poderia juntar pedaços e formar um `<!--` novo (CodeQL
  // `js/incomplete-multi-character-sanitization`).
  const tags = [];
  for (const [, nome, atributos] of html.matchAll(COMENTARIO_OU_TAG)) {
    if (nome !== undefined) {
      tags.push({ nome: nome.toLowerCase(), atributos: lerAtributos(atributos ?? "") });
    }
  }
  return tags;
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
 * Lista o que as tags mandam o navegador buscar, com a diretiva da CSP que governa cada busca.
 *
 * `<a>`, `canonical` e `alternate` não buscam nada e ficam de fora. `<source>` conta como imagem
 * (o site só o usaria dentro de `<picture>`).
 *
 * @param {{ nome: string, atributos: Map<string, string> }[]} tags - tags do documento
 * @returns {{ rotulo: string, diretiva: string, url: string }[]} um item por URL buscada
 */
const recursosBuscados = (tags) => {
  const recursos = [];
  for (const { nome, atributos } of tags) {
    const href = atributos.get("href") ?? "";
    const src = atributos.get("src") ?? "";
    if (nome === "script" && src !== "") {
      recursos.push({ rotulo: "<script src>", diretiva: "script-src", url: src });
    }
    if (nome === "link" && href !== "") {
      const rels = (atributos.get("rel") ?? "").toLowerCase().split(/\s+/);
      const alvos = [
        [rels.includes("stylesheet"), "style-src"],
        [rels.includes("modulepreload"), "script-src"],
        [rels.includes("icon") || rels.includes("apple-touch-icon"), "img-src"],
        [
          rels.includes("preload"),
          DIRETIVA_DO_PRELOAD[(atributos.get("as") ?? "").toLowerCase()] ?? "default-src",
        ],
      ];
      for (const [vale, diretiva] of alvos) {
        if (vale) recursos.push({ rotulo: `<link rel="${rels.join(" ")}">`, diretiva, url: href });
      }
    }
    if (nome === "img" || nome === "source") {
      const urls = [
        src,
        ...(atributos.get("srcset") ?? "").split(",").map((c) => c.trim().split(/\s+/)[0] ?? ""),
      ];
      for (const url of urls.filter((u) => u !== "")) {
        recursos.push({ rotulo: `<${nome}>`, diretiva: "img-src", url });
      }
    }
  }
  return recursos;
};

/**
 * Confere a coerência do modo de medição: as três peças juntas ou nenhuma.
 *
 * @param {{ nome: string, atributos: Map<string, string> }[]} tags - tags do documento
 * @returns {{ comMedicao: boolean, problemas: string[] }} se a página está no modo com medição
 *   (as três peças e um identificador válido) e o que está errado
 */
const conferirModoDeMedicao = (tags) => {
  const banner = tags.find(({ atributos }) => atributos.has("data-consentimento"));
  const pecas = {
    banner: banner !== undefined,
    controle: tags.some(({ atributos }) => atributos.has("data-gerenciar-cookies")),
    script: tags.some(
      ({ nome, atributos }) =>
        nome === "script" &&
        SCRIPT_CONSENTIMENTO.test((atributos.get("src") ?? "").split("/").pop() ?? ""),
    ),
  };
  const presentes = Object.keys(pecas).filter((peca) => pecas[peca]);
  const ausentes = Object.keys(pecas).filter((peca) => !pecas[peca]);

  if (presentes.length === 0) {
    return { comMedicao: false, problemas: [] };
  }
  if (ausentes.length > 0) {
    return {
      comMedicao: false,
      problemas: [
        `modo de medição incoerente: tem ${presentes.join(", ")}, falta ${ausentes.join(", ")} (as três peças vêm juntas ou nenhuma)`,
      ],
    };
  }
  if (!FORMATO_ID_MEDICAO.test(banner?.atributos.get("data-medicao") ?? "")) {
    return {
      comMedicao: false,
      problemas: ["banner sem data-medicao válido (G- e dez maiúsculas ou dígitos)"],
    };
  }
  return { comMedicao: true, problemas: [] };
};

/**
 * Confere que todo link interno (`href="#algo"`) aponta para um `id` que existe na página.
 *
 * `href="#"` (topo da página) e links que não começam por `#` ficam de fora.
 *
 * @param {{ nome: string, atributos: Map<string, string> }[]} tags - tags do documento
 * @returns {string[]} um texto por âncora quebrada, sem repetir a mesma âncora
 */
const conferirAncoras = (tags) => {
  const ids = new Set(tags.map(({ atributos }) => atributos.get("id")).filter(Boolean));
  const quebradas = new Set();
  for (const { nome, atributos } of tags) {
    const href = atributos.get("href") ?? "";
    if (nome === "a" && href.length > 1 && href.startsWith("#") && !ids.has(href.slice(1))) {
      quebradas.add(href);
    }
  }
  return [...quebradas].map((href) => `link interno ${href} sem alvo: nenhum elemento com esse id`);
};

/**
 * Confere que dois botões da página não levam ao mesmo destino externo.
 *
 * Botão é o `<a>` com a classe `botao` (o componente `Botao.astro`). O fragmento (`#readme`) não
 * conta como destino diferente: a página aberta é a mesma. A repetição aceita é a do topo e do fim,
 * que convida a ler o código de novo depois da leitura: dois botões primários, e só eles.
 *
 * @param {{ nome: string, atributos: Map<string, string> }[]} tags - tags do documento
 * @returns {string[]} um texto por destino repetido
 */
const conferirDestinosDosBotoes = (tags) => {
  const botoes = tags
    .filter(
      ({ nome, atributos }) =>
        nome === "a" && (atributos.get("class") ?? "").split(/\s+/).includes("botao"),
    )
    .map(({ atributos }) => ({
      destino: (atributos.get("href") ?? "").split("#")[0] ?? "",
      primario: (atributos.get("class") ?? "").split(/\s+/).includes("primario"),
    }));
  const porDestino = new Map();
  for (const botao of botoes) {
    if (/^https?:\/\//i.test(botao.destino)) {
      porDestino.set(botao.destino, [...(porDestino.get(botao.destino) ?? []), botao]);
    }
  }
  const problemas = [];
  for (const [destino, grupo] of porDestino) {
    const ehParPrimario = grupo.length === 2 && grupo.every(({ primario }) => primario);
    if (grupo.length > 1 && !ehParPrimario) {
      problemas.push(
        `${grupo.length} botões levam ao mesmo destino externo (${destino}); ` +
          "só o par de botões primários (topo e fim) pode repetir",
      );
    }
  }
  return problemas;
};

/**
 * Confere um documento HTML contra as regras de "sem inline", de medição, de CSP, de âncoras, de destinos e de marcação de idioma.
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

  // 2. Modo de medição coerente e, com ele escolhido, todo recurso dentro da CSP do modo.
  const modo = conferirModoDeMedicao(tags);
  problemas.push(...modo.problemas);
  const politica = politicaCsp({ medicao: modo.comMedicao });
  for (const { rotulo, diretiva, url } of recursosBuscados(tags)) {
    if (!urlPermitida(politica, diretiva, url)) {
      problemas.push(`${rotulo} fora da CSP (${diretiva}): ${url}`);
    }
  }

  // 3. Links e botões: âncoras com alvo e destinos externos sem repetição indevida.
  problemas.push(...conferirAncoras(tags), ...conferirDestinosDosBotoes(tags));

  // 4. Marcação de idioma: só em página que declara `hreflang` (a 404, por exemplo, não precisa).
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
