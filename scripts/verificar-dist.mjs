/**
 * @file Confere o HTML que o build do Astro gerou: sem inline, com a marcação de idioma, com a medição
 * coerente e com todo recurso dentro da política de segurança de conteúdo (CSP).
 *
 * Oito regras (mais a da página `noindex`), todas guardadas aqui para não dependerem de alguém
 * lembrar (specs 002, 003, 004 e 006):
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
 * 7. **Marca.** Toda página bilíngue declara `og:image`, e o favicon, o `apple-touch-icon` e a imagem
 *    social que a página cita existem na pasta do build (um link para arquivo que falta só aparece
 *    quando alguém compartilha o site).
 * 8. **Hospedagem (RF-02, RF-03, RF-07, spec 006).** Na pasta do build existem `_headers`, `robots.txt`,
 *    `sitemap.xml`, `404.html` e `en/404.html`; a CSP do `_headers` é a de `politicaCsp` para o modo de
 *    medição que o HTML da página inicial mostra; o `sitemap.xml` lista só as duas páginas, com os mesmos
 *    `canonical` e `hreflang` que elas declaram; e as duas 404 levam `noindex`.
 *
 * Página com `<meta name="robots" content="noindex">` (a 404, spec 006) segue o caminho oposto
 * das regras 2 e 7: não pode ter `canonical`, `alternate` nem `og:*`; as demais regras valem como
 * em toda página.
 *
 * Uso, a partir da pasta de um site: `node ../../scripts/verificar-dist.mjs dist`. Sai com código 1 e
 * lista cada arquivo e problema se achar algo, ou com 0 se estiver tudo certo. A função
 * `verificarHtml` é pura (recebe o HTML, devolve os problemas) para poder ser testada sem disco.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { medicaoValida, politicaCsp, urlPermitida } from "./csp.mjs";

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
  if (!medicaoValida(banner?.atributos.get("data-medicao"))) {
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
 * Diz se a página pede aos buscadores que não a indexem (`<meta name="robots" content="noindex">`).
 *
 * @param {{ nome: string, atributos: Map<string, string> }[]} tags - tags do documento
 * @returns {boolean} `true` se há um `meta robots` com `noindex`
 */
const ehNoindex = (tags) => {
  return tags.some(
    ({ nome, atributos }) =>
      nome === "meta" &&
      (atributos.get("name") ?? "").toLowerCase() === "robots" &&
      (atributos.get("content") ?? "")
        .toLowerCase()
        .split(/[\s,]+/)
        .includes("noindex"),
  );
};

/**
 * Confere que uma página `noindex` não declara `canonical`, `alternate` nem `og:*`: a 404 não tem
 * versão oficial nem se compartilha, e essa marcação a apresentaria aos buscadores como uma.
 *
 * @param {{ nome: string, atributos: Map<string, string> }[]} tags - tags do documento
 * @returns {string[]} um texto por marcação indevida
 */
