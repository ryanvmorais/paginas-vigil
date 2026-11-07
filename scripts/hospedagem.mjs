/**
 * @file Gera os arquivos que a hospedagem lê: `_headers`, `robots.txt` e `sitemap.xml` (spec 006).
 *
 * Roda depois do `astro build` e escreve em `dist/`, no modo de medição em que o site foi construído:
 * a CSP depende dele, e só o build sabe. O endereço vem do `site` do `astro.config.mjs` da pasta atual
 * (uma fonte só, ADR-2), e a política, de `politicaCsp` (`csp.mjs`, RNF-06). O `verificar-dist` roda em
 * seguida e confere estes arquivos contra o HTML.
 *
 * O Astro emite a 404 em português como `404.html`, mas a de `en/404.astro` como `en/404/index.html`, e a
 * hospedagem só escolhe como "404 mais próxima" um arquivo chamado `404.html`. O gerador copia a página
 * para `en/404.html`.
 *
 * Uso, a partir da pasta de um site: `node ../../scripts/hospedagem.mjs dist`. As funções `montar*` são
 * puras (recebem os dados, devolvem o texto) para poderem ser testadas sem disco.
 */

import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { medicaoValida, politicaCsp } from "./csp.mjs";

// Cabeçalhos de toda resposta que não dependem do modo (ADR-3). O HSTS vai só com `max-age`: sem
// `includeSubDomains` (afetaria o resto de ryanmorais.com.br) e sem `preload` (quase irreversível).
const CABECALHOS_FIXOS = [
  ["Strict-Transport-Security", "max-age=31536000"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "no-referrer"],
  [
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()",
  ],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  ["Cross-Origin-Resource-Policy", "same-origin"],
];

// Os arquivos de `_astro/` levam o hash no nome, então podem ficar guardados por um ano (RF-04). O
// resto (HTML, `favicon.svg`, imagens sociais) mantém o padrão da hospedagem: revalida antes de reusar.
const CACHE_LONGO = "public, max-age=31536000, immutable";

// ---------------------------------------------------------------------------
// Montagem
// Funções puras: recebem os dados e devolvem o texto de cada arquivo.
// ---------------------------------------------------------------------------

/**
 * Monta o texto do `_headers` para o modo de medição do build.
 *
 * @param {{ medicao: boolean }} modo - `medicao: true` quando o build tem identificador válido
 * @returns {string} o conteúdo do arquivo, terminado em quebra de linha
 */
export const montarCabecalhos = ({ medicao }) => {
  const todos = [
    ["Content-Security-Policy", politicaCsp({ medicao }).cabecalho],
    ...CABECALHOS_FIXOS,
  ];
  return [
    "/*",
    ...todos.map(([nome, valor]) => `  ${nome}: ${valor}`),
    "",
    "/_astro/*",
    `  Cache-Control: ${CACHE_LONGO}`,
    "",
  ].join("\n");
};

/**
 * Monta o texto do `robots.txt`.
 *
 * @param {string} site - endereço do site, como no `astro.config.mjs` (`https://exemplo.com.br`)
 * @returns {string} o conteúdo do arquivo, com o endereço absoluto do sitemap
 * @throws {Error} se o site não for `https`
 */
export const montarRobots = (site) => {
  return ["User-agent: *", "Allow: /", "", `Sitemap: ${origem(site)}/sitemap.xml`, ""].join("\n");
};

/**
 * Monta o texto do `sitemap.xml`: as duas versões de idioma da página inicial, cada uma com o trio de
 * alternativas `hreflang` que `Pagina.astro` também emite no `<head>`.
 *
 * Sem `<lastmod>`: uma data escrita à mão envelhece sozinha.
 *
 * @param {string} site - endereço do site, como no `astro.config.mjs`
 * @returns {string} o conteúdo do arquivo
 * @throws {Error} se o site não for `https`
 */
export const montarSitemap = (site) => {
  const base = origem(site);
  const paginas = [`${base}/`, `${base}/en/`];
  const alternativas = [
    ["pt-BR", `${base}/`],
    ["en", `${base}/en/`],
    ["x-default", `${base}/en/`],
  ];
  const urls = paginas.flatMap((pagina) => [
    "  <url>",
    `    <loc>${pagina}</loc>`,
    ...alternativas.map(
      ([idioma, href]) => `    <xhtml:link rel="alternate" hreflang="${idioma}" href="${href}"/>`,
    ),
    "  </url>",
  ]);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
};

/**
 * Reduz o endereço do site à origem (`https://host`), sem barra no fim, e recusa o que não é `https`.
 *
 * @param {string} site - valor do `site` do `astro.config.mjs`
 * @returns {string} a origem, pronta para receber um caminho começado por `/`
 * @throws {Error} se o endereço não for `https` ou não for uma URL
 */
const origem = (site) => {
  const url = new URL(site);
  if (url.protocol !== "https:") {
    throw new Error(`o site precisa ser https, mas é ${site}`);
  }
  return url.origin;
};

// ---------------------------------------------------------------------------
// Gravação e linha de comando
// Escreve os arquivos em `dist/` e lê o `site` e o modo de medição do build.
// ---------------------------------------------------------------------------

/**
 * Diz se um arquivo existe.
 *
 * @param {string} caminho - caminho no disco
 * @returns {Promise<boolean>} `true` se o acesso funciona
 */
const existe = async (caminho) => {
  try {
    await access(caminho);
    return true;
  } catch {
    return false;
  }
};

/**
 * Escreve em `pasta` os três arquivos da hospedagem e a cópia da 404 em inglês.
 *
 * @param {{ pasta: string, site: string, medicao: boolean }} opcoes - a pasta do build, o `site` do
 *   `astro.config.mjs` e o modo de medição do build
 * @returns {Promise<string[]>} os caminhos escritos, relativos a `pasta`
 */
export const gerarHospedagem = async ({ pasta, site, medicao }) => {
  const arquivos = [
    ["_headers", montarCabecalhos({ medicao })],
    ["robots.txt", montarRobots(site)],
    ["sitemap.xml", montarSitemap(site)],
  ];
  await mkdir(pasta, { recursive: true });
  for (const [nome, conteudo] of arquivos) {
    await writeFile(join(pasta, nome), conteudo, "utf8");
  }
  const escritos = arquivos.map(([nome]) => nome);

  const emitida = join(pasta, "en", "404", "index.html");
  if (await existe(emitida)) {
    await copyFile(emitida, join(pasta, "en", "404.html"));
    escritos.push("en/404.html");
  }
  return escritos;
};

/**
 * Ponto de entrada da linha de comando.
 *
 * @param {string[]} argumentos - argumentos depois do nome do script; o primeiro é a pasta do build
 * @returns {Promise<number>} código de saída: 0 se gerou, 2 sem a pasta
 */
const main = async (argumentos) => {
  const pasta = argumentos[0];
  if (!pasta) {
    console.error("Uso: node hospedagem.mjs <pasta-do-build>");
    return 2;
  }
  const configuracao = (await import(pathToFileURL(resolve("astro.config.mjs")).href)).default;
  const site = configuracao.site;
  if (typeof site !== "string") {
    console.error("hospedagem: o astro.config.mjs não define `site`.");
    return 1;
  }
  const medicao = medicaoValida(process.env.PUBLIC_GA_MEASUREMENT_ID);
  const escritos = await gerarHospedagem({ pasta, site, medicao });
  console.log(
    `hospedagem: ${escritos.join(", ")} em ${pasta} (${medicao ? "com" : "sem"} medição).`,
  );
  return 0;
};

// Só roda como comando; importado pelo teste, não faz nada.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await main(process.argv.slice(2));
}
