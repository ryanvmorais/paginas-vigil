/**
 * @file Testes da função `verificarHtml`, que confere o HTML gerado pelo build.
 *
 * Usam HTML montado aqui mesmo, sem tocar o disco do build (spec 002, seção Testes).
 */

import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { politicaCsp } from "./csp.mjs";
import { montarCabecalhos, montarRobots, montarSitemap } from "./hospedagem.mjs";
import {
  arquivosDeMarca,
  verificarHospedagem,
  verificarHospedagemPasta,
  verificarHtml,
  verificarPasta,
} from "./verificar-dist.mjs";

// Cabeça completa de uma página bilíngue: o que o `Pagina.astro` emite.
const CABECA_BILINGUE = `
  <link rel="canonical" href="https://exemplo.test/">
  <link rel="alternate" hreflang="pt-BR" href="https://exemplo.test/">
  <link rel="alternate" hreflang="en" href="https://exemplo.test/en/">
  <link rel="alternate" hreflang="x-default" href="https://exemplo.test/en/">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:image" content="https://exemplo.test/social-pt.png">
`;

// Monta um documento com a cabeça e o corpo dados.
const pagina = ({ lang = ' lang="pt-BR"', cabeca = "", corpo = "" } = {}) => {
  return `<!doctype html><html${lang}><head><meta charset="utf-8">${cabeca}</head><body>${corpo}</body></html>`;
};

describe("verificarHtml: sem inline (RNF-01)", () => {
  it("aceita uma página com script e estilo externos", () => {
    const html = pagina({
      cabeca:
        '<link rel="stylesheet" href="/_astro/a.css"><script type="module" src="/_astro/a.js"></script>',
    });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("recusa <script> sem src", () => {
    const html = pagina({ corpo: "<script>window.x = 1;</script>" });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("<script>")]);
  });

  it("recusa <script> sem src mesmo com outros atributos", () => {
    const html = pagina({ corpo: '<script type="module">import "/a.js";</script>' });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("<script>")]);
  });

  it("recusa <style>", () => {
    const html = pagina({ cabeca: "<style>body{margin:0}</style>" });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("<style>")]);
  });

  it("recusa o atributo style=, com aspas duplas, simples ou sem aspas", () => {
    for (const atributo of ['style="color:red"', "style='color:red'", "style=color:red"]) {
      const html = pagina({ corpo: `<p ${atributo}>oi</p>` });
      expect(verificarHtml(html)).toEqual([expect.stringContaining("style=")]);
    }
  });

  it("não confunde texto com tag: 'style=' e '<style>' escritos no conteúdo são aceitos", () => {
    const html = pagina({
      corpo:
        "<p>Escreva style=&quot;x&quot; ou &lt;style&gt; no seu CSS.</p><pre><code>&lt;script&gt;x&lt;/script&gt;</code></pre>",
    });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("não confunde um valor de atributo que contém '>' com o fim da tag", () => {
    const html = pagina({ corpo: '<img alt="a > b" src="/a.png"><p style="x">oi</p>' });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("style=")]);
  });

  it("ignora comentários HTML", () => {
    const html = pagina({ corpo: "<!-- <style>a{}</style> <script>x()</script> -->" });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("termina o comentário no primeiro -->, como o navegador, e confere o que vem depois", () => {
    const html = pagina({ corpo: "<!-- <!-- a --> <script>x()</script> -->" });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("<script>")]);
  });

  it("relata cada problema encontrado", () => {
    const html = pagina({
      cabeca: "<style>a{}</style>",
      corpo: '<script>x()</script><p style="y">z</p>',
    });
    expect(verificarHtml(html)).toHaveLength(3);
  });
});

