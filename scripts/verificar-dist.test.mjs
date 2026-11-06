/**
 * @file Testes da função `verificarHtml`, que confere o HTML gerado pelo build.
 *
 * Usam HTML montado aqui mesmo, sem tocar o disco do build (spec 002, seção Testes).
 */

import { describe, expect, it } from "vitest";

import { verificarHtml } from "./verificar-dist.mjs";

// Cabeça completa de uma página bilíngue: o que o `Pagina.astro` emite.
const CABECA_BILINGUE = `
  <link rel="canonical" href="https://exemplo.test/">
  <link rel="alternate" hreflang="pt-BR" href="https://exemplo.test/">
  <link rel="alternate" hreflang="en" href="https://exemplo.test/en/">
  <link rel="alternate" hreflang="x-default" href="https://exemplo.test/en/">
  <meta property="og:locale" content="pt_BR">
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

  it("aceita recurso do próprio site e o ícone data: da página", () => {
    const html = pagina({
      cabeca:
        '<link rel="stylesheet" href="/_astro/a.css"><link rel="icon" href="data:,"><link rel="preload" as="font" href="/_astro/a.woff2" crossorigin>',
      corpo: '<img src="/_astro/a.png" srcset="/_astro/a.png 1x, /_astro/a@2x.png 2x" alt="">',
    });
    expect(verificarHtml(html)).toEqual([]);
  });

  it("recusa data: onde a política não o lista", () => {
    const html = pagina({ cabeca: '<script src="data:text/javascript,x()"></script>' });
    expect(verificarHtml(html)).toEqual([expect.stringContaining("data:")]);
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
