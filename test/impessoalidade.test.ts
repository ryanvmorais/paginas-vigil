/**
 * @file Testes de impessoalidade: o que está versionado é escrito para quem clona o repositório.
 *
 * Nenhum arquivo versionado cita o mantenedor pelo nome, a não ser os de autoria e licença, nem
 * depende de comandos (skills), pastas, documentos ou rotinas que só existem na máquina de quem
 * mantém o projeto. Instrução e operação que só o mantenedor executa (conta, token, divulgação,
 * pendência de conferência) ficam fora do repositório. O papel vem no lugar do nome: "o mantenedor".
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// APOIO
// ---------------------------------------------------------------------------

// Relativo a este arquivo (e não ao diretório atual), para o teste rodar de qualquer pasta.
const RAIZ = fileURLToPath(new URL("../", import.meta.url));

// Este arquivo cita, nas regras abaixo, justamente o que proíbe nos demais.
const ESTE_TESTE = "test/impessoalidade.test.ts";

// Binários e o lockfile (gerado) não têm texto de autoria a conferir.
const EXTENSOES_BINARIAS = /\.(woff2?|png|jpe?g|webp|ico)$/i;
const LOCKFILE = "pnpm-lock.yaml";

// Fora de um clone (um tarball, por exemplo) não há `.git`, e o teste não tem o que conferir. Dentro
// de um clone, um `git ls-files` que falha derruba o teste com o erro, em vez de virar um `skip`
// silencioso que não confere nada.
const semGit = !existsSync(`${RAIZ}.git`);

/**
 * Lista os arquivos versionados.
 *
 * @returns Os caminhos relativos à raiz.
 */
const listarVersionados = (): string[] => {
  const saida = execFileSync("git", ["ls-files", "-z"], { cwd: RAIZ, encoding: "utf8" });
  return saida.split("\0").filter(Boolean);
};

/**
 * Procura um padrão no texto inteiro de cada arquivo, e não linha a linha: uma frase quebrada em
 * duas linhas pelo Prettier continua sendo uma frase só.
 *
 * @param arquivos - Caminhos relativos à raiz.
 * @param padrao - O que procurar; pode atravessar quebras de linha.
 * @returns Uma entrada `arquivo:linha (trecho)` por ocorrência, com a linha em que o trecho começa.
 */
const procurar = (arquivos: string[], padrao: RegExp): string[] => {
  const global = new RegExp(
    padrao.source,
    padrao.flags.includes("g") ? padrao.flags : `${padrao.flags}g`,
  );
  const achados: string[] = [];
  for (const arquivo of arquivos) {
    const texto = readFileSync(`${RAIZ}${arquivo}`, "utf8");
    for (const casou of texto.matchAll(global)) {
      const linha = texto.slice(0, casou.index).split("\n").length;
      achados.push(`${arquivo}:${linha} (${casou[0].replace(/\s+/g, " ")})`);
    }
  }
  return achados;
};

const versionados = semGit ? [] : listarVersionados();

// Todo arquivo versionado com texto a conferir, menos este teste.
const comTexto = (): string[] =>
  versionados.filter(
    (arquivo) =>
      arquivo !== ESTE_TESTE && arquivo !== LOCKFILE && !EXTENSOES_BINARIAS.test(arquivo),
  );

// ---------------------------------------------------------------------------
// O NOME DO MANTENEDOR
// ---------------------------------------------------------------------------

// Autoria e licença são metadados: o nome fica.
const PODEM_CITAR_O_NOME = new Set(["LICENSE", "package.json"]);

const NOME_DO_MANTENEDOR = /\bRyan\b/;

describe("impessoalidade: os arquivos conferidos", () => {
  it.skipIf(semGit)(
    "são os versionados com texto, sem este teste, o lockfile e os binários",
    () => {
      const alvos = comTexto();

      expect(alvos).toEqual(
        expect.arrayContaining([
          "CLAUDE.md",
          "README.md",
          "LICENSE",
          "packages/tema/src/scripts/consentimento.ts",
          "apps/webvigil/src/textos.ts",
        ]),
      );
      expect(alvos).not.toContain(ESTE_TESTE);
      expect(alvos).not.toContain(LOCKFILE);
      expect(versionados).toContain("apps/webvigil/public/apple-touch-icon.png");
      expect(alvos.filter((arquivo) => EXTENSOES_BINARIAS.test(arquivo))).toEqual([]);
    },
  );

  it.skipIf(semGit)("são procurados no texto inteiro, com a linha onde o trecho começa", () => {
    // Controle positivo do `procurar`: um trecho que existe, quebrado em duas linhas.
    expect(procurar(["LICENSE"], /Apache License\s+Version 2\.0/)).toEqual([
      "LICENSE:1 (Apache License Version 2.0)",
    ]);
    expect(procurar(["LICENSE"], /1\. Definitions\./)).toEqual(["LICENSE:7 (1. Definitions.)"]);
  });
});