describe("verificarHtml: marcação de idioma (RF-03)", () => {
  it("aceita uma página bilíngue completa", () => {
    expect(verificarHtml(pagina({ cabeca: CABECA_BILINGUE }))).toEqual([]);
  });

  it("não exige a marcação em página sem hreflang", () => {
    expect(verificarHtml(pagina({ lang: "" }))).toEqual([]);
  });

  it("exige lang no <html> quando há hreflang", () => {
    const html = pagina({ lang: "", cabeca: CABECA_BILINGUE });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("lang")]);
  });

  it("exige canonical", () => {
    const html = pagina({ cabeca: CABECA_BILINGUE.replace(/<link rel="canonical"[^>]*>/, "") });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("canonical")]);
  });

  it("exige cada um dos três alternate", () => {
    for (const idioma of ["pt-BR", "en", "x-default"]) {
      const cabeca = CABECA_BILINGUE.replace(
        new RegExp(`<link rel="alternate" hreflang="${idioma}"[^>]*>`),
        "",
      );
      expect(verificarHtml(pagina({ cabeca }))).toEqual([expect.stringContaining(idioma)]);
    }
  });

  it("exige og:locale", () => {
    const html = pagina({
      cabeca: CABECA_BILINGUE.replace(/<meta property="og:locale"[^>]*>/, ""),
    });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("og:locale")]);
  });

  it("vê o hreflang de um link do corpo e passa a exigir a marcação da cabeça", () => {
    const html = pagina({ corpo: '<a href="/en/" hreflang="en">EN</a>' });
    expect(verificarHtml(html).length).toBeGreaterThan(0);
  });
});

describe("verificarHtml: página noindex (404)", () => {
  const NOINDEX = '<meta name="robots" content="noindex">';
  const SELETOR = '<a href="/" hreflang="pt-BR">PT</a>';

  it("aceita a página sem a marcação de idioma e de compartilhamento, mesmo com o seletor de idioma", () => {
    const html = pagina({ cabeca: NOINDEX, corpo: SELETOR });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("recusa canonical, alternate e og:* numa página noindex", () => {
    const problemas = verificarHtml(pagina({ cabeca: NOINDEX + CABECA_BILINGUE }));
    expect(problemas).toEqual([
      expect.stringContaining("canonical"),
      expect.stringContaining("alternate"),
      expect.stringContaining("og:"),
    ]);
  });

  it("reconhece noindex entre outras diretivas e sem diferença de caixa", () => {
    const html = pagina({
      cabeca: '<meta name="Robots" content="NOFOLLOW, NoIndex">' + CABECA_BILINGUE,
    });
    expect(verificarHtml(html).length).toBe(3);
  });

  it("não trata como noindex um meta robots que permite indexar", () => {
    const html = pagina({ cabeca: '<meta name="robots" content="index, follow">', corpo: SELETOR });
    expect(verificarHtml(html).length).toBeGreaterThan(0);
  });

  it("continua conferindo as outras regras (sem inline)", () => {
    const html = pagina({ cabeca: NOINDEX, corpo: "<script>x()</script>" });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("script")]);
  });
});

describe("verificarHtml: imagem social", () => {
  it("exige og:image na página bilíngue", () => {
    const html = pagina({
      cabeca: CABECA_BILINGUE.replace(/<meta property="og:image"[^>]*>/, ""),
    });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("og:image")]);
  });

  it("recusa og:image sem endereço", () => {
    const html = pagina({
      cabeca: CABECA_BILINGUE.replace(/(og:image" content=")[^"]*/, "$1"),
    });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("og:image")]);
  });
});

describe("arquivosDeMarca", () => {
  it("lista favicon, apple-touch-icon e o caminho da og:image, sem repetir", () => {
    const html = pagina({
      cabeca:
        '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">' +
        '<meta property="og:image" content="https://exemplo.test/social-pt.png">' +
        '<meta property="og:image" content="https://exemplo.test/social-pt.png">',
    });
    expect(arquivosDeMarca(html)).toEqual([
      "/favicon.svg",
      "/apple-touch-icon.png",
      "/social-pt.png",
    ]);
  });

  it("deixa de fora ícone com data: ou de outro site e og:image inválida", () => {
    const html = pagina({
      cabeca:
        '<link rel="icon" href="data:,"><link rel="icon" href="https://cdn.exemplo.test/a.ico"><link rel="icon" href="//cdn.exemplo.test/a.ico">' +
        '<meta property="og:image" content="não é url">',
    });
    expect(arquivosDeMarca(html)).toEqual([]);
  });

  it("tira a query e o fragmento do caminho do ícone", () => {
    const html = pagina({ cabeca: '<link rel="icon" href="/favicon.svg?v=2#a">' });
    expect(arquivosDeMarca(html)).toEqual(["/favicon.svg"]);
  });
});

