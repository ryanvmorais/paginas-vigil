/**
 * @file Textos que o próprio tema emite, em português e em inglês.
 *
 * São os rótulos de acessibilidade e de controle que os blocos do tema escrevem sozinhos (seletor
 * de idioma, navegação, botão de copiar). O texto de cada site chega por prop ou `slot` e vive no
 * dicionário do app. Os dois idiomas têm o mesmo formato por tipo (`en` é `TextosTema`) e o teste
 * de paridade confere as chaves nas duas direções (RF-10).
 */

import type { Dicionario, Idioma } from "./idiomas";

/** Formato dos textos do tema: o dicionário `en` é obrigado a seguir o de `pt`. */
export type TextosTema = typeof pt;

const pt = {
  seletorIdioma: {
    rotulo: "Idioma",
    pt: "Português",
    en: "English",
  },
  navegacao: {
    rotulo: "Seções",
  },
  rodape: {
    maisProjetos: "Mais projetos",
  },
  copiar: {
    rotulo: "Copiar",
    copiado: "Copiado",
    anuncio: "Comando copiado",
    falhou: "Não foi possível copiar o comando",
  },
} satisfies Dicionario;

const en: TextosTema = {
  seletorIdioma: {
    rotulo: "Language",
    pt: "Português",
    en: "English",
  },
  navegacao: {
    rotulo: "Sections",
  },
  rodape: {
    maisProjetos: "More projects",
  },
  copiar: {
    rotulo: "Copy",
    copiado: "Copied",
    anuncio: "Command copied",
    falhou: "Could not copy the command",
  },
};

/** Textos do tema por idioma. */
export const textos: Record<Idioma, TextosTema> = { pt, en };
