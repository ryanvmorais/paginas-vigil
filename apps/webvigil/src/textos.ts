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
      "Scanner de vulnerabilidades web de código aberto. Roda no terminal e no CI. Por padrão só observa, então você pode apontar para produção.",
  },
  nome: "WebVigil",
  navegacao: {
    como: "Como funciona",
    relatorio: "Relatório",
    faz: "O que ele faz",
    instalar: "Instalar",
  },
  topo: {
    titulo: "Descubra quais vulnerabilidades seu site possui.",
    apoio:
      "Scanner de vulnerabilidades web de código aberto. Roda no terminal e no CI. Por padrão só observa, então você pode apontar para produção. O modo ativo, que você liga de propósito, prova cada falha contra uma resposta de referência antes de ela entrar no relatório.",
    fina: "Python 3.12 ou mais novo · Apache-2.0",
    verGithub: "Ver no GitHub",
    comoFunciona: "Como funciona",
    comando: "pipx install webvigil",
  },
  terminal: {
    rotulo: "Exemplo de saída no terminal",
    titulo: "webvigil scan · app de teste do repositório · trecho em inglês",
    comando: 'webvigil scan http://127.0.0.1:9100 --mode active --authorized-by "trying WebVigil"',
  },
  como: {
    titulo: "Como funciona",
    lead: "Três passos, no seu terminal.",
    rotuloPasso: "Passo",
    passos: {
      "1": {
        titulo: "Instale",
        texto: "Precisa do Python 3.12 ou mais novo.",
        codigo: "pipx install webvigil",
      },
      "2": {
        titulo: "Escaneie",
        texto: "Por padrão só observa respostas, cabeçalhos, TLS e cookies.",
        codigo: "webvigil scan https://seu-site.com --format json --output scan.json",
      },
      "3": {
        titulo: "Leia o relatório",
        texto:
          "Gere o relatório no formato que preferir: JSON, SARIF, HTML ou Markdown. Com <code>--fail-on high</code>, o build do CI falha.",
        codigo: "webvigil report scan.json --format html",
      },
    },
  },
  relatorio: {
    titulo: "O relatório em HTML",
    lead: "Um arquivo só, que você abre no navegador ou guarda junto do build. Mostra a contagem por severidade, as bibliotecas detectadas (com as vulneráveis marcadas) e, em cada achado, o local, a explicação e a correção sugerida.",
    legenda:
      "Topo do relatório de um scan ativo do app de teste que acompanha o repositório. O relatório está em inglês.",
    alt: "Relatório HTML do WebVigil: tabela com 4 críticos, 15 altos, 9 médios, 15 baixos e 2 informativos, o primeiro achado (injeção de comando no parâmetro host) e, na versão para tela larga, a tabela de bibliotecas detectadas, com o jQuery 1.7.1 marcado como vulnerável.",
    aviso: {
      rotulo: "Opcional",
      titulo: "O WebVigil também possui um painel web",
      texto:
        "Inicie scans por um formulário, acompanhe o histórico, filtre os achados e baixe o relatório, tudo no navegador. Pensado para uso local, por uma pessoa. Ele não vem no pacote do PyPI: usa a API do WebVigil (pacote webvigil[web]) e o código do painel, que está só no repositório. O README explica como subir tudo na seção Web UI.",
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
            texto: "Configuração de TLS e CORS que repete a origem recebida, só com leituras.",
          },
          "3": {
            titulo: "Bibliotecas vulneráveis",
            texto: "Identifica bibliotecas JavaScript com falhas conhecidas, como jQuery 1.7.1.",
          },
          "4": {
            titulo: "Exposições",
            texto:
              "Depurador exposto, listagem de diretório, IP privado e identificador de sessão na URL.",
          },
          "5": {
            titulo: "CSRF, SRI e conteúdo misto",
            texto:
              "Formulários sem token, scripts de outra origem sem integridade e recursos HTTP em páginas HTTPS.",
          },
        },
      },
      "2": {
        titulo: "Modo ativo",
        intro:
          "Exige <code>--mode active</code> e <code>--authorized-by</code>. Para desenvolvimento e homologação, não para produção. Cada achado é provado contra uma resposta de referência. O que escreve no alvo ou envia dados só roda com uma flag a mais, indicada no item.",
        itens: {
          "1": {
            titulo: "XSS refletido e armazenado",
            texto:
              "Payloads enviados só ao host alvo, dentro do escopo. O armazenado exige <code>--stored-xss</code>.",
          },
          "2": {
            titulo: "SQL injection",
            texto: "Confirmada contra a resposta de referência de cada requisição.",
          },
          "3": {
            titulo: "SSRF, injeção de comando e XXE",
            texto: "Com a resposta visível no mesmo canal. O XXE exige <code>--xxe</code>.",
          },
          "4": {
            titulo: "Template e expression language",
            texto: "Injeção em motores de template e em linguagens de expressão.",
          },
          "5": {
            titulo: "CRLF, Host header e upload de arquivo",
            texto: "Protocolo e envio de arquivos. O upload exige <code>--file-upload</code>.",
          },
        },
      },
    },
  },
  limites: {
    titulo: "O que ele não faz",
    texto:
      "Não encontra falhas cegas (SSRF, injeção de comando e XXE sem resposta visível) nem HTTP request smuggling. Não substitui o teste manual com proxy (use o ZAP) nem a busca por CVEs conhecidos por template (use o Nuclei). Não executa JavaScript: aplicações que montam a página no navegador (SPAs) expõem pouco ao rastreador. Use só em sistemas que você tem autorização para testar.",
  },
  final: {
    titulo: "Código aberto, licença Apache-2.0.",
    texto: "Leia o código, rode na sua máquina e abra uma issue se encontrar um erro.",
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
  navegacao: {
    como: "How it works",
    relatorio: "Report",
    faz: "What it does",
    instalar: "Install",
  },
  topo: {
    titulo: "Find out which vulnerabilities your site has.",
    apoio:
      "An open-source web vulnerability scanner. Runs in the terminal and in CI. By default it only observes, so you can point it at production. Active mode, which you turn on deliberately, proves every finding against a reference response before it enters the report.",
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
        codigo: "webvigil scan https://your-site.com --format json --output scan.json",
      },
      "3": {
        titulo: "Read the report",
        texto:
          "Generate the report in the format you prefer: JSON, SARIF, HTML or Markdown. With <code>--fail-on high</code>, the CI build fails.",
        codigo: "webvigil report scan.json --format html",
      },
    },
  },
  relatorio: {
    titulo: "The HTML report",
    lead: "A single file you open in the browser or keep alongside the build. It shows the count by severity, the detected libraries (with the vulnerable ones marked) and, for each finding, the location, the explanation and the suggested fix.",
    legenda:
      "Top of the report from an active scan of the test app that ships with the repository.",
    alt: "WebVigil HTML report: table with 4 critical, 15 high, 9 medium, 15 low and 2 info findings, the first finding (command injection in the host parameter) and, in the wide-screen version, the table of detected libraries, with jQuery 1.7.1 marked as vulnerable.",
    aviso: {
      rotulo: "Optional",
      titulo: "WebVigil also has a web dashboard",
      texto:
        "Start scans from a form, browse the scan history, filter the findings and download the report, all in the browser. Built for local use, by one person. It is not in the PyPI package: it uses the WebVigil API (the webvigil[web] package) and the dashboard code, which is only in the repository. The README explains how to start everything in the Web UI section.",
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
            texto:
              "TLS configuration and CORS that echoes the origin it receives, with read-only requests.",
          },
          "3": {
            titulo: "Vulnerable libraries",
            texto:
              "Identifies JavaScript libraries with known vulnerabilities, such as jQuery 1.7.1.",
          },
          "4": {
            titulo: "Exposures",
            texto:
              "Debugger exposed, directory listing, private IP and session identifier in the URL.",
          },
          "5": {
            titulo: "CSRF, SRI and mixed content",
            texto:
              "Forms without a token, cross-origin scripts without integrity and HTTP resources on HTTPS pages.",
          },
        },
      },
      "2": {
        titulo: "Active mode",
        intro:
          "Requires <code>--mode active</code> and <code>--authorized-by</code>. For development and staging, not for production. Each finding is proven against a reference response. Anything that writes to the target or sends data only runs with an extra flag, shown on the item.",
        itens: {
          "1": {
            titulo: "Reflected and stored XSS",
            texto:
              "Payloads go only to the target host, inside the scope. Stored XSS requires <code>--stored-xss</code>.",
          },
          "2": {
            titulo: "SQL injection",
            texto: "Confirmed against the reference response of each request.",
          },
          "3": {
            titulo: "SSRF, command injection and XXE",
            texto:
              "When the response is visible in the same channel. XXE requires <code>--xxe</code>.",
          },
          "4": {
            titulo: "Template and expression language",
            texto: "Injection in template engines and expression languages.",
          },
          "5": {
            titulo: "CRLF, Host header and file upload",
            texto: "Protocol and file submission. File upload requires <code>--file-upload</code>.",
          },
        },
      },
    },
  },
  limites: {
    titulo: "What it does not do",
    texto:
      "It does not find blind flaws (SSRF, command injection and XXE with no visible response) or HTTP request smuggling. It does not replace manual testing with a proxy (use ZAP) or the search for known CVEs by template (use Nuclei). It does not run JavaScript: applications that build the page in the browser (SPAs) expose little to the crawler. Use it only on systems you are authorized to test.",
  },
  final: {
    titulo: "Open source, Apache-2.0 license.",
    texto: "Read the code, run it on your machine and open an issue if you find a bug.",
    docs: "Read the docs",
  },
};

/** Textos da página por idioma. */
export const textos: Record<Idioma, TextosPagina> = { pt, en };