describe("verificarPasta: arquivos da marca", () => {
  const pastas = [];
  afterEach(async () => {
    await Promise.all(pastas.splice(0).map((p) => rm(p, { recursive: true, force: true })));
  });

  // Monta um build mínimo: uma página bilíngue e os arquivos pedidos.
  const montar = async (arquivos) => {
    const pasta = await mkdtemp(join(tmpdir(), "verificar-dist-"));
    pastas.push(pasta);
    const cabeca =
      CABECA_BILINGUE +
      '<link rel="icon" href="/favicon.svg"><link rel="apple-touch-icon" href="/a.png">';
    await writeFile(join(pasta, "index.html"), pagina({ cabeca }));
    for (const arquivo of arquivos) {
      await mkdir(join(pasta, arquivo, ".."), { recursive: true });
      await writeFile(join(pasta, arquivo), "x");
    }
    return pasta;
  };

  it("aceita o build com todos os arquivos citados", async () => {
    const pasta = await montar(["favicon.svg", "a.png", "social-pt.png"]);
    expect(await verificarPasta(pasta)).toEqual([]);
  });

  it("acusa cada arquivo citado que não existe no build", async () => {
    const pasta = await montar(["favicon.svg"]);
    const [achado] = await verificarPasta(pasta);
    expect(achado?.problemas).toHaveLength(2);
    expect(achado?.problemas).toEqual(
      expect.arrayContaining([
        expect.stringContaining("/a.png"),
        expect.stringContaining("/social-pt.png"),
      ]),
    );
  });
});

// As três peças do modo com medição, como o Astro as emite: o banner, o controle do rodapé e o
// script de consentimento (arquivo externo nomeado pelo componente).
const BANNER = '<section data-consentimento data-medicao="G-ABC1234567" hidden></section>';
const CONTROLE = '<button type="button" data-gerenciar-cookies hidden>Gerenciar Cookies</button>';
const SCRIPT_CONSENTIMENTO =
  '<script type="module" src="/_astro/Consentimento.astro_astro_type_script_index_0_lang.AbC123.js"></script>';

// Página no modo com medição (as três peças) e acréscimos opcionais na cabeça e no corpo.
const comMedicao = ({ cabeca = "", corpo = "" } = {}) =>
  pagina({ cabeca: SCRIPT_CONSENTIMENTO + cabeca, corpo: BANNER + CONTROLE + corpo });

