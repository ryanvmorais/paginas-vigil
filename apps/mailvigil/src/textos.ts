/**
 * @file Textos da página do MailVigil, em português e em inglês.
 *
 * Os textos partiram do mockup aprovado da spec 002 (direção A) e foram revistos, fato a fato, na
 * spec 005 (ver `specs/005-pagina-mailvigil/fatos.md`). Listas viram objetos de chave numérica
 * (`"1"`, `"2"`…) para o teste de paridade (`chavesFaltantes`) conferir também a quantidade de
 * itens; o componente as lê em ordem com `Object.values`. Os trechos com marcação (`<code>`) entram na página por `set:html`: são
 * texto nosso, nunca de visitante. As saídas do terminal ficam em `terminais.ts`.
 */

import type { Dicionario, Idioma } from "@paginas-vigil/tema/idiomas";

/** Formato dos textos da página: o dicionário `en` é obrigado a seguir o de `pt`. */
export type TextosPagina = typeof pt;

const pt = {
  meta: {
    titulo: "MailVigil: analisador de relatórios DMARC de código aberto",
    descricao:
      "Lê os relatórios agregados DMARC, agrupa o tráfego por remetente e dá um veredito sobre p=reject com o critério à mostra. Lê a pasta sem usar a rede.",
  },
  nome: "MailVigil",
  navegacao: {
    como: "Como funciona",
    relatorio: "Relatório",
    faz: "O que ele faz",
    instalar: "Instalar",
  },
  topo: {
    titulo: "Descubra se seu domínio já está pronto para p=reject.",
    apoio:
      "Lê os relatórios agregados que os provedores de e-mail mandam, agrupa o tráfego por remetente e dá um veredito com o critério à mostra. Lê a pasta offline, na sua máquina; só o fetch, opcional, usa a rede.",
    fina: "Python 3.12 ou mais novo · Sem dependências de execução · Apache-2.0",
    verGithub: "Ver no GitHub",
    comoFunciona: "Como funciona",
    comando: "pipx install mailvigil",
  },
  terminal: {
    rotulo: "Exemplo de saída no terminal",
    titulo: "Trecho da saída · relatórios de exemplo (example.com)",
    comando: "mailvigil verdict --domain example.com reports/ --lang pt-BR",
  },
  como: {
    titulo: "Como funciona",
    lead: "Três passos, no seu terminal.",
    rotuloPasso: "Passo",
    passos: {
      "1": {
        titulo: "Instale",
        texto: "Precisa de Python 3.12 ou mais novo e do pipx (ou do uv). Mais nada.",
        codigo: "pipx install mailvigil",
      },
      "2": {
        titulo: "Aponte para os relatórios",
        texto:
          "Lê .xml, .zip, .gz, .eml e .mbox de uma pasta. Troque <code>seu-dominio.com</code> pelo seu domínio; com <code>--lang pt-BR</code>, a saída sai em português. Um <code>mailvigil.toml</code> opcional dá nome aos remetentes reconhecidos.",
        codigo: "mailvigil verdict --domain seu-dominio.com reports/ --lang pt-BR",
      },
      "3": {
        titulo: "Leia o veredito",
        texto:
          "O veredito é PRONTO, CEDO DEMAIS ou NÃO PRONTO. O código de saída serve para scripts e CI: 0 para pronto, 3 para cedo demais, 4 para não pronto.",
        codigo:
          "mailvigil verdict --domain seu-dominio.com reports/ --lang pt-BR --html --output relatorio.html",
      },
    },
  },
  relatorio: {
    titulo: "O relatório em HTML",
    lead: "Um arquivo só, gerado offline, que você abre no navegador ou manda para quem decide. Abre com o veredito e as cinco regras, cada uma com o limite marcado; mais abaixo vêm o dia a dia e a tabela de remetentes. Acompanha o <code>--lang</code> e muda para o tema escuro conforme o sistema.",
    // U+2060 (junção de palavras, invisível) impede a quebra de linha dentro da flag (spec 005, RF-04).
    legenda: "Começo do relatório de example.com, gerado com -⁠-⁠lang pt-⁠BR.",
    alt: "Relatório HTML do MailVigil: veredito NÃO PRONTO para p=reject, porque as falhas de origens não reconhecidas são 0.8% das mensagens e o limite é 0.5%; abaixo, as cinco regras, cada uma com o limite marcado, e só a das falhas não reconhecidas falha.",
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
            texto: "Agrupa o tráfego por remetente e destaca o que está falhando.",
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
              "Nada é enviado a ninguém. Só o <code>fetch</code> usa a rede: ele se conecta por IMAP à sua caixa de e-mail, pede a senha e só lê as mensagens.",
          },
          "2": {
            titulo: "Arquivos hostis são esperados",
            texto: "O tamanho descompactado é limitado e XML com DOCTYPE ou ENTITY é recusado.",
          },
          "3": {
            titulo: "Contrato estável",
            texto:
              "Comandos, códigos de saída e o <code>--json</code> só mudam numa versão major. O texto da saída e os limites do veredito ficam fora do contrato.",
          },
        },
      },
    },
  },
  limites: {
    titulo: "O que ele não faz",
    texto:
      "Não indexa em Elasticsearch, não serve painel web e não envia e-mail. Lê só os relatórios que você entregar: os de uma pasta ou os que o fetch baixar da sua caixa.",
  },
  final: {
    titulo: "Código aberto, licença Apache-2.0.",
    texto: "Leia o código, rode na sua máquina e abra uma issue se encontrar um erro.",
    docs: "Ler a documentação",
  },
} satisfies Dicionario;

