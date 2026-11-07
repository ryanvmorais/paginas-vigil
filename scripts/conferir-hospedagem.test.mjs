/**
 * @file Testes da conferência do que está no ar (`conferir-hospedagem.mjs`).
 *
 * A rede é um servidor falso: `buscar` responde, a partir de uma pasta de build temporária, o que a
 * hospedagem deveria devolver, e cada teste de falha troca uma resposta (RF-06, RF-08, RNF-04, ADR-5,
 * ADR-6). `esperar` é falso e só conta as pausas, então nenhum teste espera de verdade.
 */

import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  compararCabecalhos,
  conferirHospedagem,
  lerCabecalhosEsperados,
  montarTabela,
} from "./conferir-hospedagem.mjs";
import { montarCabecalhos } from "./hospedagem.mjs";

const ENDERECO = "https://exemplo.test";
const CACHE_ASTRO = "public, max-age=31536000, immutable";
const CACHE_REVALIDAR = "public, max-age=0, must-revalidate";
const BLOCO_CLOUDFLARE =
  "# BEGIN Cloudflare Managed content\nUser-agent: ClaudeBot\nDisallow: /\n# END Cloudflare Managed Content\n\n";

const HEADERS = montarCabecalhos({ medicao: false });

// O conteúdo do build de mentira: cada arquivo tem um corpo próprio, para o hash distinguir um do outro.
const ARQUIVOS = {
  _headers: HEADERS,
  "index.html": "<!doctype html><title>pt</title>",
  "en/index.html": "<!doctype html><title>en</title>",
  "404.html": "<!doctype html><title>404 pt</title>",
  "en/404.html": "<!doctype html><title>404 en</title>",
  "favicon.svg": "<svg/>",
  "robots.txt": "User-agent: *\nAllow: /\n\nSitemap: https://exemplo.test/sitemap.xml\n",
  "sitemap.xml": "<urlset/>",
  "_astro/app.abc123.js": "console.log(1)",
  "_astro/app.abc123.css": "body{}",
  "_astro/fonte.abc123.woff2": "fonte",
};

/** @type {string} */
let pasta;

beforeEach(async () => {
  pasta = await mkdtemp(join(tmpdir(), "conferir-hospedagem-"));
  await mkdir(join(pasta, "_astro"), { recursive: true });
  await mkdir(join(pasta, "en"), { recursive: true });
  for (const [nome, conteudo] of Object.entries(ARQUIVOS)) {
    await writeFile(join(pasta, nome), conteudo, "utf8");
  }
});

afterEach(async () => {
  await rm(pasta, { recursive: true, force: true });
});

/**
 * Monta a resposta certa para um caminho, que cada teste pode alterar.
 *
 * @param {string} protocolo - `https:` ou `http:`
 * @param {string} caminho - o caminho pedido
 * @returns {{ status: number, corpo: string | null, headers: Record<string, string> }}
 */
const respostaCerta = (protocolo, caminho) => {
  const gerais = lerCabecalhosEsperados(HEADERS, "/*");
  if (protocolo === "http:") {
    return { status: 301, corpo: null, headers: { location: `${ENDERECO}${caminho}` } };
  }
  /** @type {Record<string, [number, string, Record<string, string>?]>} */
  const publicos = {
    "/": [200, ARQUIVOS["index.html"]],
    "/en/": [200, ARQUIVOS["en/index.html"]],
    "/favicon.svg": [200, ARQUIVOS["favicon.svg"], { "cache-control": CACHE_REVALIDAR }],
    "/robots.txt": [200, ARQUIVOS["robots.txt"]],
    "/sitemap.xml": [200, ARQUIVOS["sitemap.xml"]],
  };
  if (caminho.startsWith("/_astro/")) {
    const corpo = ARQUIVOS[/** @type {keyof typeof ARQUIVOS} */ (caminho.slice(1))];
    return { status: 200, corpo, headers: { ...gerais, "cache-control": CACHE_ASTRO } };
  }
  if (caminho === "/_headers") {
    return { status: 404, corpo: ARQUIVOS["404.html"], headers: gerais };
  }
  const publico = publicos[caminho];
  if (publico)
    return { status: publico[0], corpo: publico[1], headers: { ...gerais, ...publico[2] } };
  const arquivo = caminho.startsWith("/en/") ? "en/404.html" : "404.html";
  return { status: 404, corpo: ARQUIVOS[arquivo], headers: gerais };
};