describe("verificarHtml: coerência do modo de medição (RF-06)", () => {
  it("aceita o modo com medição completo: banner, controle e script", () => {
    expect(verificarHtml(comMedicao())).toEqual([]);
  });

  it("aceita o modo sem medição: nenhuma das três peças", () => {
    expect(verificarHtml(pagina({ corpo: "<p>oi</p>" }))).toEqual([]);
  });

  it("recusa cada meio-termo, nomeando o que sobra e o que falta", () => {
    const pecas = { banner: BANNER, controle: CONTROLE, script: SCRIPT_CONSENTIMENTO };
    const combinacoes = [
      ["banner"],
      ["controle"],
      ["script"],
      ["banner", "controle"],
      ["banner", "script"],
      ["controle", "script"],
    ];
    for (const presentes of combinacoes) {
      const html = pagina({
        cabeca: presentes.includes("script") ? pecas.script : "",
        corpo:
          (presentes.includes("banner") ? pecas.banner : "") +
          (presentes.includes("controle") ? pecas.controle : ""),
      });
      const problemas = verificarHtml(html);
      expect(problemas, presentes.join("+")).toEqual([expect.stringContaining("medição")]);
      for (const nome of Object.keys(pecas)) {
        expect(problemas[0]).toContain(nome);
      }
    }
  });

  it("recusa o banner sem identificador válido em data-medicao", () => {
    for (const atributo of [
      "",
      'data-medicao=""',
      'data-medicao="g-abc1234567"',
      'data-medicao="G-ABC"',
    ]) {
      const banner = `<section data-consentimento ${atributo} hidden></section>`;
      const html = pagina({ cabeca: SCRIPT_CONSENTIMENTO, corpo: banner + CONTROLE });
      expect(verificarHtml(html), atributo).toEqual([expect.stringContaining("data-medicao")]);
    }
  });

  it("não confunde o nome do script de consentimento com os outros scripts", () => {
    const html = pagina({
      cabeca: '<script type="module" src="/_astro/Comando.astro_astro_type_script.X.js"></script>',
    });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("continua recusando inline no modo com medição", () => {
    expect(verificarHtml(comMedicao({ corpo: "<script>x()</script>" }))).toEqual([
      expect.stringContaining("<script>"),
    ]);
  });
});

describe("verificarHtml: compatibilidade com a CSP (RF-09)", () => {
  const GTAG = '<script src="https://www.googletagmanager.com/gtag/js?id=G-ABC1234567"></script>';

  it("recusa script de domínio fora da política, nos dois modos", () => {
    const externo = '<script src="https://cdn.exemplo.test/a.js"></script>';
    expect(verificarHtml(pagina({ cabeca: externo }))).toEqual([
      expect.stringContaining("cdn.exemplo.test"),
    ]);
    expect(verificarHtml(comMedicao({ cabeca: externo }))).toEqual([
      expect.stringContaining("cdn.exemplo.test"),
    ]);
  });

  it("aceita o domínio do gtag.js só no modo com medição", () => {
    expect(verificarHtml(comMedicao({ cabeca: GTAG }))).toEqual([]);
    expect(verificarHtml(pagina({ cabeca: GTAG }))).toEqual([
      expect.stringContaining("googletagmanager.com"),
    ]);
  });

  it("confere cada tag que busca recurso: stylesheet, preload, modulepreload, ícone, img e source", () => {
    const externas = [
      '<link rel="stylesheet" href="https://cdn.exemplo.test/a.css">',
      '<link rel="preload" as="font" href="https://cdn.exemplo.test/a.woff2" crossorigin>',
      '<link rel="preload" as="script" href="https://cdn.exemplo.test/a.js">',
      '<link rel="modulepreload" href="https://cdn.exemplo.test/a.js">',
      '<link rel="icon" href="https://cdn.exemplo.test/a.ico">',
      '<link rel="shortcut icon" href="https://cdn.exemplo.test/a.ico">',
      '<img src="https://cdn.exemplo.test/a.png" alt="">',
      '<img src="/a.png" srcset="/a.png 1x, https://cdn.exemplo.test/a@2x.png 2x" alt="">',
      '<picture><source srcset="https://cdn.exemplo.test/a.webp"><img src="/a.png" alt=""></picture>',
    ];
    for (const tag of externas) {
      expect(verificarHtml(pagina({ corpo: tag })), tag).toEqual([
        expect.stringContaining("cdn.exemplo.test"),
      ]);
    }
  });

  it("aceita recurso do próprio site, inclusive os ícones da marca", () => {
    const html = pagina({
      cabeca:
        '<link rel="stylesheet" href="/_astro/a.css"><link rel="icon" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="preload" as="font" href="/_astro/a.woff2" crossorigin>',
      corpo: '<img src="/_astro/a.png" srcset="/_astro/a.png 1x, /_astro/a@2x.png 2x" alt="">',
    });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("recusa data: em qualquer recurso, ícone inclusive: a política não o lista", () => {
    const script = pagina({ cabeca: '<script src="data:text/javascript,x()"></script>' });
    expect(verificarHtml(script)).toEqual([expect.stringContaining("data:")]);
    const icone = pagina({ cabeca: '<link rel="icon" href="data:,">' });
    expect(verificarHtml(icone)).toEqual([expect.stringContaining("data:")]);
  });

  it("deixa de fora o que não busca recurso: <a>, canonical e alternate", () => {
    const html = pagina({
      cabeca:
        '<link rel="canonical" href="https://exemplo.test/"><link rel="alternate" hreflang="en" href="https://exemplo.test/en/">',
      corpo: '<a href="https://github.com/ryanvmorais/webvigil">repositório</a>',
    });
    expect(verificarHtml(html).filter((p) => p.includes("CSP"))).toEqual([]);
  });
});

// Um botão do tema: `<a>` com a classe `botao` (o Astro soma atributos `data-astro-cid-*`).
const botao = (href, variante = "secundario", rotulo = "rótulo") =>
  `<a href="${href}" class="botao ${variante}" data-astro-cid-x="true">${rotulo}</a>`;

describe("verificarHtml: âncoras (RF-06)", () => {
  it("aceita link interno para um id que existe", () => {
    const html = pagina({
      corpo: '<a href="#instalar">Instalar</a><section id="instalar"><h2>Instalar</h2></section>',
    });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("recusa link interno para um id que não existe", () => {
    const html = pagina({ corpo: '<a href="#sumiu">Sumiu</a><section id="instalar"></section>' });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("#sumiu")]);
  });

  it("confere o botão e o link do menu, e relata cada âncora quebrada uma vez", () => {
    const html = pagina({
      corpo: `<a href="#sumiu">menu</a><a href="#sumiu">menu do celular</a>${botao("#outro")}`,
    });
    expect(verificarHtml(html)).toEqual([
      expect.stringContaining("#sumiu"),
      expect.stringContaining("#outro"),
    ]);
  });

  it("não confunde o id com o texto da página nem com o valor de outro atributo", () => {
    const html = pagina({
      corpo:
        '<a href="#instalar">Instalar</a><p>id="instalar"</p><p data-id="instalar" class="instalar"></p>',
    });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("#instalar")]);
  });

  it("deixa de fora o link para o topo (#) e os links que não são âncora", () => {
    const html = pagina({
      corpo:
        '<a href="#">topo</a><a href="/en/#instalar">en</a><a href="https://exemplo.test/#x">fora</a>',
    });
    expect(verificarHtml(html)).toEqual([]);
  });
});

describe("verificarHtml: destinos externos dos botões (RF-06)", () => {
  const REPO = "https://github.com/ryanvmorais/webvigil";

  it("aceita uma página em que cada botão tem um destino próprio", () => {
    const html = pagina({
      corpo: [
        botao(REPO, "primario"),
        botao("#como-funciona"),
        botao(`${REPO}/tree/main/docs`),
      ].join(""),
    });
    expect(verificarHtml(html.replace("</body>", '<h2 id="como-funciona"></h2></body>'))).toEqual(
      [],
    );
  });

  it("recusa dois botões da mesma página com o mesmo destino externo", () => {
    const html = pagina({
      corpo: [
        botao(REPO, "primario"),
        botao(`${REPO}/tree/main/docs`),
        botao(`${REPO}/tree/main/docs`),
      ].join(""),
    });
    expect(verificarHtml(html)).toEqual([expect.stringContaining(`${REPO}/tree/main/docs`)]);
  });

  it("trata o fragmento como a mesma página: README e README#readme são o mesmo destino", () => {
    const html = pagina({
      corpo: [botao("#a", "primario"), botao(REPO), botao(`${REPO}#readme`)].join(""),
    });
    expect(verificarHtml(html)).toEqual([
      expect.stringContaining("sem alvo"),
      expect.stringContaining(REPO),
    ]);
  });

  it("aceita o par de botões primários: o Ver no GitHub do topo e o do fim", () => {
    const html = pagina({
      corpo: [
        botao(REPO, "primario", "Ver no GitHub"),
        botao("https://exemplo.test/outro"),
        botao(REPO, "primario", "Ver no GitHub"),
        botao(`${REPO}/tree/main/docs`),
      ].join(""),
    });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("recusa a repetição entre botões que não são os dois primários, mesmo com o par presente", () => {
    const html = pagina({
      corpo: [
        botao(REPO, "primario"),
        botao(`${REPO}/tree/main/docs`),
        botao(`${REPO}/tree/main/docs`),
        botao(REPO, "primario"),
      ].join(""),
    });
    expect(verificarHtml(html)).toEqual([expect.stringContaining(`${REPO}/tree/main/docs`)]);
  });

  it("recusa a repetição de um botão primário com um secundário", () => {
    const html = pagina({ corpo: [botao(REPO, "primario"), botao(REPO)].join("") });
    expect(verificarHtml(html)).toEqual([expect.stringContaining(REPO)]);
  });

  it("recusa o destino que aparece três vezes, ainda que todos sejam primários", () => {
    const html = pagina({
      corpo: [botao(REPO, "primario"), botao(REPO, "primario"), botao(REPO, "primario")].join(""),
    });
    expect(verificarHtml(html)).toEqual([expect.stringContaining(REPO)]);
  });

  it("não conta links comuns: o aviso do painel pode repetir um destino de botão", () => {
    const html = pagina({
      corpo: [botao(REPO, "primario"), `<a href="${REPO}">no texto</a>`].join(""),
    });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("não conta botões internos que se repetem", () => {
    const html = pagina({
      corpo: `<h2 id="a"></h2>${botao("#a")}${botao("#a")}`,
    });
    expect(verificarHtml(html)).toEqual([]);
  });
});

describe("verificarHospedagem: regra 8 (RF-02, RF-03, RF-07)", () => {
  const SITE = "https://exemplo.test";
  const NOINDEX = '<meta name="robots" content="noindex">';

  // As duas páginas iniciais, com o `canonical` e o trio de `hreflang` que o layout emite.
  const inicial = (caminho, extra = {}) => {
    const proprio = caminho === "" ? `${SITE}/` : `${SITE}/en/`;
    const cabeca =
      `<link rel="canonical" href="${proprio}">` +
      `<link rel="alternate" hreflang="pt-BR" href="${SITE}/">` +
      `<link rel="alternate" hreflang="en" href="${SITE}/en/">` +
      `<link rel="alternate" hreflang="x-default" href="${SITE}/en/">` +
      '<meta property="og:locale" content="pt_BR">' +
      `<meta property="og:image" content="${SITE}/social-pt.png">`;
    return pagina({
      cabeca: (extra.cabeca ?? "") + cabeca,
      corpo: extra.corpo ?? "",
    });
  };

  // A página inicial no modo com medição: as três peças do consentimento mais a marcação de idioma.
  const inicialComMedicao = () =>
    inicial("", { cabeca: SCRIPT_CONSENTIMENTO, corpo: BANNER + CONTROLE });

  // Um build coerente, sem medição; cada teste muda uma peça.
  const build = (mudancas = {}) => ({
    cabecalhos: montarCabecalhos({ medicao: false }),
    robots: montarRobots(SITE),
    sitemap: montarSitemap(SITE),
    ...mudancas,
    paginas: {
      "index.html": inicial(""),
      "en/index.html": inicial("en/"),
      "404.html": pagina({ cabeca: NOINDEX }),
      "en/404.html": pagina({ cabeca: NOINDEX }),
      ...mudancas.paginas,
    },
  });

  it("aceita o build coerente, sem medição", () => {
    expect(verificarHospedagem(build())).toEqual([]);
  });

  it("aceita o build coerente, com medição", () => {
    const coerente = build({
      cabecalhos: montarCabecalhos({ medicao: true }),
      paginas: { "index.html": inicialComMedicao() },
    });
    expect(verificarHospedagem(coerente)).toEqual([]);
  });

  it("recusa o build sem o _headers", () => {
    expect(verificarHospedagem(build({ cabecalhos: undefined }))).toEqual(["falta _headers"]);
  });

  it("recusa o build sem robots.txt nem sitemap.xml", () => {
    expect(verificarHospedagem(build({ robots: undefined, sitemap: undefined }))).toEqual([
      "falta robots.txt",
      "falta sitemap.xml",
    ]);
  });

  it("recusa a CSP de outro modo: _headers com medição num HTML sem medição", () => {
    const problemas = verificarHospedagem(
      build({ cabecalhos: montarCabecalhos({ medicao: true }) }),
    );
    expect(problemas).toEqual([expect.stringContaining("a CSP difere")]);
  });

  it("recusa a CSP de outro modo: _headers sem medição num HTML com medição", () => {
    const problemas = verificarHospedagem(
      build({ paginas: { "index.html": inicialComMedicao() } }),
    );
    expect(problemas).toEqual([expect.stringContaining("a CSP difere")]);
  });

  it("recusa mais de uma linha de CSP", () => {
    const linhaCsp = montarCabecalhos({ medicao: false }).split("\n")[1];
    const cabecalhos = `${build().cabecalhos}/outra\n${linhaCsp}\n`;
    expect(verificarHospedagem(build({ cabecalhos }))).toEqual([
      expect.stringContaining("2 linhas de Content-Security-Policy"),
    ]);
  });

  it("recusa unsafe-inline no _headers", () => {
    const csp = politicaCsp({ medicao: false }).cabecalho;
    const cabecalhos = build().cabecalhos.replace(csp, `${csp}; script-src 'unsafe-inline'`);
    const problemas = verificarHospedagem(build({ cabecalhos }));
    expect(problemas).toContainEqual(expect.stringContaining("unsafe-"));
  });

  it("recusa o _headers sem um cabeçalho de segurança", () => {
    const cabecalhos = build()
      .cabecalhos.split("\n")
      .filter((linha) => !linha.includes("Referrer-Policy"))
      .join("\n");
    expect(verificarHospedagem(build({ cabecalhos }))).toEqual([
      expect.stringContaining("Referrer-Policy"),
    ]);
  });

  it("recusa o sitemap com uma URL a mais", () => {
    const sitemap = montarSitemap(SITE).replace(
      "</urlset>",
      `<url><loc>${SITE}/outra/</loc></url></urlset>`,
    );
    expect(verificarHospedagem(build({ sitemap }))).toEqual([
      expect.stringContaining(`${SITE}/outra/`),
    ]);
  });

  it("recusa o sitemap sem uma das páginas", () => {
    const sitemap = montarSitemap(SITE).replace(
      /<url>\s*<loc>[^<]*\/en\/<\/loc>[\s\S]*?<\/url>/,
      "",
    );
    expect(verificarHospedagem(build({ sitemap }))).toEqual([expect.stringContaining("sem a URL")]);
  });

  it("recusa o sitemap com hreflang diferente do que a página declara", () => {
    const sitemap = montarSitemap(SITE).replaceAll(
      `hreflang="x-default" href="${SITE}/en/"`,
      `hreflang="x-default" href="${SITE}/"`,
    );
    const problemas = verificarHospedagem(build({ sitemap }));
    expect(problemas).toHaveLength(2);
    expect(problemas[0]).toContain("hreflang");
  });

  it("recusa o robots.txt sem a linha do sitemap ou com o domínio errado", () => {
    expect(verificarHospedagem(build({ robots: "User-agent: *\nAllow: /\n" }))).toEqual([
      expect.stringContaining("Sitemap"),
    ]);
    const outro = montarRobots("https://outro.test");
    expect(verificarHospedagem(build({ robots: outro }))).toEqual([
      expect.stringContaining(`${SITE}/sitemap.xml`),
    ]);
  });

  it("recusa o robots.txt que bloqueia o site", () => {
    const robots = `${montarRobots(SITE)}\nUser-agent: *\nDisallow: /\n`;
    expect(verificarHospedagem(build({ robots }))).toEqual([expect.stringContaining("Disallow")]);
  });

  it("recusa o build sem 404.html ou sem en/404.html", () => {
    expect(verificarHospedagem(build({ paginas: { "404.html": undefined } }))).toEqual([
      "falta 404.html",
    ]);
    expect(verificarHospedagem(build({ paginas: { "en/404.html": undefined } }))).toEqual([
      "falta en/404.html",
    ]);
  });

  it("recusa a 404 sem noindex", () => {
    const problemas = verificarHospedagem(build({ paginas: { "404.html": pagina() } }));
    expect(problemas).toEqual([expect.stringContaining("404.html sem <meta")]);
  });

  it("recusa a 404 com canonical", () => {
    const html = pagina({
      cabeca: `${NOINDEX}<link rel="canonical" href="${SITE}/404.html">`,
    });
    const problemas = verificarHospedagem(build({ paginas: { "en/404.html": html } }));
    expect(problemas).toEqual([expect.stringContaining("en/404.html: página noindex com")]);
  });
});

describe("verificarHospedagemPasta", () => {
  const pastas = [];
  afterEach(async () => {
    await Promise.all(pastas.splice(0).map((p) => rm(p, { recursive: true, force: true })));
  });

  it("lê os arquivos do disco e acusa o que falta", async () => {
    const pasta = await mkdtemp(join(tmpdir(), "verificar-hospedagem-"));
    pastas.push(pasta);
    await writeFile(join(pasta, "_headers"), montarCabecalhos({ medicao: false }));
    const problemas = await verificarHospedagemPasta(pasta);
    expect(problemas).toEqual(
      expect.arrayContaining([
        "falta robots.txt",
        "falta sitemap.xml",
        "falta index.html",
        "falta 404.html",
      ]),
    );
    expect(problemas).not.toContain("falta _headers");
  });
});
