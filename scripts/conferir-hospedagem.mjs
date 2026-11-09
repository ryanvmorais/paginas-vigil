/**
 * @file Confere o que está no ar contra o `dist` recém-publicado (spec 006, RF-06 e RF-08).
 *
 * Roda depois do deploy, no mesmo job. Consulta o endereço real do site e compara com o que o build
 * gerou: a página, a 404, os arquivos de `_astro/`, o `robots.txt` e o `sitemap.xml` têm de chegar byte a
 * byte iguais (ADR-6: nada injetado pela zona), os cabeçalhos do `_headers` têm de estar na resposta
 * (inclusive na da 404, que a documentação da hospedagem não garante), o `_headers` não pode ser servido e
 * `http://` não pode responder 200. Antes de julgar, espera o domínio responder: o certificado e o DNS de
 * um domínio personalizado podem demorar no primeiro deploy (ADR-5). Logo depois do deploy a borda pode
 * ainda servir a versão anterior (o HTML novo e o antigo só diferem no hash dos arquivos de `_astro/`, com
 * o mesmo tamanho), então um corpo diferente é conferido de novo a cada intervalo, dentro de um tempo
 * total que as verificações dividem; um problema de status ou de cabeçalho reprova na hora.
 *
 * A lógica mora em funções que recebem a rede (`buscar`) e o relógio (`esperar`) por parâmetro, para o
 * teste rodar sem rede. O endereço vem da rota do `wrangler.json` do app, e os bytes esperados, do `dist`.
 *
 * Uso: `node scripts/conferir-hospedagem.mjs <site>` (ou `pnpm hospedagem:conferir <site>`). Sai com
 * código 1 se algo falhar e acrescenta a tabela ao `$GITHUB_STEP_SUMMARY` quando a variável existir.
 */

// @ts-check

