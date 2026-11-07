/**
 * @file Teste da marca dos dois sites: favicon, `apple-touch-icon` e imagem social.
 *
 * O traçado do logo existe em dois lugares por app (o `Logo.astro` do cabeçalho e o `favicon.svg` de
 * `public/`) e é o mesmo dos SVGs oficiais das ferramentas. Sem um teste que os compare, um deles
 * envelhece sozinho. As imagens têm dimensões fixas: a imagem social declara 1280 x 640 no layout, e
 * as redes recortam ou recusam o que foge disso.
 */

import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const RAIZ = join(import.meta.dirname, "..");
const APPS = ["webvigil", "mailvigil"] as const;
const IDIOMAS = ["pt", "en"] as const;

// Menos de 1 MB: o limite que o GitHub e as redes aceitam para a imagem de compartilhamento.
const LIMITE_IMAGEM_SOCIAL = 1024 * 1024;

const ler = (...partes: string[]) => readFileSync(join(RAIZ, ...partes));
const texto = (...partes: string[]) => ler(...partes).toString("utf8");

/** Largura e altura de um PNG, lidas do cabeçalho `IHDR` (bytes 16 a 23). */
const dimensoesPng = (conteudo: Buffer) => ({
  largura: conteudo.readUInt32BE(16),
  altura: conteudo.readUInt32BE(20),
});

/** Valor do atributo `d` de todo `<path>` de um trecho de SVG ou `.astro`. */
const tracados = (fonte: string) =>
  [...fonte.matchAll(/<path\b[^>]*?\sd="([^"]+)"/g)].map((achado) => achado[1]);

describe.each(APPS)("marca do %s", (app) => {
  const favicon = texto("apps", app, "public", "favicon.svg");
  const logo = texto("apps", app, "src", "componentes", "Logo.astro");

  it("tem o favicon com um só traçado, igual ao do logo do cabeçalho", () => {
    expect(tracados(favicon)).toHaveLength(1);
    expect(tracados(favicon)).toEqual(tracados(logo));
  });

  it("monta o favicon com evenodd e sem máscara nem recorte", () => {
    expect(favicon).toContain('fill-rule="evenodd"');
    expect(favicon).not.toMatch(/<(mask|clipPath)\b/);
  });

  it("troca a cor do favicon pelo tema do sistema", () => {
    expect(favicon).toMatch(/prefers-color-scheme:\s*dark/);
  });

  it("tem o apple-touch-icon de 180 x 180", () => {
    const { largura, altura } = dimensoesPng(ler("apps", app, "public", "apple-touch-icon.png"));
    expect({ largura, altura }).toEqual({ largura: 180, altura: 180 });
  });

  it.each(IDIOMAS)("tem a imagem social em %s com 1280 x 640 e menos de 1 MB", (idioma) => {
    const caminho = ["apps", app, "public", `social-${idioma}.png`];
    const { largura, altura } = dimensoesPng(ler(...caminho));
    expect({ largura, altura }).toEqual({ largura: 1280, altura: 640 });
    expect(statSync(join(RAIZ, ...caminho)).size).toBeLessThan(LIMITE_IMAGEM_SOCIAL);
  });
});

describe("marca do layout", () => {
  const layout = texto("packages", "tema", "src", "layouts", "Pagina.astro");

  it("declara a imagem social com as dimensões dos arquivos", () => {
    expect(layout).toMatch(/LARGURA_IMAGEM = 1280;/);
    expect(layout).toMatch(/ALTURA_IMAGEM = 640;/);
  });

  it("aponta para os arquivos que cada app guarda em public/", () => {
    expect(layout).toContain('href="/favicon.svg"');
    expect(layout).toContain('href="/apple-touch-icon.png"');
    expect(layout).toContain("`/social-${idioma}.png`");
  });
});

describe("social preview do repositório", () => {
  it("tem 1280 x 640 e menos de 1 MB", () => {
    const caminho = ["docs", "images", "paginas-vigil-static-sites-social-preview.png"];
    const { largura, altura } = dimensoesPng(ler(...caminho));
    expect({ largura, altura }).toEqual({ largura: 1280, altura: 640 });
    expect(statSync(join(RAIZ, ...caminho)).size).toBeLessThan(LIMITE_IMAGEM_SOCIAL);
  });
});
