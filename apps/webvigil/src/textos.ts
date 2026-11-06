/**
 * @file Textos da página do WebVigil, em português e em inglês.
 *
 * A fonte é o mockup aprovado da spec 002 (direção A): os textos, os passos, os grupos e os limites
 * saem dele sem mudança. Listas viram objetos de chave numérica (`"1"`, `"2"`…) para o teste de
 * paridade (`chavesFaltantes`) conferir também a quantidade de itens; o componente as lê em ordem
 * com `Object.values`. Os trechos com marcação (`<code>`) entram na página por `set:html`: são
 * texto nosso, nunca de visitante. As saídas do terminal ficam em `terminais.ts`.
 */

import type { Dicionario, Idioma } from "@paginas-vigil/tema/idiomas";

/** Formato dos textos da página: o dicionário `en` é obrigado a seguir o de `pt`. */
export type TextosPagina = typeof pt;

const pt = {
  meta: {
    titulo: "WebVigil: scanner de vulnerabilidades web de código aberto",
    descricao:
      "Scanner de vulnerabilidades web de código aberto. Roda no terminal e no CI. Por padrão só observa, então pode apontar para produção.",
  },
  nome: "WebVigil",
  navegacao: { como: "Como funciona", faz: "O que ele faz", instalar: "Instalar" },
  topo: {
    titulo: "Descubra quais vulnerabilidades seu site possui.",
    apoio:
      "Scanner de vulnerabilidades web de código aberto. Roda no terminal e no CI. Por padrão só observa, então pode apontar para produção. No modo ativo, cada falha é provada contra uma resposta de referência antes de entrar no relatório.",
    fina: "Python 3.12 ou mais novo · Apache-2.0",
    verGithub: "Ver no GitHub",
    comoFunciona: "Como funciona",
    comando: "pipx install webvigil",
  },
  terminal: {
    rotulo: "Exemplo de saída no terminal",
    titulo: "webvigil scan · app de teste do repositório · trecho",
    comando: 'webvigil scan http://127.0.0.1:9100 --mode active --authorized-by "trying WebVigil"',
  },
  como: {
    titulo: "Como funciona",
    lead: "Três passos, no seu terminal.",
    rotuloPasso: "Passo",
    passos: {
      "1": {
        titulo: "Instale",
        texto: "Precisa de Python 3.12 ou mais novo.",
        codigo: "pipx install webvigil",
      },
      "2": {
        titulo: "Escaneie",
        texto: "Por padrão só observa respostas, cabeçalhos, TLS e cookies.",
        codigo: "webvigil scan https://seu-site.com",
      },
      "3": {
        titulo: "Leia o relatório",
        texto:
          "Saída em JSON, SARIF, HTML ou Markdown. Com <code>--fail-on high</code>, o build do CI falha.",
        codigo: "webvigil report scan.json --format html",
      },
    },
  },
  relatorio: {
    titulo: "O relatório em HTML",
    lead: "Um arquivo só, que você abre no navegador ou guarda junto do build. Mostra a contagem por severidade, as bibliotecas vulneráveis e, em cada achado, o local, a explicação e a correção sugerida.",
    legenda:
      "Topo do relatório de um scan ativo do app de teste que acompanha o repositório. O relatório está em inglês.",
    alt: "Relatório HTML do WebVigil: tabela com 4 críticos, 15 altos, 9 médios, 15 baixos e 2 informativos, a biblioteca jQuery 1.7.1 vulnerável e o primeiro achado, injeção de comando no parâmetro host.",
    aviso: {
      rotulo: "Opcional",
      titulo: "O WebVigil também possui um dashboard",
      texto:
        "O scanner disponibiliza um painel web (dashboard) que guarda o histórico dos scans e filtra os achados. Ele não vem no pacote do PyPI: só se baixa direto do repositório, onde o README explica como subir na seção Web UI.",
      link: "Ver o painel no repositório",
    },
  },
  faz: {
    titulo: "O que ele faz",
    grupos: {
      "1": {
        titulo: "Modo seguro",
        intro:
          "É o padrão. Só lê, nunca envia payload de ataque, e por isso pode apontar para produção.",
        itens: {
          "1": {
            titulo: "Cabeçalhos e cookies",
            texto:
              "CSP, proteção contra clickjacking, nosniff, Permissions-Policy, HttpOnly e SameSite.",
          },
          "2": {
            titulo: "TLS e CORS",
            texto: "Configuração de TLS e CORS refletido, só com leituras.",
          },
          "3": {
            titulo: "Bibliotecas vulneráveis",
            texto: "Identifica bibliotecas JavaScript com falhas conhecidas, como jQuery 1.7.1.",
          },
          "4": {
            titulo: "Exposições",
            texto:
              "Depurador ligado, listagem de diretório, IP privado e identificador de sessão na URL.",
          },
          "5": {
            titulo: "CSRF, SRI e conteúdo misto",
            texto: "Formulários sem token e scripts de outra origem sem integridade.",
          },
        },
      },
      "2": {
        titulo: "Modo ativo",
        intro:
          "Exige <code>--mode active</code> e <code>--authorized-by</code>. Para desenvolvimento e homologação. Cada achado é provado contra uma resposta de referência.",
        itens: {
          "1": {
            titulo: "XSS refletido e armazenado",
            texto: "Payloads enviados só ao host alvo, dentro do escopo.",
          },
          "2": {
            titulo: "SQL injection",
            texto: "Confirmada contra a resposta de referência de cada requisição.",
          },
          "3": {
            titulo: "SSRF, injeção de comando e XXE",
            texto: "Com a resposta visível no mesmo canal. XXE só com opt-in.",
          },
          "4": {
            titulo: "Template e expression language",
            texto: "Injeção em motores de template e em linguagens de expressão.",
          },
          "5": {
            titulo: "CRLF, Host header e upload de arquivo",
            texto: "Protocolo e envio de arquivos, com opt-in para o upload.",
          },
        },
      },
    },
  },
  limites: {
    titulo: "O que ele não faz",
    texto:
      "Não encontra falhas cegas (SSRF, injeção de comando e XXE sem resposta visível) nem HTTP request smuggling. Não substitui teste manual com proxy: combine com ZAP ou Nuclei. Use só em sistemas que você tem autorização para testar.",
  },
  final: {
    titulo: "Código aberto, licença Apache-2.0.",
    texto: "Leia o código, rode na sua máquina e abra uma issue se algo não bater.",
    docs: "Ler a documentação",
  },
} satisfies Dicionario;