import { createHash } from "node:crypto";
import { appendFile, readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

// Caminhos que não existem em nenhum site: a hospedagem tem de responder a 404 própria de cada idioma.
const CAMINHO_INEXISTENTE_PT = "/conferencia-caminho-inexistente/a/b";
const CAMINHO_INEXISTENTE_EN = "/en/conferencia-caminho-inexistente";

// Última linha do bloco que a Cloudflare põe na frente do `robots.txt` de uma zona (ver design, RF-08).
const FIM_BLOCO_GERENCIADO = "# END Cloudflare Managed Content";

// O que a zona espera até o domínio responder: 5 minutos, de 15 em 15 segundos.
const INTERVALO_PADRAO_MS = 15_000;
const LIMITE_PADRAO_MS = 300_000;

// O que as verificações de corpo esperam, somadas, a borda servir o conteúdo novo: 3 minutos. É um
// orçamento único (não por verificação), para uma diferença de verdade não multiplicar a espera.
const PROPAGACAO_PADRAO_MS = 180_000;

// Os problemas que a propagação pode explicar: o corpo servido ainda é o da versão anterior.
const PROBLEMA_DE_CORPO = /^(corpo|conteúdo) diferente do dist/;

// `redirect: "manual"` mostra o redirecionamento em vez de segui-lo, para o `http://` ser julgado de verdade.
const OPCOES_PEDIDO = {
  redirect: /** @type {const} */ ("manual"),
  headers: { "User-Agent": "paginas-vigil-conferencia" },
};

/** @typedef {{ nome: string, ok: boolean, detalhe: string }} Verificacao */

/** @typedef {typeof fetch} Buscar */

/** @typedef {{ get: (nome: string) => string | null }} CabecalhosRecebidos */

/** @typedef {{ status: number, headers: CabecalhosRecebidos, corpo: Buffer, hash: string }} Resposta */

// ---------------------------------------------------------------------------
// Cabeçalhos
// Funções puras: leem o `_headers` e comparam com o que a resposta trouxe.
// ---------------------------------------------------------------------------

/**
 * Lê o `_headers` e devolve os cabeçalhos de uma regra (`/*` ou `/_astro/*`).
 *
 * @param {string} textoHeaders - conteúdo do arquivo `_headers`
 * @param {string} regra - o caminho da regra, como aparece no arquivo
 * @returns {Record<string, string>} nome do cabeçalho (como escrito no arquivo) e valor
 * @throws {Error} se a regra não existir no arquivo
 */
export const lerCabecalhosEsperados = (textoHeaders, regra) => {
  /** @type {Record<string, string>} */
  const cabecalhos = {};
  let regraAtual = "";
  let achou = false;
  for (const linha of textoHeaders.split(/\r?\n/)) {
    if (linha.trim() === "") continue;
    if (!/^\s/.test(linha)) {
      regraAtual = linha.trim();
      if (regraAtual === regra) achou = true;
      continue;
    }
    if (regraAtual !== regra) continue;
    const separador = linha.indexOf(":");
    if (separador === -1) continue;
    cabecalhos[linha.slice(0, separador).trim()] = linha.slice(separador + 1).trim();
  }
  if (!achou) {
    throw new Error(`o _headers não tem a regra ${regra}`);
  }
  return cabecalhos;
};

/**
 * Compara os cabeçalhos esperados com os de uma resposta.
 *
 * @param {Record<string, string>} esperados - saída de `lerCabecalhosEsperados`
 * @param {CabecalhosRecebidos} recebidos - os cabeçalhos da resposta (`Headers` serve)
 * @returns {string[]} um texto por cabeçalho ausente ou diferente; vazio se tudo confere
 */
export const compararCabecalhos = (esperados, recebidos) => {
  /** @type {string[]} */
  const problemas = [];
  for (const [nome, esperado] of Object.entries(esperados)) {
    const recebido = recebidos.get(nome);
    if (recebido === null) {
      problemas.push(`falta o cabeçalho ${nome}`);
    } else if (recebido.trim() !== esperado) {
      problemas.push(`${nome} diferente (esperado "${esperado}", recebido "${recebido}")`);
    }
  }
  return problemas;
};

// ---------------------------------------------------------------------------
// Rede
// Um pedido, o corpo lido inteiro e o hash dele.
// ---------------------------------------------------------------------------

/**
 * Calcula o SHA-256 de um conteúdo.
 *
 * @param {Uint8Array} conteudo - os bytes
 * @returns {string} o hash em hexadecimal
 */
const sha256 = (conteudo) => createHash("sha256").update(conteudo).digest("hex");

/**
 * Faz um pedido e lê o corpo inteiro.
 *
 * @param {Buscar} buscar - a função de rede (`fetch` ou um falso)
 * @param {string} url - o endereço completo
 * @returns {Promise<Resposta>} status, cabeçalhos, corpo e hash do corpo
 */
const pedir = async (buscar, url) => {
  const resposta = await buscar(url, OPCOES_PEDIDO);
  const corpo = Buffer.from(await resposta.arrayBuffer());
  return { status: resposta.status, headers: resposta.headers, corpo, hash: sha256(corpo) };
};

/**
 * Pausa por um tempo; é o `esperar` de verdade.
 *
 * @param {number} ms - milissegundos
 * @returns {Promise<void>}
 */
const pausar = (ms) => new Promise((concluir) => setTimeout(concluir, ms));

/**
 * Descreve um erro de rede em uma frase curta.
 *
 * @param {unknown} erro - o que o `catch` recebeu
 * @returns {string} a mensagem, com a causa quando o `fetch` a traz
 */
const descreverErro = (erro) => {
  if (!(erro instanceof Error)) return String(erro);
  const causa = erro.cause instanceof Error ? ` (${erro.cause.message})` : "";
  return `${erro.message}${causa}`;
};

/**
 * Espera o domínio responder 200 em `/`, tentando de novo a cada intervalo até o limite.
 *
 * @param {{ endereco: string, buscar: Buscar, esperar: (ms: number) => Promise<void>,
 *   intervaloMs: number, limiteMs: number }} opcoes - o que a espera usa
 * @returns {Promise<Verificacao>} aprovada quando o domínio respondeu a tempo
 */
const esperarDominio = async ({ endereco, buscar, esperar, intervaloMs, limiteMs }) => {
  const nome = "O domínio responde";
  const tentativas = Math.floor(limiteMs / intervaloMs) + 1;
  let ultimo = "sem resposta";
  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      const resposta = await pedir(buscar, `${endereco}/`);
      if (resposta.status === 200) {
        return { nome, ok: true, detalhe: `200 na tentativa ${tentativa}` };
      }
      ultimo = `status ${resposta.status}`;
    } catch (erro) {
      ultimo = descreverErro(erro);
    }
    if (tentativa < tentativas) await esperar(intervaloMs);
  }
  return {
    nome,
    ok: false,
    detalhe: `não respondeu 200 em ${limiteMs / 1000} s (último: ${ultimo})`,
  };
};

