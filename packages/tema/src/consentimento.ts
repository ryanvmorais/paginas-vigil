/**
 * @file Núcleo de consentimento: guarda a escolha do visitante e conduz o Consent Mode do GA4.
 *
 * Lógica pura, sem DOM e sem rede: cookie, armazenamento local e `gtag` chegam por injeção, e o
 * script de entrada (`scripts/consentimento.ts`) só monta os objetos reais e liga os eventos
 * (ADR-3, RNF-05). A escolha mora num cookie do domínio-pai (`ryanmorais.com.br`), que vale para os
 * três sites; se o cookie não puder ser gravado (`localhost`, cookies bloqueados), recua para o
 * armazenamento local e, por último, para a memória da página, sem lançar erro (RF-03, ADR-2).
 *
 * A medição segue o Consent Mode: tudo começa negado, aceitar concede só `analytics_storage` e o
 * `gtag.js` só é baixado depois do aceite (RF-01, RF-07, RNF-04, ADR-1). Recusar ou revogar nega
 * `analytics_storage` por `consent update` e remove os cookies `_ga*` (ADR-6).
 */

import { DOMINIO_COOKIE } from "./politica";

/** Escolha do visitante: aceitou ou recusou a medição. */
export type Escolha = "aceita" | "recusada";

/** Uma gaveta onde a escolha pode morar (cookie ou armazenamento local). */
export interface Armazem {
  /** Texto guardado, ou `undefined` se não há nada. Pode lançar erro. */
  ler(): string | undefined;
  /** Guarda o texto. Pode lançar erro. */
  gravar(valor: string): void;
  /** Remove o que está guardado. Pode lançar erro. */
  apagar(): void;
}

/** Armazéns da escolha, do preferido ao recuo; o armazenamento local pode não existir. */
export interface Meios {
  cookie: Armazem;
  local?: Armazem;
}

/** Último recuo: a escolha vale só enquanto a página está aberta. */
export interface Memoria {
  escolha?: Escolha;
}

/** Onde a escolha ficou guardada. */
export type Destino = "cookie" | "local" | "memoria";

/** Função `gtag` do Google: recebe comandos e os empurra no `dataLayer`. */
export type Gtag = (...args: unknown[]) => void;

/** Campos do Consent Mode que o código controla. */
export type EstadoConsentimento = Readonly<Record<string, "granted" | "denied">>;

/** Nome do cookie da escolha; o site do domínio-pai usa o mesmo (contrato da spec 003). */
export const NOME_COOKIE = "cookies-accepted";

/** Validade do cookie, em segundos: 400 dias, o teto que os navegadores aceitam. */
const VALIDADE_COOKIE_S = 400 * 24 * 60 * 60;

/** Endereço do `gtag.js`; a CSP libera só este domínio para script (`scripts/csp.mjs`). */
export const URL_GTAG = "https://www.googletagmanager.com/gtag/js";

/** Estado inicial: os quatro campos negados, antes de qualquer escolha (RF-01). */
export const estadoPadrao: EstadoConsentimento = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

/** Estado ao aceitar: só `analytics_storage`; publicidade e personalização nunca mudam (RNF-04). */
export const estadoAceito: EstadoConsentimento = { analytics_storage: "granted" };

/** Estado ao revogar: só `analytics_storage` volta a negado; os cookies saem à parte (ADR-6). */
export const estadoRevogado: EstadoConsentimento = { analytics_storage: "denied" };

/**
 * Traduz o texto guardado na escolha.
 *
 * @param texto - o que o armazém devolveu
 * @returns `aceita` para `true`, `recusada` para `false`; qualquer outro valor é "sem escolha"
 */
function interpretar(texto: string | undefined): Escolha | undefined {
  if (texto === "true") return "aceita";
  if (texto === "false") return "recusada";
  return undefined;
}

/**
 * Lê um armazém sem deixar o erro escapar.
 *
 * @param armazem - armazém a ler; ausente conta como vazio
 * @returns o texto guardado, ou `undefined` se não há nada ou a leitura falhou
 */
function lerSemFalhar(armazem: Armazem | undefined): string | undefined {
  try {
    return armazem?.ler();
  } catch {
    return undefined;
  }
}