/**
 * Cria um `buscar` falso.
 *
 * @param {{ ajustes?: Record<string, (certa: ReturnType<typeof respostaCerta>) => unknown>,
 *   falhasIniciais?: number }} [opcoes] - `ajustes` troca a resposta de um caminho (chave `/caminho`, ou
 *   `http:/caminho`); `falhasIniciais` faz as primeiras tentativas falharem como rede fora do ar
 * @returns {{ buscar: typeof fetch, pedidos: string[] }} a função e os endereços pedidos
 */
const servidor = ({ ajustes = {}, falhasIniciais = 0 } = {}) => {
  let falhas = falhasIniciais;
  /** @type {string[]} */
  const pedidos = [];
  const buscar = /** @type {typeof fetch} */ (
    async (entrada) => {
      const url = new URL(String(entrada));
      pedidos.push(url.href);
      if (falhas > 0) {
        falhas -= 1;
        throw new TypeError("fetch failed");
      }
      const chave = `${url.protocol === "http:" ? "http:" : ""}${url.pathname}`;
      const certa = respostaCerta(url.protocol, url.pathname);
      const ajustada = /** @type {typeof certa | Error} */ (
        ajustes[chave] ? ajustes[chave](certa) : certa
      );
      if (ajustada instanceof Error) throw ajustada;
      return new Response(ajustada.corpo, { status: ajustada.status, headers: ajustada.headers });
    }
  );
  return { buscar, pedidos };
};

/** Roda a conferência com um servidor falso e um `esperar` que só conta. */
const conferir = async (opcoes) => {
  const { buscar, pedidos } = servidor(opcoes);
  const esperar = vi.fn(async () => {});
  const linhas = await conferirHospedagem({ endereco: ENDERECO, pasta, buscar, esperar });
  return { linhas, pedidos, esperar };
};

/** Devolve só as linhas reprovadas, pelo nome. */
const reprovadas = (linhas) => linhas.filter(({ ok }) => !ok).map(({ nome }) => nome);

describe("lerCabecalhosEsperados", () => {
  it("lê os cabeçalhos de cada regra do _headers", () => {
    const gerais = lerCabecalhosEsperados(HEADERS, "/*");
    expect(gerais["Strict-Transport-Security"]).toBe("max-age=31536000");
    expect(gerais["X-Content-Type-Options"]).toBe("nosniff");
    expect(gerais).not.toHaveProperty("Cache-Control");
    expect(lerCabecalhosEsperados(HEADERS, "/_astro/*")).toEqual({ "Cache-Control": CACHE_ASTRO });
  });

  it("mantém os dois pontos dentro do valor", () => {
    const texto =
      "/*\n  Content-Security-Policy: default-src 'self'; img-src https://a.test:8443\n";
    expect(lerCabecalhosEsperados(texto, "/*")["Content-Security-Policy"]).toBe(
      "default-src 'self'; img-src https://a.test:8443",
    );
  });

  it("aceita fim de linha do Windows", () => {
    expect(lerCabecalhosEsperados("/*\r\n  A: 1\r\n\r\n/x\r\n  B: 2\r\n", "/x")).toEqual({
      B: "2",
    });
  });

  it("falha se a regra não existe", () => {
    expect(() => lerCabecalhosEsperados(HEADERS, "/outra/*")).toThrow(/regra \/outra/);
  });
});

describe("compararCabecalhos", () => {
  it("não aponta nada quando tudo confere, sem diferenciar maiúsculas no nome", () => {
    const recebidos = new Headers({ "x-content-type-options": "nosniff" });
    expect(compararCabecalhos({ "X-Content-Type-Options": "nosniff" }, recebidos)).toEqual([]);
  });

  it("aponta o cabeçalho ausente", () => {
    expect(compararCabecalhos({ "X-A": "1" }, new Headers())).toEqual(["falta o cabeçalho X-A"]);
  });

  it("aponta o cabeçalho com valor diferente", () => {
    const [problema] = compararCabecalhos({ "X-A": "1" }, new Headers({ "X-A": "2" }));
    expect(problema).toContain('esperado "1", recebido "2"');
  });
});