// ---------------------------------------------------------------------------
// Verificações
// Cada uma devolve uma linha da tabela; erro de rede vira linha reprovada, nunca exceção.
// ---------------------------------------------------------------------------

/**
 * Roda uma verificação e transforma qualquer exceção em linha reprovada.
 *
 * @param {string} nome - o nome da linha na tabela
 * @param {() => Promise<string[]>} conferir - devolve os problemas; vazio aprova
 * @param {string} aprovada - o detalhe da linha quando nada falha
 * @returns {Promise<Verificacao>} a linha da tabela
 */
const verificar = async (nome, conferir, aprovada) => {
  try {
    const problemas = await conferir();
    return problemas.length === 0
      ? { nome, ok: true, detalhe: aprovada }
      : { nome, ok: false, detalhe: problemas.join("; ") };
  } catch (erro) {
    return { nome, ok: false, detalhe: descreverErro(erro) };
  }
};

/**
 * Compara o corpo servido com o arquivo do `dist` e acrescenta o problema se diferirem.
 *
 * @param {string[]} problemas - lista a completar
 * @param {Resposta} resposta - o que o endereço devolveu
 * @param {Buffer} esperado - os bytes do `dist`
 * @returns {void}
 */
const conferirCorpo = (problemas, resposta, esperado) => {
  if (resposta.hash !== sha256(esperado)) {
    problemas.push(
      `corpo diferente do dist (servido ${resposta.corpo.length} bytes, esperado ${esperado.length})`,
    );
  }
};

/**
 * Tira o bloco que a Cloudflare põe na frente do `robots.txt` da zona, se houver.
 *
 * @param {string} texto - o `robots.txt` servido
 * @returns {string} o texto sem o bloco, normalizado para comparar
 */
const semBlocoGerenciado = (texto) => {
  const fim = texto.indexOf(FIM_BLOCO_GERENCIADO);
  const resto = fim === -1 ? texto : texto.slice(fim + FIM_BLOCO_GERENCIADO.length);
  return resto.replace(/\r\n/g, "\n").trim();
};

/**
 * Acha, em `_astro/`, um arquivo de cada tipo que a página carrega.
 *
 * @param {string} pasta - a pasta do build
 * @returns {Promise<Array<{ extensao: string, arquivo: string | undefined }>>} o primeiro arquivo de cada
 *   extensão, ou `undefined` se faltar
 */
const arquivosDoAstro = async (pasta) => {
  const nomes = (await readdir(join(pasta, "_astro"))).sort();
  return [".js", ".css", ".woff2"].map((extensao) => ({
    extensao,
    arquivo: nomes.find((nome) => nome.endsWith(extensao)),
  }));
};