/**
 * Esvazia um armazém sem deixar o erro escapar.
 *
 * @param armazem - armazém a esvaziar; ausente é ignorado
 */
function apagarSemFalhar(armazem: Armazem | undefined): void {
  try {
    armazem?.apagar();
  } catch {
    // Armazém indisponível: não há o que apagar.
  }
}

/**
 * Grava no armazém e lê de volta, para saber se o valor realmente ficou.
 *
 * @param armazem - armazém onde gravar
 * @param valor - texto a guardar
 * @returns `true` só se a leitura seguinte devolveu o mesmo texto
 */
function gravarConfirmando(armazem: Armazem, valor: string): boolean {
  try {
    armazem.gravar(valor);
    return armazem.ler() === valor;
  } catch {
    return false;
  }
}

/**
 * Lê a escolha do visitante: cookie, depois armazenamento local, depois memória da página.
 *
 * O cookie vence quando os dois existem. Valor que não seja `true` nem `false` conta como "sem
 * escolha" naquele armazém e a leitura segue para o próximo. Nada lança para fora.
 *
 * @param meios - cookie e, se existir, armazenamento local
 * @param memoria - memória da página, o último recuo
 * @returns a escolha, ou `undefined` se o visitante ainda não escolheu
 */
export function lerEscolha(meios: Meios, memoria: Memoria): Escolha | undefined {
  return (
    interpretar(lerSemFalhar(meios.cookie)) ??
    interpretar(lerSemFalhar(meios.local)) ??
    memoria.escolha
  );
}

/**
 * Grava a escolha, confirmando na leitura e recuando quando o armazém não guarda.
 *
 * Tenta o cookie e o lê de volta; se o valor não voltou, apaga o que houver nele (para um valor
 * antigo não vencer o novo) e tenta o armazenamento local; se este também falhar ou não existir,
 * guarda na memória. Quando o cookie confirma, o item antigo do armazenamento local é apagado, para
 * uma escolha velha não ressuscitar se o cookie sumir depois.
 *
 * @param meios - cookie e, se existir, armazenamento local
 * @param memoria - memória da página, o último recuo
 * @param escolha - a escolha do visitante
 * @returns onde a escolha ficou guardada
 */
export function gravarEscolha(meios: Meios, memoria: Memoria, escolha: Escolha): Destino {
  const valor = escolha === "aceita" ? "true" : "false";

  if (gravarConfirmando(meios.cookie, valor)) {
    apagarSemFalhar(meios.local);
    delete memoria.escolha;
    return "cookie";
  }

  apagarSemFalhar(meios.cookie);
  if (meios.local !== undefined && gravarConfirmando(meios.local, valor)) {
    delete memoria.escolha;
    return "local";
  }

  memoria.escolha = escolha;
  return "memoria";
}

/**
 * Monta o texto de atribuição de `document.cookie` para o cookie da escolha.
 *
 * @param valor - `true`, `false` ou vazio (para remover)
 * @param https - `true` quando a página é HTTPS: acrescenta `Secure`
 * @param validade - validade em segundos; `0` remove o cookie
 * @returns texto pronto para atribuir a `document.cookie`
 */
export function montarCookie(valor: string, https: boolean, validade = VALIDADE_COOKIE_S): string {
  return [
    `${NOME_COOKIE}=${valor}`,
    `Domain=${DOMINIO_COOKIE}`,
    "Path=/",
    `Max-Age=${validade}`,
    "SameSite=Lax",
    ...(https ? ["Secure"] : []),
  ].join("; ");
}

/**
 * Lê o valor de um cookie no texto de `document.cookie`.
 *
 * @param cabecalho - texto de `document.cookie`, com os cookies separados por `;`
 * @param nome - nome do cookie; por padrão o da escolha
 * @returns o valor, ou `undefined` se não há cookie com exatamente esse nome
 */
export function lerCookie(cabecalho: string, nome = NOME_COOKIE): string | undefined {
  const prefixo = `${nome}=`;
  const par = cabecalho
    .split(";")
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith(prefixo));
  return par?.slice(prefixo.length);
}