describe("conferirHospedagem", () => {
  it("aprova um site servido como o dist, sem esperar", async () => {
    const { linhas, esperar } = await conferir();
    expect(reprovadas(linhas)).toEqual([]);
    expect(linhas.length).toBeGreaterThanOrEqual(13);
    expect(esperar).not.toHaveBeenCalled();
  });

  it("pede o ícone e os arquivos de _astro pelos nomes do dist", async () => {
    const { pedidos } = await conferir();
    for (const caminho of [
      "/_astro/app.abc123.js",
      "/_astro/app.abc123.css",
      "/_astro/fonte.abc123.woff2",
      "/favicon.svg",
      "/robots.txt",
      "/sitemap.xml",
      "/_headers",
    ]) {
      expect(pedidos).toContain(`${ENDERECO}${caminho}`);
    }
  });

  it("reprova a página com um script injetado", async () => {
    const { linhas } = await conferir({
      ajustes: {
        "/": (certa) => ({
          ...certa,
          corpo: `${certa.corpo}<script src="//x.test/a.js"></script>`,
        }),
      },
    });
    expect(reprovadas(linhas)).toEqual(["GET /"]);
    expect(linhas.find(({ nome }) => nome === "GET /")?.detalhe).toMatch(/corpo diferente/);
  });

  it("reprova a 404 que volta com status 200", async () => {
    const { linhas } = await conferir({
      ajustes: { "/conferencia-caminho-inexistente/a/b": (certa) => ({ ...certa, status: 200 }) },
    });
    expect(reprovadas(linhas)).toEqual(["404 em português"]);
    expect(linhas.find(({ nome }) => nome === "404 em português")?.detalhe).toMatch(
      /status 200, esperado 404/,
    );
  });

  it("reprova a 404 em inglês que serve a 404 em português", async () => {
    const { linhas } = await conferir({
      ajustes: {
        "/en/conferencia-caminho-inexistente": (certa) => ({
          ...certa,
          corpo: ARQUIVOS["404.html"],
        }),
      },
    });
    expect(reprovadas(linhas)).toEqual(["404 em inglês"]);
  });

  it("reprova a 404 sem um cabeçalho do _headers", async () => {
    const { linhas } = await conferir({
      ajustes: {
        "/conferencia-caminho-inexistente/a/b": ({ headers, ...resto }) => {
          const semCsp = { ...headers };
          delete semCsp["Content-Security-Policy"];
          return { ...resto, headers: semCsp };
        },
      },
    });
    expect(reprovadas(linhas)).toEqual(["404 em português"]);
    expect(linhas.find(({ nome }) => nome === "404 em português")?.detalhe).toContain(
      "falta o cabeçalho Content-Security-Policy",
    );
  });

  it("reprova o http:// servido com 200", async () => {
    const { linhas } = await conferir({
      ajustes: { "http:/": () => ({ status: 200, corpo: ARQUIVOS["index.html"], headers: {} }) },
    });
    expect(reprovadas(linhas)).toEqual(["http:// não serve a página"]);
  });

  it("reprova o http:// que redireciona para outro lugar que não https", async () => {
    const { linhas } = await conferir({
      ajustes: {
        "http:/": () => ({ status: 301, corpo: null, headers: { location: "http://x.test/" } }),
      },
    });
    expect(reprovadas(linhas)).toEqual(["http:// não serve a página"]);
  });

  it("aprova o http:// com conexão recusada, porque o https abriu", async () => {
    const { linhas } = await conferir({ ajustes: { "http:/": () => new Error("ECONNREFUSED") } });
    expect(reprovadas(linhas)).toEqual([]);
    expect(linhas.find(({ nome }) => nome.startsWith("http://"))?.detalhe).toMatch(/recusada/);
  });

  it("reprova o _headers servido ao público", async () => {
    const { linhas } = await conferir({
      ajustes: { "/_headers": (certa) => ({ ...certa, status: 200, corpo: HEADERS }) },
    });
    expect(reprovadas(linhas)).toEqual(["GET /_headers não é servido"]);
  });

  it("reprova o Cache-Control de /_astro diferente do _headers", async () => {
    const { linhas } = await conferir({
      ajustes: {
        "/_astro/app.abc123.js": ({ headers, ...resto }) => ({
          ...resto,
          headers: { ...headers, "cache-control": CACHE_REVALIDAR },
        }),
      },
    });
    expect(reprovadas(linhas)).toEqual(["Arquivo .js de /_astro/"]);
  });

  it("reprova o favicon com cache imutável", async () => {
    const { linhas } = await conferir({
      ajustes: {
        "/favicon.svg": (certa) => ({
          ...certa,
          headers: { ...certa.headers, "cache-control": CACHE_ASTRO },
        }),
      },
    });
    expect(reprovadas(linhas)).toEqual(["GET /favicon.svg"]);
  });

  it("reprova o robots.txt alterado", async () => {
    const { linhas } = await conferir({
      ajustes: { "/robots.txt": (certa) => ({ ...certa, corpo: "User-agent: *\nDisallow: /\n" }) },
    });
    expect(reprovadas(linhas)).toEqual(["GET /robots.txt"]);
  });

  it("aceita o bloco gerenciado da Cloudflare na frente do robots.txt", async () => {
    const { linhas } = await conferir({
      ajustes: {
        "/robots.txt": (certa) => ({ ...certa, corpo: `${BLOCO_CLOUDFLARE}${certa.corpo}` }),
      },
    });
    expect(reprovadas(linhas)).toEqual([]);
  });

  it("reprova o sitemap.xml alterado", async () => {
    const { linhas } = await conferir({
      ajustes: { "/sitemap.xml": (certa) => ({ ...certa, corpo: "<urlset><url/></urlset>" }) },
    });
    expect(reprovadas(linhas)).toEqual(["GET /sitemap.xml"]);
  });

  it("reprova quando o dist não tem um dos arquivos de _astro", async () => {
    await rm(join(pasta, "_astro", "fonte.abc123.woff2"));
    const { linhas } = await conferir();
    expect(reprovadas(linhas)).toEqual(["Arquivo .woff2 de /_astro/"]);
  });

  it("transforma erro de rede em linha reprovada, sem lançar exceção", async () => {
    const { linhas } = await conferir({ ajustes: { "/en/": () => new Error("reset") } });
    expect(reprovadas(linhas)).toEqual(["GET /en/"]);
    expect(linhas.find(({ nome }) => nome === "GET /en/")?.detalhe).toBe("reset");
  });

  describe("espera pelo domínio", () => {
    it("tenta de novo até o domínio responder e depois confere tudo", async () => {
      const { linhas, esperar } = await conferir({ falhasIniciais: 3 });
      expect(esperar).toHaveBeenCalledTimes(3);
      expect(esperar).toHaveBeenCalledWith(15_000);
      expect(linhas[0]).toMatchObject({ nome: "O domínio responde", ok: true });
      expect(reprovadas(linhas)).toEqual([]);
    });

    it("desiste depois de 5 minutos e devolve só a linha do domínio", async () => {
      const { linhas, esperar, pedidos } = await conferir({ falhasIniciais: 1000 });
      expect(linhas).toHaveLength(1);
      expect(linhas[0]).toMatchObject({ nome: "O domínio responde", ok: false });
      expect(linhas[0].detalhe).toMatch(/300 s/);
      expect(pedidos).toHaveLength(21);
      expect(esperar).toHaveBeenCalledTimes(20);
    });

    it("não conta como respondeu um status diferente de 200", async () => {
      const { linhas } = await conferir({
        ajustes: { "/": (certa) => ({ ...certa, status: 525 }) },
      });
      expect(linhas).toHaveLength(1);
      expect(linhas[0].detalhe).toContain("status 525");
    });
  });
});

describe("montarTabela", () => {
  it("marca cada linha e protege a barra vertical do detalhe", () => {
    const tabela = montarTabela("Título", [
      { nome: "A", ok: true, detalhe: "bem" },
      { nome: "B", ok: false, detalhe: "a | b" },
    ]);
    expect(tabela).toContain("### Título");
    expect(tabela).toContain("| A | ✅ | bem |");
    expect(tabela).toContain("| B | ❌ | a \\| b |");
  });

  it("escapa a contrabarra antes da barra vertical, para o texto não reabrir a célula", () => {
    const tabela = montarTabela("T", [{ nome: "C", ok: false, detalhe: "a\\|b" }]);
    expect(tabela).toContain("| C | ❌ | a\\\\\\|b |");
  });
});