describe("impessoalidade: o nome do mantenedor", () => {
  it.skipIf(semGit)("só aparece nos arquivos de autoria e licença", () => {
    const alvos = comTexto().filter((arquivo) => !PODEM_CITAR_O_NOME.has(arquivo));

    // Cite o papel ("o mantenedor") em vez do nome, ou tire o trecho do repositório.
    expect(procurar(alvos, NOME_DO_MANTENEDOR)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// FERRAMENTAS E ROTINA PESSOAIS
// ---------------------------------------------------------------------------

// Comandos de skills pessoais: quem clona o repositório não os tem. O `(?<![\w/.-])` deixa passar
// caminhos como `docs/stack.md` e `../specs/`.
const COMANDOS_PESSOAIS =
  /(?<![\w/.-])\/(spec|idioma|estilo-arquivos|fechar-sessao|atualizar-docs|atualizar-dependencias|atualizar-ferramentas|auditoria-[a-z]+|enxugar-memoria|revisar-dependabot|limpar-branches|nova-interface|novo-projeto|preparar-release|qualidade-python|stack)(?![\w-])/;

// Pastas e caminhos da máquina de quem mantém o projeto.
const CAMINHOS_PESSOAIS = /orientacoes-pessoais|~\/\.claude|[A-Za-z]:[\\/]Users[\\/]/;

// Padrões do fluxo pessoal do mantenedor. A quem clona importa o fato por trás (por exemplo, "o scan
// escreve no app de teste"), não quem autoriza ou avisa.
const FLUXO_PESSOAL =
  /autoriza(?:ção|r)[^.]*?\bmantenedor|avis(?:ar|ado) (?:o )?mantenedor|depois de avisar|Escrito para:/i;

// Rótulos de pendência ou de plano interno: uma lacuna conhecida ou o que falta conferir depois do
// deploy mora na memória do projeto, não em spec, README ou comentário.
const PENDENCIA_INTERNA = /\*\*(?:Pendente|Pendência|Depois do deploy|Só depois do deploy)\b/;

// Documento ou ferramenta fora do repositório: quem clona não os alcança, então nada versionado
// pode depender deles.
const REFERENCIA_PRIVADA = /guia de operação|\bArtifact\b/;

// Outro projeto do autor, citado como contexto de uma decisão ("no modelo do ...", "o site irmão").
// O DMARC Fácil só aparece onde o MailVigil o apresenta de propósito, como convite com link: o
// código do site, o item de rodapé do tema (spec 002) e a página do MailVigil (spec 005).
const OUTRO_PROJETO = /DMARC F[áa]cil|dmarc-facil|site irmão/i;
const PODEM_CITAR_O_DMARC_FACIL = (arquivo: string): boolean =>
  arquivo.startsWith("apps/mailvigil/src/") ||
  arquivo.startsWith("specs/002-tema/") ||
  arquivo.startsWith("specs/005-pagina-mailvigil/");

describe("impessoalidade: ferramentas e rotina pessoais", () => {
  it.skipIf(semGit)("nenhum arquivo cita skills pessoais", () => {
    const alvos = comTexto();
    expect(alvos).toContain("CLAUDE.md");

    // Descreva a regra no próprio arquivo, sem apontar para a skill.
    expect(procurar(alvos, COMANDOS_PESSOAIS)).toEqual([]);
  });

  it.skipIf(semGit)(
    "nenhum arquivo aponta para pastas ou caminhos da máquina do mantenedor",
    () => {
      expect(procurar(comTexto(), CAMINHOS_PESSOAIS)).toEqual([]);
    },
  );

  it.skipIf(semGit)("nenhum arquivo descreve a rotina pessoal do mantenedor", () => {
    // Diga o fato (o que o comando faz, o que ele escreve) em vez de quem autoriza ou avisa.
    expect(procurar(comTexto(), FLUXO_PESSOAL)).toEqual([]);
  });

  it.skipIf(semGit)("nenhum arquivo traz marcador de pendência interna", () => {
    // Pendência e lacuna conhecida ficam na memória do projeto; documente só o limite factual.
    expect(procurar(comTexto(), PENDENCIA_INTERNA)).toEqual([]);
  });

  it.skipIf(semGit)("nenhum arquivo depende de documento ou ferramenta privada", () => {
    // Descreva o comportamento no próprio arquivo (por exemplo, os dois caminhos de volta do
    // deploy), em vez de apontar para um documento ou ferramenta fora do repositório.
    expect(procurar(comTexto(), REFERENCIA_PRIVADA)).toEqual([]);
  });

  it.skipIf(semGit)("nenhum arquivo cita outro projeto do autor como contexto", () => {
    const alvos = comTexto().filter((arquivo) => !PODEM_CITAR_O_DMARC_FACIL(arquivo));

    // Diga o fato e o motivo da escolha, sem "no modelo do ..." nem a história de outro projeto.
    expect(procurar(alvos, OUTRO_PROJETO)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// OS PADRÕES ACUSAM O QUE DIZEM PROIBIR
// ---------------------------------------------------------------------------

// Os testes acima pedem zero ocorrências, o que um padrão que nunca casa também dá. Cada palavra de
// cada padrão tem aqui um caso que ele acusa, na ordem e na grafia do padrão, e um quase-acerto que
// ele deixa passar. Uma palavra tirada do padrão derruba o caso dela.
const ACUSA: [string, RegExp, string[]][] = [
  ["o nome do mantenedor", NOME_DO_MANTENEDOR, ["por Ryan."]],
  [
    "os comandos pessoais",
    COMANDOS_PESSOAIS,
    [
      "rode /spec antes",
      "rode /idioma antes",
      "rode /estilo-arquivos antes",
      "rode /fechar-sessao antes",
      "rode /atualizar-docs antes",
      "rode /atualizar-dependencias antes",
      "rode /atualizar-ferramentas antes",
      "rode /auditoria-testes antes",
      "rode /enxugar-memoria antes",
      "rode /revisar-dependabot antes",
      "rode /limpar-branches antes",
      "rode /nova-interface antes",
      "rode /novo-projeto antes",
      "rode /preparar-release antes",
      "rode /qualidade-python antes",
      "rode /stack antes",
      "(/spec)",
    ],
  ],
  [
    "os caminhos pessoais",
    CAMINHOS_PESSOAIS,
    ["em orientacoes-pessoais/", "em ~/.claude/skills", "em C:\\Users\\x", "em c:/Users/x"],
  ],
  [
    "o fluxo pessoal",
    FLUXO_PESSOAL,
    [
      "com a autorização do mantenedor",
      "sem autorizar o mantenedor",
      "avisar o mantenedor",
      "avisado mantenedor",
      "depois de avisar",
      "Escrito para: alguém",
    ],
  ],
  [
    "a pendência interna",
    PENDENCIA_INTERNA,
    ["**Pendente:**", "**Pendência:**", "**Depois do deploy:**", "**Só depois do deploy:**"],
  ],
  ["a referência privada", REFERENCIA_PRIVADA, ["no guia de operação", "num Artifact"]],
  [
    "o outro projeto",
    OUTRO_PROJETO,
    ["o DMARC Fácil", "o DMARC Facil", "o dmarc-facil", "o site irmão", "o Site Irmão"],
  ],
];

const DEIXA_PASSAR: [string, RegExp, string[]][] = [
  ["o nome do mantenedor", NOME_DO_MANTENEDOR, ["Ryanair", "ryan"]],
  [
    "os comandos pessoais",
    COMANDOS_PESSOAIS,
    ["docs/stack.md", "../specs/", "a/spec", "/stacks", "/spec-x", "/auditoria-"],
  ],
  ["os caminhos pessoais", CAMINHOS_PESSOAIS, ["orientacoes pessoais", "~/claude", "C:Users\\x"]],
  ["o fluxo pessoal", FLUXO_PESSOAL, ["a autorização. O mantenedor", "avisar a equipe"]],
  ["a pendência interna", PENDENCIA_INTERNA, ["Pendente:", "**Pendentes:**"]],
  ["a referência privada", REFERENCIA_PRIVADA, ["Artifacts", "guia de instalação"]],
  ["o outro projeto", OUTRO_PROJETO, ["DMARC", "site do irmão"]],
];

describe("impessoalidade: os padrões", () => {
  describe.each(ACUSA)("de %s", (_nome, padrao, casos) => {
    it.each(casos)("acusam %j", (caso) => {
      expect(caso).toMatch(padrao);
    });
  });

  describe.each(DEIXA_PASSAR)("de %s", (_nome, padrao, casos) => {
    it.each(casos)("deixam passar %j", (caso) => {
      expect(caso).not.toMatch(padrao);
    });
  });
});