/**
 * Lista os cookies do Google Analytics (`_ga` e `_ga_<ID>`) presentes no texto de `document.cookie`.
 *
 * @param cabecalho - texto de `document.cookie`, com os cookies separados por `;`
 * @returns os nomes, sem repetição, na ordem em que aparecem
 */
export function nomesCookiesGoogle(cabecalho: string): string[] {
  const nomes = cabecalho
    .split(";")
    .map((parte) => (parte.split("=")[0] ?? "").trim())
    .filter((nome) => nome.startsWith("_ga"));
  return [...new Set(nomes)];
}

/**
 * Monta o texto de atribuição de `document.cookie` que remove um cookie do Google Analytics.
 *
 * @param nome - nome do cookie a remover
 * @param dominio - atributo `Domain` do cookie a casar; ausente remove o cookie só do host
 * @returns texto pronto para atribuir a `document.cookie`
 */
export function montarRemocaoCookie(nome: string, dominio?: string): string {
  const escopo = dominio === undefined ? "" : `; Domain=${dominio}`;
  return `${nome}=; Path=/; Max-Age=0${escopo}`;
}

/**
 * Cria a função `gtag` ligada a um `dataLayer`.
 *
 * O `gtag.js` só reconhece o objeto `arguments`, não um array, então o comando é empurrado assim.
 *
 * @param dataLayer - lista do Google onde os comandos se acumulam
 * @returns a função `gtag`
 */
export function criarGtag(dataLayer: unknown[]): Gtag {
  return function gtag() {
    // eslint-disable-next-line prefer-rest-params -- o gtag.js exige `arguments`, não um array
    dataLayer.push(arguments);
  };
}

/**
 * Monta o endereço do `gtag.js` para um identificador de medição.
 *
 * @param id - identificador já validado por `validarIdMedicao`
 * @returns URL do `gtag.js`
 */
export function urlGtag(id: string): string {
  return `${URL_GTAG}?id=${id}`;
}

/** Portas de que a medição precisa. */
export interface EntradaMedicao {
  /** Identificador de medição, já validado. */
  id: string;
  gtag: Gtag;
  /** Cria o elemento `<script>` do `gtag.js`; só é chamada depois do aceite. */
  carregarScript(url: string): void;
  /** Remove do navegador os cookies `_ga*`; é chamada a cada recusa, mesmo sem aceite nesta página. */
  apagarCookies(): void;
  /** Relógio injetado para o comando `js`; o padrão é a hora de agora. */
  agora?: () => Date;
}

/** Medição conduzida pelo Consent Mode. */
export interface Medicao {
  /** Define o estado negado. Chamada uma vez, antes de qualquer `aplicar`. */
  iniciar(): void;
  /** Aplica a escolha do visitante (a restaurada ou a recém-feita). */
  aplicar(escolha: Escolha): void;
}

/**
 * Cria a medição de uma página.
 *
 * A ordem é sempre `consent default` → `consent update` → `js` → `config` → só então o
 * `<script>` do `gtag.js`, para o `page_view` inicial já sair concedido. O `config` roda uma vez
 * por página, mesmo com aceitar, recusar e aceitar de novo, e sem os sinais de publicidade (RF-07).
 *
 * @param entrada - identificador, `gtag` e carregador de script
 * @returns a medição, com `iniciar` e `aplicar`
 */
export function criarMedicao(entrada: EntradaMedicao): Medicao {
  const { id, gtag, carregarScript, apagarCookies, agora = () => new Date() } = entrada;
  let carregada = false;

  return {
    iniciar() {
      gtag("consent", "default", estadoPadrao);
    },
    aplicar(escolha) {
      if (escolha === "recusada") {
        // Sem medição carregada tudo já está negado; depois do aceite, revoga o armazenamento.
        if (carregada) gtag("consent", "update", estadoRevogado);
        // A recusa pode ter sido feita em outro site, que não alcança estes cookies (ADR-6).
        apagarCookies();
        return;
      }

      gtag("consent", "update", estadoAceito);
      if (carregada) return;
      carregada = true;
      gtag("js", agora());
      gtag("config", id, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
      carregarScript(urlGtag(id));
    },
  };
}
