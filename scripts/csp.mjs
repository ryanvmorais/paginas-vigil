/**
 * @file A política de segurança de conteúdo (CSP) dos sites: fonte única do que o deploy emite.
 *
 * Uma só definição impede que a política documentada, a testada e a emitida divirjam (spec 003,
 * ADR-5). Três usos: o `verificar-dist` confere o HTML do build contra ela, um teste do repositório
 * garante que a URL do `gtag.js` cabe nela e o deploy a escreverá como cabeçalho HTTP.
 *
 * Sem medição, nenhuma diretiva lista domínio externo. Com medição, só o domínio do `gtag.js` entra
 * em `script-src` e só os hosts do Google Analytics entram em `img-src` e `connect-src`. Nunca
 * `unsafe-inline`, `unsafe-eval`, nonce ou `*` (RNF-01): todo script e todo estilo são arquivos.
 */

// Domínios do Google Analytics 4, na lista da documentação de CSP estrita do Google. Se o Google
// exigir mais um, ele entra aqui, no teste e na documentação: nunca como `*`.
const SCRIPT_GOOGLE = ["https://www.googletagmanager.com"];
const IMAGEM_GOOGLE = ["https://*.google-analytics.com", "https://*.googletagmanager.com"];
const CONEXAO_GOOGLE = [
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://*.googletagmanager.com",
];

// Formato do identificador do GA4; é o mesmo de `validarIdMedicao` (packages/tema/src/medicao.ts),
// repetido aqui porque estes scripts rodam em Node puro, sem importar TypeScript do tema. Um teste
// garante que as duas definições concordam.
const FORMATO_ID_MEDICAO = /^G-[A-Z0-9]{10}$/;

/**
 * Diz se um identificador de medição tem o formato do GA4 (`G-` e dez maiúsculas ou dígitos).
 *
 * É a regra que decide o modo de um build: só um identificador válido liga a medição. O gerador da
 * hospedagem e o `verificar-dist` usam esta função, para não terem cada um a sua cópia.
 *
 * @param {string | undefined} id - valor lido do ambiente; vazio e ausente são aceitos como entrada
 * @returns {boolean} `true` se o identificador liga a medição
 */
export const medicaoValida = (id) => typeof id === "string" && FORMATO_ID_MEDICAO.test(id);

/**
 * Monta a política de um modo.
 *
 * O `img-src` não lista `data:`: o favicon e o `apple-touch-icon` são arquivos do próprio site, e nenhuma
 * imagem é embutida (o `build.assetsInlineLimit: 0` dos apps garante isso).
 *
 * @param {{ medicao: boolean }} modo - `medicao: true` quando o build tem identificador válido
 * @returns {{ diretivas: Record<string, string[]>, cabecalho: string }} as diretivas (nome para
 *   fontes) e o valor do cabeçalho `Content-Security-Policy`
 */
export const politicaCsp = ({ medicao }) => {
  const diretivas = {
    "default-src": ["'none'"],
    "script-src": ["'self'", ...(medicao ? SCRIPT_GOOGLE : [])],
    "style-src": ["'self'"],
    "font-src": ["'self'"],
    "img-src": ["'self'", ...(medicao ? IMAGEM_GOOGLE : [])],
    "connect-src": medicao ? CONEXAO_GOOGLE : ["'none'"],
    "base-uri": ["'none'"],
    "form-action": ["'none'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
  };
  const cabecalho = Object.entries(diretivas)
    .map(([nome, fontes]) => `${nome} ${fontes.join(" ")}`)
    .join("; ");
  return { diretivas, cabecalho };
};

/**
 * Diz se um host casa com uma fonte `https://host` ou `https://*.host` da política.
 *
 * O curinga cobre subdomínios, não o domínio sozinho, como na especificação da CSP.
 *
 * @param {string} fonte - fonte da diretiva, por exemplo `https://*.google-analytics.com`
 * @param {URL} url - URL absoluta já interpretada
 * @returns {boolean} `true` se o host da URL casa e o esquema é `https:`
 */
const casaComFonte = (fonte, url) => {
  const resto = fonte.match(/^https:\/\/(.+)$/)?.[1];
  if (resto === undefined || url.protocol !== "https:") {
    return false;
  }
  return resto.startsWith("*.") ? url.hostname.endsWith(resto.slice(1)) : url.hostname === resto;
};

/**
 * Diz se a política deixa uma diretiva buscar uma URL.
 *
 * URL relativa vale como `'self'`; URL absoluta nunca, porque o verificador não conhece o endereço
 * do próprio site (um recurso do site é referenciado por caminho, nunca por URL completa).
 *
 * @param {{ diretivas: Record<string, string[]> }} politica - o resultado de `politicaCsp`
 * @param {string} diretiva - diretiva que governa o recurso (`script-src`, `img-src`, ...)
 * @param {string} url - valor do `src` ou do `href` como está no HTML
 * @returns {boolean} `true` se a política permite buscar a URL
 */
export const urlPermitida = (politica, diretiva, url) => {
  const fontes = politica.diretivas[diretiva] ?? politica.diretivas["default-src"] ?? [];
  const valor = url.trim();

  if (/^data:/i.test(valor)) {
    return fontes.includes("data:");
  }
  // `//host` herda o esquema da página (https no deploy).
  const absoluta = /^(https?:)?\/\//i.test(valor);
  if (absoluta) {
    let analisada;
    try {
      analisada = new URL(valor.startsWith("//") ? `https:${valor}` : valor);
    } catch {
      return false;
    }
    return fontes.some((fonte) => casaComFonte(fonte, analisada));
  }
  // Qualquer outro esquema (`javascript:`, `blob:`, `mailto:`) não é recurso do próprio site.
  if (/^[a-z][a-z0-9+.-]*:/i.test(valor)) {
    return false;
  }
  return fontes.includes("'self'");
};