const conferirSemIndexacao = (tags) => {
  const problemas = [];
  for (const rel of ["canonical", "alternate"]) {
    if (temLink(tags, rel)) {
      problemas.push(`página noindex com <link rel="${rel}">`);
    }
  }
  const temOg = tags.some(
    ({ nome, atributos }) => nome === "meta" && (atributos.get("property") ?? "").startsWith("og:"),
  );
  if (temOg) {
    problemas.push('página noindex com <meta property="og:*">');
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

  // 4. Página fora dos buscadores (a 404): o contrário da marcação de idioma. Não pode ter versão
  // "oficial" nem marcação de compartilhamento, e o `hreflang` do seletor de idioma não conta.
  if (ehNoindex(tags)) {
    problemas.push(...conferirSemIndexacao(tags));
    return problemas;
  }

  // 5. Marcação de idioma: só em página que declara `hreflang`.
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
  // 7. Marca: sem `og:image` o link do site compartilhado aparece sem imagem.
  const temOgImage = tags.some(
    ({ nome, atributos }) =>
      nome === "meta" &&
      atributos.get("property") === "og:image" &&
      (atributos.get("content") ?? "") !== "",
  );
  if (!temOgImage) {
    problemas.push('falta <meta property="og:image">');
  }
  return problemas;
};

/**
 * Lista os arquivos do próprio site que a marca da página cita: favicon, `apple-touch-icon` e a imagem
 * social (`og:image`, que é uma URL absoluta; só o caminho dela importa para achar o arquivo no build).
 *
 * Ícone com `data:` ou com endereço de outro site fica de fora: não há arquivo local a conferir.
 *
 * @param {string} html - documento HTML
 * @returns {string[]} caminhos a partir da raiz do site (`/favicon.svg`), sem repetição
 */
export const arquivosDeMarca = (html) => {
  const caminhos = new Set();
  for (const { nome, atributos } of lerTags(html)) {
    const rels = (atributos.get("rel") ?? "").toLowerCase().split(/\s+/);
    const href = atributos.get("href") ?? "";
    if (
      nome === "link" &&
      (rels.includes("icon") || rels.includes("apple-touch-icon")) &&
      href.startsWith("/") &&
      !href.startsWith("//")
    ) {
      caminhos.add(href.split(/[?#]/)[0] ?? href);
    }
    if (nome === "meta" && atributos.get("property") === "og:image") {
      try {
        caminhos.add(new URL(atributos.get("content") ?? "").pathname);
      } catch {
        // URL inválida: quem acusa é a regra de `og:image` vazio, não esta.
      }
    }
  }
  return [...caminhos];
};

// ---------------------------------------------------------------------------
// Regra 8: os arquivos da hospedagem
// `_headers`, `robots.txt`, `sitemap.xml` e as duas 404, gerados por `hospedagem.mjs` (spec 006).
// ---------------------------------------------------------------------------

// Cabeçalhos que o `_headers` precisa trazer além da CSP, que tem conferência própria.
const CABECALHOS_OBRIGATORIOS = [
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
];

// Os arquivos de página que a regra 8 lê, por caminho no build.
const PAGINAS_INICIAIS = ["index.html", "en/index.html"];
const PAGINAS_404 = ["404.html", "en/404.html"];

/**
 * Lê o `canonical` e as alternativas `hreflang` que uma página declara no `<head>`.
 *
 * Só conta `<link>`: o seletor de idioma usa `<a hreflang>`, que não é declaração para buscadores.
 *
 * @param {{ nome: string, atributos: Map<string, string> }[]} tags - tags do documento
 * @returns {{ canonical: string | undefined, alternativas: Map<string, string> }} o endereço canônico
 *   e o mapa de idioma para endereço
 */
const lerDeclaracoesDeIdioma = (tags) => {
  let canonical;
  const alternativas = new Map();
  for (const { nome, atributos } of tags) {
    if (nome !== "link") continue;
    const rels = (atributos.get("rel") ?? "").toLowerCase().split(/\s+/);
    const href = atributos.get("href") ?? "";
    if (rels.includes("canonical") && href !== "") canonical = href;
    const idioma = atributos.get("hreflang");
    if (rels.includes("alternate") && idioma !== undefined && href !== "") {
      alternativas.set(idioma, href);
    }
  }
  return { canonical, alternativas };
};

/**
 * Lê as entradas `<url>` de um `sitemap.xml`: o endereço e as alternativas `xhtml:link` de cada uma.
 *
 * @param {string} sitemap - texto do arquivo
 * @returns {{ loc: string, alternativas: Map<string, string> }[]} uma entrada por `<url>`
 */
const lerEntradasDoSitemap = (sitemap) => {
  const entradas = [];
  for (const [, bloco] of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = bloco?.match(/<loc>\s*([^<]*?)\s*<\/loc>/)?.[1] ?? "";
    const alternativas = new Map();
    for (const [, trecho] of (bloco ?? "").matchAll(/<xhtml:link\b([^>]*?)\/?>/g)) {
      const atributos = lerAtributos(trecho ?? "");
      const idioma = atributos.get("hreflang");
      if (idioma !== undefined) alternativas.set(idioma, atributos.get("href") ?? "");
    }
    entradas.push({ loc, alternativas });
  }
  return entradas;
};

/**
 * Diz se dois mapas têm exatamente as mesmas chaves e valores.
 *
 * @param {Map<string, string>} a - primeiro mapa
 * @param {Map<string, string>} b - segundo mapa
 * @returns {boolean} `true` se são iguais
 */
const mapasIguais = (a, b) =>
  a.size === b.size && [...a].every(([chave, valor]) => b.get(chave) === valor);

/**
 * Confere o `sitemap.xml` contra o que as duas páginas iniciais declaram no `<head>`.
 *
 * @param {string} sitemap - texto do `sitemap.xml`
 * @param {Map<string, { canonical: string | undefined, alternativas: Map<string, string> }>} paginas -
 *   as declarações de cada página inicial, por caminho no build
 * @returns {string[]} um texto por divergência
 */
const conferirSitemap = (sitemap, paginas) => {
  const problemas = [];
  const entradas = lerEntradasDoSitemap(sitemap);
  const esperadas = new Map(
    [...paginas.values()].flatMap((p) => (p.canonical === undefined ? [] : [[p.canonical, p]])),
  );
  for (const { loc } of entradas) {
    if (!esperadas.has(loc)) {
      problemas.push(`sitemap.xml com URL fora das duas páginas: ${loc}`);
    }
  }
  for (const [canonical, pagina] of esperadas) {
    const entrada = entradas.find(({ loc }) => loc === canonical);
    if (entrada === undefined) {
      problemas.push(`sitemap.xml sem a URL ${canonical}`);
    } else if (!mapasIguais(entrada.alternativas, pagina.alternativas)) {
      problemas.push(
        `sitemap.xml: as alternativas hreflang de ${canonical} divergem das que a página declara`,
      );
    }
  }
  return problemas;
};

/**
 * Confere o `robots.txt`: libera tudo e aponta para o sitemap pelo endereço absoluto do site.
 *
 * @param {string} robots - texto do `robots.txt`
 * @param {string | undefined} origemDoSite - origem do site (`https://host`), tirada do `canonical`
 * @returns {string[]} um texto por divergência
 */
const conferirRobots = (robots, origemDoSite) => {
  const linhas = robots.split(/\r?\n/).map((linha) => linha.trim());
  const problemas = [];
  if (!linhas.includes("User-agent: *") || !linhas.includes("Allow: /")) {
    problemas.push("robots.txt sem `User-agent: *` e `Allow: /`");
  }
  if (linhas.some((linha) => /^disallow:\s*\S/i.test(linha))) {
    problemas.push("robots.txt com Disallow: o site inteiro é indexável");
  }
  if (origemDoSite !== undefined && !linhas.includes(`Sitemap: ${origemDoSite}/sitemap.xml`)) {
    problemas.push(`robots.txt sem a linha \`Sitemap: ${origemDoSite}/sitemap.xml\``);
  }
  return problemas;
};

/**
 * Confere o `_headers`: a CSP é a de `politicaCsp` do modo do build, sem `unsafe-*`, e os demais
 * cabeçalhos de segurança estão presentes.
 *
 * @param {string} cabecalhos - texto do `_headers`
 * @param {boolean} medicao - modo detectado no HTML da página inicial
 * @returns {string[]} um texto por divergência
 */
const conferirCabecalhos = (cabecalhos, medicao) => {
  const problemas = [];
  const esperada = politicaCsp({ medicao }).cabecalho;
  const linhasCsp = [
    ...cabecalhos.matchAll(/^[ \t]+Content-Security-Policy:[ \t]*(.*?)[ \t]*$/gim),
  ];
  if (linhasCsp.length !== 1) {
    problemas.push(
      `_headers com ${linhasCsp.length} linhas de Content-Security-Policy (deve ter 1)`,
    );
  } else if (linhasCsp[0]?.[1] !== esperada) {
    problemas.push(
      `_headers: a CSP difere da política ${medicao ? "com" : "sem"} medição que o HTML da página inicial pede`,
    );
  }
  if (/unsafe-(inline|eval)/i.test(cabecalhos)) {
    problemas.push("_headers com unsafe-inline ou unsafe-eval");
  }
  for (const nome of CABECALHOS_OBRIGATORIOS) {
    if (!new RegExp(`^[ \\t]+${nome}:[ \\t]*\\S`, "im").test(cabecalhos)) {
      problemas.push(`_headers sem o cabeçalho ${nome}`);
    }
  }
  return problemas;
};

/**
 * Tira a origem (`https://host`) de uma URL absoluta.
 *
 * @param {string | undefined} url - endereço absoluto, como o `canonical`
 * @returns {string | undefined} a origem, ou `undefined` se não há URL ou ela é inválida
 */
const origemDe = (url) => {
  try {
    return url === undefined ? undefined : new URL(url).origin;
  } catch {
    return undefined;
  }
};

/**
 * Regra 8: confere os arquivos da hospedagem contra o HTML do build. Função pura, sem disco.
 *
 * Falha se faltar `_headers`, `robots.txt`, `sitemap.xml` ou uma das duas 404; se a CSP do `_headers`
 * diferir de `politicaCsp` do modo detectado no HTML; se o `sitemap.xml` divergir dos `canonical` e
 * `hreflang` das duas páginas; ou se uma 404 faltar o `noindex` ou tiver `canonical`, `alternate`
 * ou `og:*`.
 *
 * @param {{ cabecalhos?: string, robots?: string, sitemap?: string, paginas: Record<string, string | undefined> }} build -
 *   o texto de cada arquivo (ausente = `undefined`) e o HTML das páginas, por caminho no build
 * @returns {string[]} um texto por problema; vazio se está tudo coerente
 */
export const verificarHospedagem = ({ cabecalhos, robots, sitemap, paginas }) => {
  const problemas = [];
  for (const [nome, texto] of [
    ["_headers", cabecalhos],
    ["robots.txt", robots],
    ["sitemap.xml", sitemap],
  ]) {
    if (texto === undefined) problemas.push(`falta ${nome}`);
  }
  for (const nome of [...PAGINAS_INICIAIS, ...PAGINAS_404]) {
    if (paginas[nome] === undefined) problemas.push(`falta ${nome}`);
  }

  const declaracoes = new Map();
  for (const nome of PAGINAS_INICIAIS) {
    const html = paginas[nome];
    if (html !== undefined) declaracoes.set(nome, lerDeclaracoesDeIdioma(lerTags(html)));
  }
  const inicio = paginas["index.html"];
  if (cabecalhos !== undefined && inicio !== undefined) {
    const medicao = conferirModoDeMedicao(lerTags(inicio)).comMedicao;
    problemas.push(...conferirCabecalhos(cabecalhos, medicao));
  }
  if (robots !== undefined) {
    const canonical = declaracoes.get("index.html")?.canonical;
    problemas.push(...conferirRobots(robots, origemDe(canonical)));
  }
  if (sitemap !== undefined) {
    problemas.push(...conferirSitemap(sitemap, declaracoes));
  }

  for (const nome of PAGINAS_404) {
    const html = paginas[nome];
    if (html === undefined) continue;
    const tags = lerTags(html);
    if (!ehNoindex(tags)) problemas.push(`${nome} sem <meta name="robots" content="noindex">`);
    problemas.push(...conferirSemIndexacao(tags).map((problema) => `${nome}: ${problema}`));
  }
  return problemas;
};

/**
 * Diz se um arquivo existe e é um arquivo comum.
 *
 * @param {string} caminho - caminho no disco
 * @returns {Promise<boolean>} `true` se existe e é arquivo
 */
const arquivoExiste = async (caminho) => {
  try {
    return (await stat(caminho)).isFile();
  } catch {
    return false;
  }
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
    const html = await readFile(join(pasta, arquivo), "utf8");
    const problemas = verificarHtml(html);
    for (const caminho of arquivosDeMarca(html)) {
      if (!(await arquivoExiste(join(pasta, caminho)))) {
        problemas.push(`a página cita ${caminho}, que não existe no build`);
      }
    }
    if (problemas.length > 0) {
      achados.push({ arquivo: join(pasta, arquivo), problemas });
    }
  }
  return achados;
};

/**
 * Lê um arquivo de texto, ou devolve `undefined` se ele não existe.
 *
 * @param {string} caminho - caminho no disco
 * @returns {Promise<string | undefined>} o conteúdo, ou `undefined` se não existe
 */
const lerSeExiste = async (caminho) => {
  try {
    return await readFile(caminho, "utf8");
  } catch {
    return undefined;
  }
};

/**
 * Aplica a regra 8 a uma pasta de build: lê os arquivos da hospedagem e as quatro páginas.
 *
 * @param {string} pasta - pasta do build (por exemplo `dist`)
 * @returns {Promise<string[]>} um texto por problema; vazio se está coerente
 */
export const verificarHospedagemPasta = async (pasta) => {
  const nomes = [...PAGINAS_INICIAIS, ...PAGINAS_404];
  const textos = await Promise.all(nomes.map((nome) => lerSeExiste(join(pasta, nome))));
  return verificarHospedagem({
    cabecalhos: await lerSeExiste(join(pasta, "_headers")),
    robots: await lerSeExiste(join(pasta, "robots.txt")),
    sitemap: await lerSeExiste(join(pasta, "sitemap.xml")),
    paginas: Object.fromEntries(nomes.map((nome, i) => [nome, textos[i]])),
  });
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
  const hospedagem = await verificarHospedagemPasta(pasta);
  if (hospedagem.length > 0) {
    achados.push({ arquivo: pasta, problemas: hospedagem });
  }
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