/**
 * Roda as verificações de RF-08 contra `endereco`.
 *
 * @param {{ endereco: string, pasta: string, buscar?: Buscar, esperar?: (ms: number) => Promise<void>,
 *   intervaloMs?: number, limiteMs?: number, propagacaoMs?: number }} opcoes - `endereco` é a origem do
 *   site (`https://host`); `pasta`, o `dist` publicado; `propagacaoMs`, o tempo total que as verificações
 *   de corpo esperam a borda servir o conteúdo novo; `buscar` e `esperar` são injetados nos testes
 * @returns {Promise<Verificacao[]>} uma linha por verificação; se o domínio não responde, só a primeira
 */
export const conferirHospedagem = async ({
  endereco,
  pasta,
  buscar = fetch,
  esperar = pausar,
  intervaloMs = INTERVALO_PADRAO_MS,
  limiteMs = LIMITE_PADRAO_MS,
  propagacaoMs = PROPAGACAO_PADRAO_MS,
}) => {
  const espera = await esperarDominio({ endereco, buscar, esperar, intervaloMs, limiteMs });
  if (!espera.ok) return [espera];

  const textoHeaders = await readFile(join(pasta, "_headers"), "utf8");
  const gerais = lerCabecalhosEsperados(textoHeaders, "/*");
  const doAstro = lerCabecalhosEsperados(textoHeaders, "/_astro/*");

  // O tempo que ainda resta para a borda propagar; todas as verificações de corpo gastam do mesmo.
  let restanteMs = propagacaoMs;

  /**
   * Como `verificar`, mas repete a conferência enquanto o problema for corpo diferente do dist e houver
   * tempo no orçamento da propagação. Anota na linha em que tentativa passou ou desistiu.
   *
   * @param {string} nome - o nome da linha na tabela
   * @param {() => Promise<string[]>} conferir - devolve os problemas; vazio aprova
   * @param {string} aprovada - o detalhe da linha quando nada falha
   * @returns {Promise<Verificacao>} a linha da tabela
   */
  const verificarComEspera = async (nome, conferir, aprovada) => {
    let tentativas = 1;
    const linha = await verificar(
      nome,
      async () => {
        let problemas = await conferir();
        while (
          problemas.some((problema) => PROBLEMA_DE_CORPO.test(problema)) &&
          restanteMs >= intervaloMs
        ) {
          await esperar(intervaloMs);
          restanteMs -= intervaloMs;
          tentativas += 1;
          problemas = await conferir();
        }
        return problemas;
      },
      aprovada,
    );
    if (tentativas === 1) return linha;
    const nota = linha.ok
      ? `corpo igual só na tentativa ${tentativas}: a borda ainda servia a versão anterior`
      : `depois de ${tentativas} tentativas`;
    return { ...linha, detalhe: `${linha.detalhe} (${nota})` };
  };

  /**
   * Confere uma página: status, corpo idêntico ao arquivo do `dist` e cabeçalhos de `/*`.
   *
   * @param {string} nome - o nome da linha
   * @param {string} caminho - o caminho pedido
   * @param {number} status - o status esperado
   * @param {string} arquivo - o arquivo do `dist` com o corpo esperado
   * @returns {Promise<Verificacao>} a linha da tabela
   */
  const pagina = (nome, caminho, status, arquivo) =>
    verificarComEspera(
      nome,
      async () => {
        const resposta = await pedir(buscar, `${endereco}${caminho}`);
        /** @type {string[]} */
        const problemas = [];
        if (resposta.status !== status) {
          problemas.push(`status ${resposta.status}, esperado ${status}`);
        }
        conferirCorpo(problemas, resposta, await readFile(join(pasta, arquivo)));
        problemas.push(...compararCabecalhos(gerais, resposta.headers));
        return problemas;
      },
      `status ${status}, corpo e cabeçalhos iguais`,
    );

  /** @type {Verificacao[]} */
  const linhas = [espera];
  linhas.push(await pagina("GET /", "/", 200, "index.html"));
  linhas.push(await pagina("GET /en/", "/en/", 200, "en/index.html"));
  linhas.push(await pagina("404 em português", CAMINHO_INEXISTENTE_PT, 404, "404.html"));
  linhas.push(await pagina("404 em inglês", CAMINHO_INEXISTENTE_EN, 404, "en/404.html"));

  // Um arquivo de cada tipo de `_astro/`: o cache longo vale só ali e o corpo não pode mudar.
  try {
    for (const { extensao, arquivo } of await arquivosDoAstro(pasta)) {
      const nome = `Arquivo ${extensao} de /_astro/`;
      if (arquivo === undefined) {
        linhas.push({ nome, ok: false, detalhe: `o dist não tem arquivo ${extensao} em _astro/` });
        continue;
      }
      linhas.push(
        await verificarComEspera(
          nome,
          async () => {
            const resposta = await pedir(buscar, `${endereco}/_astro/${arquivo}`);
            /** @type {string[]} */
            const problemas = [];
            if (resposta.status !== 200) problemas.push(`status ${resposta.status}, esperado 200`);
            conferirCorpo(problemas, resposta, await readFile(join(pasta, "_astro", arquivo)));
            problemas.push(...compararCabecalhos(doAstro, resposta.headers));
            return problemas;
          },
          `${arquivo}: 200, corpo igual e Cache-Control de /_astro/*`,
        ),
      );
    }
  } catch (erro) {
    linhas.push({ nome: "Arquivos de /_astro/", ok: false, detalhe: descreverErro(erro) });
  }

  linhas.push(
    await verificar(
      "GET /favicon.svg",
      async () => {
        const resposta = await pedir(buscar, `${endereco}/favicon.svg`);
        /** @type {string[]} */
        const problemas = [];
        if (resposta.status !== 200) problemas.push(`status ${resposta.status}, esperado 200`);
        const cache = resposta.headers.get("cache-control") ?? "";
        if (/immutable/i.test(cache)) problemas.push(`Cache-Control imutável (${cache})`);
        if (!/max-age=0|no-cache|must-revalidate/i.test(cache)) {
          problemas.push(`Cache-Control não obriga a revalidar (${cache || "ausente"})`);
        }
        return problemas;
      },
      "200 e Cache-Control que obriga a revalidar",
    ),
  );

  linhas.push(
    await verificarComEspera(
      "GET /robots.txt",
      async () => {
        const resposta = await pedir(buscar, `${endereco}/robots.txt`);
        /** @type {string[]} */
        const problemas = [];
        if (resposta.status !== 200) problemas.push(`status ${resposta.status}, esperado 200`);
        const esperado = await readFile(join(pasta, "robots.txt"), "utf8");
        if (semBlocoGerenciado(resposta.corpo.toString("utf8")) !== semBlocoGerenciado(esperado)) {
          problemas.push("conteúdo diferente do dist (fora o bloco gerenciado da Cloudflare)");
        }
        return problemas;
      },
      "200 e conteúdo igual (aceito o bloco gerenciado da Cloudflare na frente)",
    ),
  );

  linhas.push(
    await verificarComEspera(
      "GET /sitemap.xml",
      async () => {
        const resposta = await pedir(buscar, `${endereco}/sitemap.xml`);
        /** @type {string[]} */
        const problemas = [];
        if (resposta.status !== 200) problemas.push(`status ${resposta.status}, esperado 200`);
        conferirCorpo(problemas, resposta, await readFile(join(pasta, "sitemap.xml")));
        return problemas;
      },
      "200 e corpo igual",
    ),
  );

  linhas.push(
    await verificar(
      "GET /_headers não é servido",
      async () => {
        const resposta = await pedir(buscar, `${endereco}/_headers`);
        return resposta.hash === sha256(Buffer.from(textoHeaders, "utf8"))
          ? [`o arquivo _headers está público (status ${resposta.status})`]
          : [];
      },
      "o arquivo não é devolvido",
    ),
  );

  linhas.push(await verificarHttp(endereco, buscar));
  return linhas;
};