const en: TextosPagina = {
  meta: {
    titulo: "MailVigil: open-source DMARC report analyzer",
    descricao:
      "It reads DMARC aggregate reports, groups traffic by sender and gives a verdict on p=reject with the criterion in plain sight. It reads the folder offline.",
  },
  nome: "MailVigil",
  navegacao: {
    como: "How it works",
    relatorio: "Report",
    faz: "What it does",
    instalar: "Install",
  },
  topo: {
    titulo: "Find out if your domain is ready for p=reject.",
    apoio:
      "It reads the aggregate reports that mail providers send you, groups the traffic by sender and gives a verdict with the criterion in plain sight. It reads the folder offline, on your machine; only fetch, which is optional, uses the network.",
    fina: "Python 3.12 or newer · No runtime dependencies · Apache-2.0",
    verGithub: "View on GitHub",
    comoFunciona: "How it works",
    comando: "pipx install mailvigil",
  },
  terminal: {
    rotulo: "Terminal output example",
    titulo: "Output excerpt · sample reports (example.com)",
    comando: "mailvigil verdict --domain example.com reports/",
  },
  como: {
    titulo: "How it works",
    lead: "Three steps, in your terminal.",
    rotuloPasso: "Step",
    passos: {
      "1": {
        titulo: "Install",
        texto: "Needs Python 3.12 or newer and pipx (or uv). Nothing else.",
        codigo: "pipx install mailvigil",
      },
      "2": {
        titulo: "Point it at the reports",
        texto:
          "Reads .xml, .zip, .gz, .eml and .mbox from a folder. Replace <code>your-domain.com</code> with your domain. An optional <code>mailvigil.toml</code> names the senders it should recognize.",
        codigo: "mailvigil verdict --domain your-domain.com reports/",
      },
      "3": {
        titulo: "Read the verdict",
        texto:
          "The verdict is READY, TOO EARLY or NOT READY. The exit code is for scripts and CI: 0 for ready, 3 for too early, 4 for not ready.",
        codigo: "mailvigil verdict --domain your-domain.com reports/ --html --output report.html",
      },
    },
  },
  relatorio: {
    titulo: "The HTML report",
    lead: "A single file, generated offline, that you open in the browser or send to whoever decides. It opens with the verdict and the five rules, each with its limit marked; further down come the day-by-day view and the senders table. It follows <code>--lang</code> and switches to the dark theme to match the system.",
    legenda: "Start of the sample report for example.com.",
    alt: "MailVigil HTML report: verdict NOT READY for p=reject, because failures from unrecognized sources are 0.8% of the messages and the limit is 0.5%; below, the five rules, each with its limit marked, and only the unrecognized-failures one fails.",
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
            texto: "Groups traffic by sender and highlights what is failing.",
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
              "Nothing is sent to anyone. Only <code>fetch</code> uses the network: it connects over IMAP to your own mailbox, asks for the password and only reads the messages.",
          },
          "2": {
            titulo: "Hostile files are expected",
            texto: "Decompressed size is capped and XML with DOCTYPE or ENTITY is refused.",
          },
          "3": {
            titulo: "Stable contract",
            texto:
              "Commands, exit codes and <code>--json</code> change only in a major version. The output text and the verdict limits are outside the contract.",
          },
        },
      },
    },
  },
  limites: {
    titulo: "What it does not do",
    texto:
      "It does not index into Elasticsearch, serve a web dashboard or send email. It reads only the reports you give it: those in a folder or those fetch downloads from your mailbox.",
  },
  final: {
    titulo: "Open source, Apache-2.0 license.",
    texto: "Read the code, run it on your machine and open an issue if you find a bug.",
    docs: "Read the docs",
  },
};

/** Textos da página por idioma. */
export const textos: Record<Idioma, TextosPagina> = { pt, en };

/**
 * Convite ao DMARC Fácil, nos dois idiomas. O DMARC Fácil publicado só existe em português: a versão
 * em inglês aponta para a mesma página e avisa no texto ("in Portuguese"), em vez de um endereço
 * `/en/` que ainda não existe. Fica fora do dicionário porque o texto em volta do link muda por
 * idioma, e a paridade confere só textos.
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
    href: "https://dmarc-facil.ryanmorais.com.br/",
    antes: "Have not published DMARC yet? Start with ",
    rotulo: "DMARC Fácil",
    depois: " (in Portuguese).",
  },
};
