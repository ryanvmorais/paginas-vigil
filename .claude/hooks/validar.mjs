/**
 * @file Hook Stop: valida o projeto com ESLint e `tsc` quando o Claude encerra o turno.
 *
 * Se algo falha, escreve os erros no stderr e sai com 2; o Claude Code devolve o relatório ao
 * agente, que corrige antes de terminar. Os testes e o `astro check` ficam de fora de propósito:
 * os testes podem estar legitimamente vermelhos no meio de uma feature, e o `astro check` é lento
 * demais para rodar a cada turno; os dois já rodam no pre-commit e no CI. O `tsc` aqui cobre o
 * pacote `tema`, que é TypeScript puro.
 *
 * Decisões de robustez:
 * - Só valida se há `.ts`, `.astro` ou `.mjs` alterado (via git); mudança só de docs não custa nada.
 * - Sem `node_modules` não bloqueia: problema de ambiente não deve prender o agente.
 * - Respeita `stop_hook_active`: se o erro persiste depois da correção, deixa passar com aviso,
 *   para nunca entrar em laço infinito.
 */

import { spawnSync } from "node:child_process";

import { RAIZ, dependenciasInstaladas, lerEvento, rodar } from "./ferramentas.mjs";

/**
 * Diz se algum `.ts`, `.astro` ou `.mjs` difere do HEAD.
 *
 * @returns {boolean} `true` se algum difere, ou se o git não responde (valida por segurança).
 */
const temCodigoAlterado = () => {
  const resultado = spawnSync("git", ["status", "--porcelain", "--untracked-files=all"], {
    cwd: RAIZ,
    encoding: "utf8",
  });
  if (resultado.status !== 0) return true;
  return resultado.stdout.split("\n").some((linha) => /\.(ts|astro|mjs)$/.test(linha.trim()));
};

const evento = await lerEvento();

if (dependenciasInstaladas() && temCodigoAlterado()) {
  const problemas = [];
  const lint = rodar("eslint", []);
  if (lint.status !== 0) problemas.push(`ESLINT:\n${lint.saida}`);
  const tipos = rodar("tsc", ["--noEmit", "-p", "packages/tema"]);
  if (tipos.status !== 0) problemas.push(`TSC:\n${tipos.saida}`);

  if (problemas.length > 0) {
    const relatorio = problemas.join("\n\n");
    if (evento.stop_hook_active) {
      process.stderr.write(`Aviso: as checagens ainda falham depois da correção:\n\n${relatorio}`);
    } else {
      process.stderr.write(`As checagens falharam. Corrija antes de terminar:\n\n${relatorio}`);
      process.exit(2);
    }
  }
}