/**
 * Confere que `http://` nunca serve a página: redireciona para `https://` ou recusa a conexão. A recusa
 * só vale porque o `https://` já abriu na espera pelo domínio.
 *
 * @param {string} endereco - a origem `https://host`
 * @param {Buscar} buscar - a função de rede
 * @returns {Promise<Verificacao>} a linha da tabela
 */
const verificarHttp = async (endereco, buscar) => {
  const nome = "http:// não serve a página";
  const url = `http://${new URL(endereco).host}/`;
  let resposta;
  try {
    resposta = await pedir(buscar, url);
  } catch (erro) {
    return { nome, ok: true, detalhe: `conexão recusada (${descreverErro(erro)})` };
  }
  if ([301, 302, 307, 308].includes(resposta.status)) {
    const destino = resposta.headers.get("location") ?? "";
    return destino.startsWith("https://")
      ? { nome, ok: true, detalhe: `${resposta.status} para ${destino}` }
      : {
          nome,
          ok: false,
          detalhe: `${resposta.status} para um destino que não é https (${destino})`,
        };
  }
  return {
    nome,
    ok: false,
    detalhe:
      resposta.status === 200
        ? "http:// respondeu 200 (a página é servida sem HTTPS)"
        : `http:// respondeu ${resposta.status}, sem redirecionar nem recusar`,
  };
};

