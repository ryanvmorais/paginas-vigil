/**
 * @file Textos que o próprio tema emite, em português e em inglês.
 *
 * São os rótulos de acessibilidade e de controle que os blocos do tema escrevem sozinhos (seletor
 * de idioma, navegação, botão de copiar, banner de consentimento e links do rodapé). O texto de
 * cada site chega por prop ou `slot` e vive no dicionário do app. Os dois idiomas têm o mesmo
 * formato por tipo (`en` é `TextosTema`) e o teste de paridade confere as chaves nas duas
 * direções (RF-10).
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
    menu: "Seções",
  },
  rodape: {
    maisProjetos: "Mais projetos",
    politica: "Política de Privacidade",
    gerenciar: "Gerenciar Cookies",
  },
  copiar: {
    rotulo: "Copiar",
    copiado: "Copiado",
    anuncio: "Comando copiado",
    falhou: "Não foi possível copiar o comando",
  },
  consentimento: {
    titulo: "Privacidade & Cookies",
    texto:
      "Utilizo cookies para entender quais conteúdos são mais acessados e melhorar o site. Eles só são ativados se você aceitar.",
    saibaMais: "Saiba mais na",
    politica: "Política de Privacidade",
    foraDoIdioma: "(em português)",
    aceitar: "Aceitar",
    recusar: "Recusar",
    fechar: "Fechar e recusar cookies",
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
    menu: "Sections",
  },
  rodape: {
    maisProjetos: "More projects",
    politica: "Privacy Policy",
    gerenciar: "Manage Cookies",
  },
  copiar: {
    rotulo: "Copy",
    copiado: "Copied",
    anuncio: "Command copied",
    falhou: "Could not copy the command",
  },
  consentimento: {
    titulo: "Privacy & Cookies",
    texto:
      "I use cookies to understand which content is most visited and to improve the site. They are only enabled if you accept.",
    saibaMais: "Learn more in the",
    politica: "Privacy Policy",
    foraDoIdioma: "(in Portuguese)",
    aceitar: "Accept",
    recusar: "Decline",
    fechar: "Close and decline cookies",
  },
};

/** Textos do tema por idioma. */
export const textos: Record<Idioma, TextosTema> = { pt, en };
