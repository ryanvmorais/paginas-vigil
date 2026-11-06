/**
 * @file Textos da página do MailVigil, em português e em inglês.
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
    titulo: "MailVigil: analisador de relatórios DMARC de código aberto",
    descricao:
      "Lê os relatórios agregados DMARC, agrupa o tráfego por remetente e dá um veredito sobre p=reject com o critério à mostra. Roda offline.",
  },
  nome: "MailVigil",
  navegacao: { como: "Como funciona", faz: "O que ele faz", instalar: "Instalar" },
  topo: {
    titulo: "Descubra se seu domínio já está pronto para p=reject.",
    apoio:
      "Lê os relatórios agregados que os provedores de e-mail mandam, agrupa o tráfego por remetente e dá um veredito com o critério à mostra. Roda offline, na sua máquina.",
    fina: "Python 3.12 ou mais novo · sem dependências de execução · Apache-2.0",
    verGithub: "Ver no GitHub",
    comoFunciona: "Como funciona",
    comando: "pipx install mailvigil",
  },
  terminal: {
    rotulo: "Exemplo de saída no terminal",
    titulo: "mailvigil verdict --lang pt-BR · relatórios de exemplo (example.com)",
    comando: "mailvigil verdict --config mailvigil.toml reports/ --lang pt-BR",
  },
  como: {
    titulo: "Como funciona",
    lead: "Três passos, no seu terminal.",
    rotuloPasso: "Passo",
    passos: {
      "1": {
        titulo: "Instale",
        texto: "Precisa de Python 3.12 ou mais novo, e de mais nada.",
        codigo: "pipx install mailvigil",
      },
      "2": {
        titulo: "Aponte para os relatórios",
        texto:
          "Lê .xml, .zip, .gz, .eml e .mbox de uma pasta. Com <code>--lang pt-BR</code>, a saída sai em português.",
        codigo: "mailvigil verdict --config mailvigil.toml reports/ --lang pt-BR",
      },
      "3": {
        titulo: "Leia o veredito",
        texto:
          "O veredito diz se já está pronto, se é cedo demais ou se ainda não está. O código de saída serve para scripts e CI: 0 quando está pronto.",
        codigo: "mailvigil verdict reports/ --html > relatorio.html",
      },
    },
  },
  relatorio: {
    titulo: "O relatório em HTML",
    lead: "Um arquivo só, gerado offline, que você abre no navegador ou manda para quem decide. Mostra o veredito, as cinco regras com o limite marcado e o que aconteceu dia a dia. Acompanha o <code>--lang</code>, muda para o escuro com o sistema e imprime em papel.",
    legenda: "Relatório de exemplo de example.com, gerado com --lang pt-BR.",
    alt: "Relatório HTML do MailVigil: veredito NÃO PRONTO para p=reject, porque as falhas de origens não reconhecidas são 0.8% das mensagens e o limite é 0.5%, e as cinco regras com o limite marcado.",
  },
  faz: {
    titulo: "O que ele faz",
    grupos: {
      "1": {
        titulo: "O que ele responde",
        intro: "Uma pergunta só: é seguro mover a política para <code>p=reject</code>?",
        itens: {
          "1": {
            titulo: "Quem envia como o seu domínio",
            texto: "Agrupa o tráfego por remetente e mostra primeiro o que está falhando.",
          },
          "2": {
            titulo: "Se já dá para ir para p=reject",
            texto: "Cinco regras, cada uma medida contra o seu limite, à vista.",
          },
          "3": {
            titulo: "O que os relatórios não cobrem",
            texto:
              "Todo veredito diz o que ficou de fora: e-mail que nenhum provedor reporta não aparece.",
          },
        },
      },
      "2": {
        titulo: "O que ele garante",
        intro: "Os relatórios são seus e o tratamento é conservador.",
        itens: {
          "1": {
            titulo: "Offline",
            texto:
              "Nada é enviado a ninguém. Só o <code>fetch</code> usa a rede, e só para a sua caixa de e-mail.",
          },
          "2": {
            titulo: "Arquivos hostis são esperados",
            texto: "O tamanho descompactado é limitado e XML com DOCTYPE ou ENTITY é recusado.",
          },
          "3": {
            titulo: "Contrato estável",
            texto: "Comandos, códigos de saída e o <code>--json</code> só mudam numa versão major.",
          },
        },
      },
    },
  },
  limites: {
    titulo: "O que ele não faz",
    texto:
      "Não indexa em Elasticsearch, não serve painel web e não envia e-mail. Lê só os relatórios que você entregar.",
  },
  final: {
    titulo: "Código aberto, licença Apache-2.0.",
    texto: "Leia o código, rode na sua máquina e abra uma issue se algo não bater.",
    docs: "Ler a documentação",
  },
} satisfies Dicionario;

const en: TextosPagina = {
  meta: {
    titulo: "MailVigil: open-source DMARC report analyzer",
    descricao:
      "It reads DMARC aggregate reports, groups the traffic by sender and gives a verdict on p=reject with the criterion in plain sight. Runs offline.",
  },
  nome: "MailVigil",
  navegacao: { como: "How it works", faz: "What it does", instalar: "Install" },
  topo: {
    titulo: "Find out if your domain is ready for p=reject.",
    apoio:
      "It reads the aggregate reports that mail providers send you, groups the traffic by sender and gives a verdict with the criterion in plain sight. It runs offline, on your machine.",
    fina: "Python 3.12 or newer · no runtime dependencies · Apache-2.0",
    verGithub: "View on GitHub",
    comoFunciona: "How it works",
    comando: "pipx install mailvigil",
  },
  terminal: {
    rotulo: "Terminal output example",
    titulo: "mailvigil verdict · sample reports (example.com)",
    comando: "mailvigil verdict --config mailvigil.toml reports/",
  },
  como: {
    titulo: "How it works",
    lead: "Three steps, in your terminal.",
    rotuloPasso: "Step",
    passos: {
      "1": {
        titulo: "Install",
        texto: "Needs Python 3.12 or newer, and nothing else.",
        codigo: "pipx install mailvigil",
      },
      "2": {
        titulo: "Point it at the reports",
        texto: "Reads .xml, .zip, .gz, .eml and .mbox from a folder.",
        codigo: "mailvigil verdict --config mailvigil.toml reports/",
      },
      "3": {
        titulo: "Read the verdict",
        texto: "READY, TOO EARLY or NOT READY. The exit code is for scripts and CI: 0 when ready.",
        codigo: "mailvigil verdict reports/ --html > report.html",
      },
    },
  },
  relatorio: {
    titulo: "The HTML report",
    lead: "A single file, generated offline, that you open in the browser or send to whoever decides. It shows the verdict, the five rules with the limit marked and what happened day by day. It follows <code>--lang</code>, switches to dark with the system and prints on paper.",
    legenda: "Sample report for example.com.",
    alt: "MailVigil HTML report: verdict NOT READY for p=reject, because failures from unrecognized sources are 0.8% of the messages and the limit is 0.5%, and the five rules with the limit marked.",
  },
  faz: {
    titulo: "What it does",
    grupos: {
      "1": {
        titulo: "What it answers",
        intro: "One question: is it safe to move your policy to <code>p=reject</code>?",
        itens: {
          "1": {
            titulo: "Who sends mail as your domain",
            texto: "Groups traffic by sender and shows what is failing first.",
          },
          "2": {
            titulo: "Whether you can go to p=reject",
            texto: "Five rules, each measured against its limit, in plain sight.",
          },
          "3": {
            titulo: "What the reports do not cover",
            texto:
              "Every verdict says what was left out: mail that no provider reports does not show up.",
          },
        },
      },
      "2": {
        titulo: "What it guarantees",
        intro: "The reports are yours and the handling is conservative.",
        itens: {
          "1": {
            titulo: "Offline",
            texto:
              "Nothing is sent to anyone. Only <code>fetch</code> uses the network, and only to reach your own mailbox.",
          },
          "2": {
            titulo: "Hostile files are expected",
            texto: "Decompressed size is capped and XML with DOCTYPE or ENTITY is refused.",
          },
          "3": {
            titulo: "Stable contract",
            texto: "Commands, exit codes and <code>--json</code> change only in a major version.",
          },
        },
      },
    },
  },
  limites: {
    titulo: "What it does not do",
    texto:
      "It does not index into Elasticsearch, serve a web dashboard or send email. It reads only the reports you give it.",
  },
  final: {
    titulo: "Open source, Apache-2.0 license.",
    texto: "Read the code, run it on your machine and open an issue if something is off.",
    docs: "Read the docs",
  },
};

/** Textos da página por idioma. */
export const textos: Record<Idioma, TextosPagina> = { pt, en };

/**
 * Convite ao DMARC Fácil, nos dois idiomas. Cada versão aponta para a página do DMARC Fácil no mesmo
 * idioma: o inglês vai para `/en/`, seguindo a convenção de endereços destes sites (inglês sob `/en/`).
 * Fica fora do dicionário porque o `href` também muda por idioma, e a paridade confere só textos.
 */
export const DMARC_FACIL: Record<
  Idioma,
  { href: string; antes: string; rotulo: string; depois: string }
> = {
  pt: {
    href: "https://dmarc-facil.ryanmorais.com.br/",
    antes: "Ainda não publicou DMARC? Comece pelo ",
    rotulo: "DMARC Fácil",
    depois: ".",
  },
  en: {
    href: "https://dmarc-facil.ryanmorais.com.br/en/",
    antes: "Have not published DMARC yet? Start with ",
    rotulo: "DMARC Fácil",
    depois: ".",
  },
};