// ---------------------------------------------------------------------------
// Linha de comando
// Lê o endereço do `wrangler.json`, confere e escreve a tabela.
// ---------------------------------------------------------------------------

/**
 * Monta a tabela em Markdown das verificações, para o resumo do GitHub Actions.
 *
 * @param {string} titulo - o título da tabela
 * @param {Verificacao[]} verificacoes - as linhas
 * @returns {string} o Markdown, terminado em quebra de linha
 */
export const montarTabela = (titulo, verificacoes) => {
  // A contrabarra se escapa primeiro: sem isso, um `\|` do texto viraria `\\|` e reabriria a célula.
  const celula = (/** @type {string} */ texto) =>
    texto.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    `### ${titulo}`,
    "",
    "| Verificação | Resultado | Detalhe |",
    "| --- | --- | --- |",
    ...verificacoes.map(
      ({ nome, ok, detalhe }) => `| ${celula(nome)} | ${ok ? "✅" : "❌"} | ${celula(detalhe)} |`,
    ),
    "",
  ].join("\n");
};

/**
 * Ponto de entrada da linha de comando.
 *
 * @param {string[]} argumentos - argumentos depois do nome do script; o primeiro é o nome do site
 * @returns {Promise<number>} 0 se tudo confere, 1 se algo falhou, 2 sem o site
 */
const main = async (argumentos) => {
  const site = argumentos[0];
  if (!site) {
    console.error("Uso: node scripts/conferir-hospedagem.mjs <site>");
    return 2;
  }
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const pastaApp = join(raiz, "apps", site);
  const configuracao = JSON.parse(await readFile(join(pastaApp, "wrangler.json"), "utf8"));
  const dominio = configuracao.routes?.[0]?.pattern;
  if (typeof dominio !== "string") {
    console.error(`conferir-hospedagem: o wrangler.json de ${site} não tem rota.`);
    return 1;
  }

  const verificacoes = await conferirHospedagem({
    endereco: `https://${dominio}`,
    pasta: join(pastaApp, "dist"),
  });
  const tabela = montarTabela(`Conferência de ${dominio}`, verificacoes);
  console.log(tabela);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${tabela}\n`, "utf8");
  }
  return verificacoes.every(({ ok }) => ok) ? 0 : 1;
};

// Só roda como comando; importado pelo teste, não faz nada.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await main(process.argv.slice(2));
}
