/**
 * @file Configuração flat do ESLint.
 *
 * Cobre TypeScript (`typescript-eslint`) e arquivos `.astro` (`eslint-plugin-astro`). O Prettier
 * cuida do estilo; o ESLint 10 não traz regra de formatação no preset recomendado, então não há o
 * que desligar. Os `ignores` seguem o `.prettierignore`.
 */

import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

const configuracao = [
  { ignores: ["**/node_modules/**", "**/dist/**", "**/.astro/**", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    // Regras além do recomendado: igualdade estrita e nada de `var`.
    rules: {
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  {
    // Páginas e componentes rodam no navegador (e no build, em Node).
    files: ["**/*.astro", "**/*.ts"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    // Configs e hooks do Claude rodam só em Node.
    files: ["**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
];

export default configuracao;
