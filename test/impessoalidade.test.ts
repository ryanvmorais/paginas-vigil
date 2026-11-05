/**
 * @file Testes de impessoalidade: o que está versionado é escrito para quem clona o repositório.
 *
 * Nenhum arquivo versionado cita o mantenedor pelo nome, a não ser os de autoria e licença, e o
 * `CLAUDE.md` e o `.claude/` não dependem de comandos (skills) que só existem na máquina de
 * quem mantém o projeto. Instrução e operação que só o mantenedor executa (conta, token,
 * divulgação) ficam fora do repositório. O papel vem no lugar do nome: "o mantenedor".
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// APOIO
// ---------------------------------------------------------------------------

// Relativo a este arquivo (e não ao diretório atual), para o teste rodar de qualquer pasta.
const RAIZ = fileURLToPath(new URL("../", import.meta.url));

// Binários não têm texto a conferir.
const EXTENSOES_BINARIAS = /\.(woff2?|png|jpe?g|webp|ico)$/i;

/**
 * Lista os arquivos versionados. Fora de um clone (um tarball, por exemplo) não há `git`, e o
 * teste não tem o que conferir.
 *
 * @returns Os caminhos relativos à raiz, ou `null` sem repositório git.
 */
const listarVersionados = (): string[] | null => {
  try {
    const saida = execFileSync("git", ["ls-files", "-z"], { cwd: RAIZ, encoding: "utf8" });
    return saida.split("\0").filter(Boolean);
  } catch {
    return null;
  }
};

/**
 * Procura um padrão linha a linha nos arquivos dados.
 *
 * @param arquivos - Caminhos relativos à raiz.
 * @param padrao - O que procurar em cada linha.
 * @returns Uma entrada `arquivo:linha (trecho)` por ocorrência.
 */
const procurar = (arquivos: string[], padrao: RegExp): string[] => {
  const achados: string[] = [];
  for (const arquivo of arquivos) {
    const linhas = readFileSync(`${RAIZ}${arquivo}`, "utf8").split("\n");
    linhas.forEach((linha, indice) => {
      const casou = padrao.exec(linha);
      if (casou) achados.push(`${arquivo}:${indice + 1} (${casou[0]})`);
    });
  }
  return achados;
};

const versionados = listarVersionados();
const semGit = versionados === null;

// ---------------------------------------------------------------------------
// O NOME DO MANTENEDOR
// ---------------------------------------------------------------------------

// Autoria e licença são metadados: o nome fica. Este arquivo cita o nome na regra abaixo.
const PODEM_CITAR_O_NOME = new Set(["LICENSE", "package.json", "test/impessoalidade.test.ts"]);

describe("impessoalidade: o nome do mantenedor", () => {
  it.skipIf(semGit)("só aparece nos arquivos de autoria e licença", () => {
    const alvos = (versionados ?? []).filter(
      (arquivo) => !PODEM_CITAR_O_NOME.has(arquivo) && !EXTENSOES_BINARIAS.test(arquivo),
    );

    // Cite o papel ("o mantenedor") em vez do nome, ou tire o trecho do repositório.
    expect(procurar(alvos, /\bRyan\b/)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// ORIENTAÇÃO PARA O CLAUDE CODE
// ---------------------------------------------------------------------------

// Comandos de skills pessoais: quem clona o repositório não os tem.
const COMANDOS_PESSOAIS =
  /(?<![\w/.-])\/(spec|idioma|estilo-arquivos|fechar-sessao|atualizar-docs|revisar-dependabot|nova-interface|stack|novo-projeto)(?![\w-])/;

describe("impessoalidade: orientação para o Claude Code", () => {
  it.skipIf(semGit)("o CLAUDE.md e o .claude/ não citam skills pessoais", () => {
    const alvos = (versionados ?? []).filter(
      (arquivo) => arquivo === "CLAUDE.md" || arquivo.startsWith(".claude/"),
    );
    expect(alvos.length).toBeGreaterThanOrEqual(2);

    // Descreva a regra no próprio arquivo, sem apontar para a skill.
    expect(procurar(alvos, COMANDOS_PESSOAIS)).toEqual([]);
  });
});
