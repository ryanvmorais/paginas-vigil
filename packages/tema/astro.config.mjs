/**
 * @file Configuração mínima do Astro do pacote do tema.
 *
 * O tema não é um site: não tem páginas nem build. Este arquivo existe só para o `astro check`
 * (script `typecheck`) achar o projeto e checar os tipos dos `.astro` do pacote. O aviso
 * "Missing pages directory" que ele imprime é esperado e inofensivo.
 */

import { defineConfig } from "astro/config";

export default defineConfig({});