const en: TextosPagina = {
  meta: {
    titulo: "WebVigil: open-source web vulnerability scanner",
    descricao:
      "An open-source web vulnerability scanner. Runs in the terminal and in CI. By default it only observes, so you can point it at production.",
  },
  nome: "WebVigil",
  navegacao: { como: "How it works", faz: "What it does", instalar: "Install" },
  topo: {
    titulo: "Find out which vulnerabilities your site has.",
    apoio:
      "An open-source web vulnerability scanner. Runs in the terminal and in CI. By default it only observes, so you can point it at production. In active mode, every finding is proven against a reference response before it enters the report.",
    fina: "Python 3.12 or newer · Apache-2.0",
    verGithub: "View on GitHub",
    comoFunciona: "How it works",
    comando: "pipx install webvigil",
  },
  terminal: {
    rotulo: "Terminal output example",
    titulo: "webvigil scan · the test app that ships with the repository · excerpt",
    comando: 'webvigil scan http://127.0.0.1:9100 --mode active --authorized-by "trying WebVigil"',
  },
  como: {
    titulo: "How it works",
    lead: "Three steps, in your terminal.",
    rotuloPasso: "Step",
    passos: {
      "1": {
        titulo: "Install",
        texto: "Needs Python 3.12 or newer.",
        codigo: "pipx install webvigil",
      },
      "2": {
        titulo: "Scan",
        texto: "By default it only observes responses, headers, TLS and cookies.",
        codigo: "webvigil scan https://your-site.com",
      },
      "3": {
        titulo: "Read the report",
        texto:
          "Output as JSON, SARIF, HTML or Markdown. With <code>--fail-on high</code>, the CI build fails.",
        codigo: "webvigil report scan.json --format html",
      },
    },
  },
  relatorio: {
    titulo: "The HTML report",
    lead: "A single file you open in the browser or keep alongside the build. It shows the count by severity, the vulnerable libraries and, for each finding, the location, the explanation and the suggested fix.",
    legenda:
      "Top of the report from an active scan of the test app that ships with the repository.",
    alt: "WebVigil HTML report: table with 4 critical, 15 high, 9 medium, 15 low and 2 info findings, the vulnerable jQuery 1.7.1 library and the first finding, command injection in the host parameter.",
    aviso: {
      rotulo: "Optional",
      titulo: "WebVigil also has a dashboard",
      texto:
        "The scanner provides a web dashboard that keeps the scan history and filters the findings. It is not in the PyPI package: you can only download it directly from the repository, whose README explains how to start it in the Web UI section.",
      link: "See the dashboard in the repository",
    },
  },
  faz: {
    titulo: "What it does",
    grupos: {
      "1": {
        titulo: "Safe mode",
        intro:
          "The default. It only reads and never sends attack payloads, so it can point at production.",
        itens: {
          "1": {
            titulo: "Headers and cookies",
            texto:
              "CSP, clickjacking protection, nosniff, Permissions-Policy, HttpOnly and SameSite.",
          },
          "2": {
            titulo: "TLS and CORS",
            texto: "TLS configuration and reflected CORS, with read-only requests.",
          },
          "3": {
            titulo: "Vulnerable libraries",
            texto:
              "Identifies JavaScript libraries with known vulnerabilities, such as jQuery 1.7.1.",
          },
          "4": {
            titulo: "Exposures",
            texto:
              "Debugger left on, directory listing, private IP and session identifier in the URL.",
          },
          "5": {
            titulo: "CSRF, SRI and mixed content",
            texto: "Forms without a token and cross-origin scripts without integrity.",
          },
        },
      },
      "2": {
        titulo: "Active mode",
        intro:
          "Requires <code>--mode active</code> and <code>--authorized-by</code>. For development and staging. Each finding is proven against a reference response.",
        itens: {
          "1": {
            titulo: "Reflected and stored XSS",
            texto: "Payloads go only to the target host, inside the scope.",
          },
          "2": {
            titulo: "SQL injection",
            texto: "Confirmed against the reference response of each request.",
          },
          "3": {
            titulo: "SSRF, command injection and XXE",
            texto: "When the response is visible in the same channel. XXE is opt-in.",
          },
          "4": {
            titulo: "Template and expression language",
            texto: "Injection in template engines and expression languages.",
          },
          "5": {
            titulo: "CRLF, Host header and file upload",
            texto: "Protocol and file submission, with opt-in for upload.",
          },
        },
      },
    },
  },
  limites: {
    titulo: "What it does not do",
    texto:
      "It does not find blind flaws (SSRF, command injection and XXE with no visible response) or HTTP request smuggling. It does not replace manual testing with a proxy: pair it with ZAP or Nuclei. Use it only on systems you are authorized to test.",
  },
  final: {
    titulo: "Open source, Apache-2.0 license.",
    texto: "Read the code, run it on your machine and open an issue if something is off.",
    docs: "Read the docs",
  },
};

/** Textos da página por idioma. */
export const textos: Record<Idioma, TextosPagina> = { pt, en };
