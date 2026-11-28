/**
 * @file Testes do script de entrada do banner de consentimento: a ligação de cada botão à escolha, o
 * foco, o Esc e o que o script lê e grava no navegador.
 *
 * As decisões (ordem do Consent Mode, recuos do armazém) têm teste no núcleo (`../consentimento.test.ts`);
 * aqui se confere a cola: qual botão grava o quê, que o `gtag.js` só entra na página depois do aceite e
 * que os cookies do Google saem a cada recusa. O DOM é o do happy-dom, que recusa baixar o `<script>`
 * externo (`disableJavaScriptFileLoading`): nenhum teste vai à rede. O happy-dom não apaga cookie com
 * `Max-Age=0`, então as remoções são conferidas pelo texto atribuído a `document.cookie`.
 *
 * @vitest-environment happy-dom
 * @vitest-environment-options {"url": "https://webvigil.ryanmorais.com.br/", "settings": {"disableJavaScriptFileLoading": true, "handleDisabledFileLoadingAsSuccess": true, "disableCSSFileLoading": true}}
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  estadoAceito,
  estadoPadrao,
  estadoRevogado,
  montarCookie,
  montarRemocaoCookie,
  NOME_COOKIE,
  urlGtag,
} from "../consentimento";

const ID = "G-ABC1234567";
const HOST = "webvigil.ryanmorais.com.br";
const URL_HTTPS = `https://${HOST}/`;
const PASSADO = "Thu, 01 Jan 1970 00:00:00 GMT";

type JanelaDeTeste = Window & {
  dataLayer?: unknown[];
  happyDOM: { setURL(url: string): void };
};
const janela = window as unknown as JanelaDeTeste;

/** O que muda a página de teste. */
interface Pagina {
  /** Valor de `data-medicao`; `null` tira o atributo. */
  id?: string | null;
  /** Elemento do banner que a página não tem. */
  sem?: "[data-aceitar]" | "[data-recusar]" | "[data-fechar]" | "h2";
  /** Sem o `<section data-consentimento>`. */
  semBanner?: boolean;
  /** Sem o `<main>`, para onde o foco vai na primeira visita. */
  semMain?: boolean;
}

/** Monta a marcação do `Consentimento.astro` e do botão do `Rodape.astro` (o contrato está no fim). */
function montarPagina({ id = ID, sem, semBanner = false, semMain = false }: Pagina = {}): void {
  const medicao = id === null ? "" : ` data-medicao="${id}"`;
  const banner = semBanner
    ? ""
    : `<section class="consentimento" data-consentimento${medicao} hidden>
        <h2 id="consentimento-titulo" tabindex="-1">Cookies</h2>
        <div class="acoes">
          <button type="button" data-recusar>Recusar</button>
          <button type="button" data-aceitar>Aceitar</button>
        </div>
        <button type="button" data-fechar aria-label="Fechar">x</button>
      </section>`;
  const conteudo = semMain ? "<div>Conteúdo</div>" : "<main>Conteúdo</main>";
  document.body.innerHTML = `${conteudo}
    <footer><button type="button" data-gerenciar-cookies hidden>Gerenciar cookies</button></footer>
    ${banner}`;
  if (sem !== undefined) document.querySelector(sem)?.remove();
}

/** Roda o script como a página roda: no `import`, uma vez por página. */
async function carregarScript(): Promise<void> {
  vi.resetModules();
  await import("./consentimento");
}

const el = <T extends HTMLElement>(seletor: string): T => {
  const achado = document.querySelector<T>(seletor);
  if (achado === null) throw new Error(`a página de teste não tem ${seletor}`);
  return achado;
};
const banner = () => el("[data-consentimento]");
const gerenciar = () => el<HTMLButtonElement>("[data-gerenciar-cookies]");
const clicar = (seletor: string) => el(seletor).click();
const teclar = (alvo: HTMLElement, key: string) =>
  alvo.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

/** Os comandos empurrados no `dataLayer`, como listas. */
const comandos = () =>
  (janela.dataLayer ?? []).map((item) => Array.from(item as ArrayLike<unknown>));

/** Os `<script>` que o banner pôs no `<head>`. */
const scripts = () =>
  [...document.head.querySelectorAll("script")].map((s) => ({ src: s.src, async: s.async }));

const COMANDOS_DO_ACEITE = [
  ["consent", "default", estadoPadrao],
  ["consent", "update", estadoAceito],
  ["js", expect.any(Date)],
  ["config", ID, { allow_google_signals: false, allow_ad_personalization_signals: false }],
];

/** As quatro remoções de um cookie do Google: host, host com ponto e domínio-pai (ADR-6). */
const remocoes = (nome: string) => [
  montarRemocaoCookie(nome),
  montarRemocaoCookie(nome, HOST),
  montarRemocaoCookie(nome, `.${HOST}`),
  montarRemocaoCookie(nome, ".ryanmorais.com.br"),
];

/** Cada texto atribuído a `document.cookie` desde a chamada, sem mudar o que a atribuição faz. */
function espiarCookies(): string[] {
  const atribuidos: string[] = [];
  let proto: object | null = Object.getPrototypeOf(document) as object | null;
  while (proto !== null && Object.getOwnPropertyDescriptor(proto, "cookie") === undefined) {
    proto = Object.getPrototypeOf(proto) as object | null;
  }
  const original = Object.getOwnPropertyDescriptor(proto ?? {}, "cookie");
  if (original?.get === undefined || original.set === undefined) {
    throw new Error("document.cookie sem get e set");
  }
  const { get, set } = original;
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => get.call(document) as string,
    set: (valor: string) => {
      atribuidos.push(valor);
      set.call(document, valor);
    },
  });
  return atribuidos;
}

/** Apaga todo cookie da página (com `Expires`, que o happy-dom respeita). */
function limparCookies(): void {
  for (const par of document.cookie.split(";")) {
    const nome = par.split("=")[0]?.trim();
    if (!nome) continue;
    for (const dominio of ["", `; Domain=${HOST}`, "; Domain=.ryanmorais.com.br"]) {
      document.cookie = `${nome}=; Path=/; Expires=${PASSADO}${dominio}`;
    }
  }
}

let localStorageOriginal: PropertyDescriptor | undefined;

beforeEach(() => {
  localStorageOriginal = Object.getOwnPropertyDescriptor(window, "localStorage");
  janela.happyDOM.setURL(URL_HTTPS);
  limparCookies();
  window.localStorage.clear();
  delete janela.dataLayer;
  document.head.innerHTML = "";
});

afterEach(() => {
  Reflect.deleteProperty(document, "cookie");
  if (localStorageOriginal !== undefined) {
    Object.defineProperty(window, "localStorage", localStorageOriginal);
  }
  janela.happyDOM.setURL(URL_HTTPS);
  limparCookies();
});

describe("primeira visita, sem escolha gravada", () => {
  it("revela o banner e o Gerenciar, nega tudo e não baixa o gtag.js, sem mover o foco", async () => {
    montarPagina();
    const cookies = espiarCookies();

    await carregarScript();

    expect(banner().hidden).toBe(false);
    expect(gerenciar().hidden).toBe(false);
    expect(comandos()).toEqual([["consent", "default", estadoPadrao]]);
    expect(scripts()).toEqual([]);
    expect(document.activeElement).toBe(document.body);
    expect(cookies).toEqual([]);
  });

  it("Aceitar grava true no cookie do domínio, baixa o gtag.js uma vez e leva o foco ao conteúdo", async () => {
    montarPagina();
    await carregarScript();
    const cookies = espiarCookies();
    const foco = vi.spyOn(el("main"), "focus");

    clicar("[data-aceitar]");

    expect(cookies).toEqual([montarCookie("true", true)]);
    expect(document.cookie).toContain(`${NOME_COOKIE}=true`);
    expect(comandos()).toEqual(COMANDOS_DO_ACEITE);
    expect(scripts()).toEqual([{ src: urlGtag(ID), async: true }]);
    expect(banner().hidden).toBe(true);
    // O `<main>` não recebe foco sem `tabindex`; a página não rola ao recebê-lo.
    expect(el("main").getAttribute("tabindex")).toBe("-1");
    expect(foco.mock.calls).toEqual([[{ preventScroll: true }]]);
    expect(document.activeElement).toBe(el("main"));
  });

  it("com o cookie gravado, apaga a escolha antiga do armazenamento local", async () => {
    window.localStorage.setItem(NOME_COOKIE, "false");
    montarPagina();
    await carregarScript();
    // Controle: a escolha antiga do armazenamento local é lida (o banner fica fechado).
    expect(banner().hidden).toBe(true);
    gerenciar().click();

    clicar("[data-aceitar]");

    expect(document.cookie).toContain(`${NOME_COOKIE}=true`);
    expect(window.localStorage.getItem(NOME_COOKIE)).toBeNull();
  });

  it.each(["[data-recusar]", "[data-fechar]"])(
    "%s grava false, não baixa o gtag.js e apaga os cookies do Google",
    async (botao) => {
      montarPagina();
      document.cookie = "_ga=GA1.1.1.2; Path=/";
      await carregarScript();
      const cookies = espiarCookies();

      clicar(botao);

      expect(cookies).toEqual([montarCookie("false", true), ...remocoes("_ga")]);
      expect(document.cookie).toContain(`${NOME_COOKIE}=false`);
      expect(comandos()).toEqual([["consent", "default", estadoPadrao]]);
      expect(scripts()).toEqual([]);
      expect(banner().hidden).toBe(true);
      expect(document.activeElement).toBe(el("main"));
    },
  );

  it("não fecha o banner com Esc, porque ainda não há escolha a manter", async () => {
    montarPagina();
    await carregarScript();

    teclar(banner(), "Escape");

    expect(banner().hidden).toBe(false);
  });

  it("fecha o banner sem erro quando a página não tem o <main>", async () => {
    montarPagina({ semMain: true });
    await carregarScript();

    clicar("[data-aceitar]");

    expect(banner().hidden).toBe(true);
    expect(document.activeElement).toBe(document.body);
  });

  it("acrescenta ao dataLayer que já existe na página, sem trocá-lo", async () => {
    const anterior = ["já estava"];
    janela.dataLayer = anterior;
    montarPagina();

    await carregarScript();

    expect(janela.dataLayer).toBe(anterior);
    expect(janela.dataLayer).toHaveLength(2);
    expect(janela.dataLayer[0]).toBe("já estava");
  });
});

describe("escolha gravada", () => {
  it("restaura o aceite do cookie: banner fechado e gtag.js baixado, sem gravar de novo", async () => {
    document.cookie = `${NOME_COOKIE}=true; Path=/; Domain=.ryanmorais.com.br`;
    montarPagina();
    const cookies = espiarCookies();

    await carregarScript();

    expect(banner().hidden).toBe(true);
    expect(gerenciar().hidden).toBe(false);
    expect(comandos()).toEqual(COMANDOS_DO_ACEITE);
    expect(scripts()).toEqual([{ src: urlGtag(ID), async: true }]);
    expect(cookies).toEqual([]);
  });

  it("restaura a recusa do cookie: banner fechado, sem gtag.js, e os cookies do Google saem", async () => {
    document.cookie = `${NOME_COOKIE}=false; Path=/; Domain=.ryanmorais.com.br`;
    document.cookie = "_ga_ABC1234567=GS2.1; Path=/";
    montarPagina();
    const cookies = espiarCookies();

    await carregarScript();

    expect(banner().hidden).toBe(true);
    expect(comandos()).toEqual([["consent", "default", estadoPadrao]]);
    expect(scripts()).toEqual([]);
    expect(cookies).toEqual(remocoes("_ga_ABC1234567"));
  });

  it("restaura o aceite do armazenamento local quando não há cookie", async () => {
    window.localStorage.setItem(NOME_COOKIE, "true");
    montarPagina();

    await carregarScript();

    expect(banner().hidden).toBe(true);
    expect(scripts()).toEqual([{ src: urlGtag(ID), async: true }]);
  });
});

describe("reabrir pelo Gerenciar cookies", () => {
  /** Página com o aceite gravado, o banner reaberto pelo botão do rodapé. */
  async function reabrir(): Promise<string[]> {
    document.cookie = `${NOME_COOKIE}=true; Path=/; Domain=.ryanmorais.com.br`;
    montarPagina();
    await carregarScript();
    const cookies = espiarCookies();
    gerenciar().focus();
    gerenciar().click();
    return cookies;
  }

  it("abre o banner com o foco no título", async () => {
    await reabrir();

    expect(banner().hidden).toBe(false);
    expect(document.activeElement).toBe(el("h2"));
  });

  it("fecha com Esc sem mudar a escolha e devolve o foco ao botão", async () => {
    const cookies = await reabrir();
    const antes = comandos().length;

    teclar(banner(), "Escape");

    expect(banner().hidden).toBe(true);
    expect(document.activeElement).toBe(gerenciar());
    expect(gerenciar().tabIndex).toBe(0);
    expect(cookies).toEqual([]);
    expect(comandos()).toHaveLength(antes);
  });

  it("não fecha com outra tecla", async () => {
    await reabrir();

    teclar(banner(), "Enter");

    expect(banner().hidden).toBe(false);
  });

  it("recusar depois do aceite revoga a medição, apaga a escolha antiga e devolve o foco ao botão", async () => {
    const cookies = await reabrir();

    clicar("[data-recusar]");

    expect(cookies).toEqual([montarCookie("false", true)]);
    expect(comandos().at(-1)).toEqual(["consent", "update", estadoRevogado]);
    expect(banner().hidden).toBe(true);
    expect(document.activeElement).toBe(gerenciar());
  });

  it("esquece quem o abriu depois de fechar: Esc com o banner já fechado não mexe no foco", async () => {
    await reabrir();
    clicar("[data-aceitar]");
    el<HTMLElement>("h2").focus();

    teclar(banner(), "Escape");

    expect(document.activeElement).toBe(el("h2"));
  });
});

describe("recuos do armazém no navegador", () => {
  it("fora do domínio (localhost, sem HTTPS) recua para o armazenamento local", async () => {
    janela.happyDOM.setURL("http://localhost/");
    montarPagina();
    await carregarScript();
    const cookies = espiarCookies();

    clicar("[data-aceitar]");

    // O cookie de domínio não fica em localhost: grava sem `Secure`, confere, apaga e recua.
    expect(cookies).toEqual([montarCookie("true", false), montarCookie("", false, 0)]);
    expect(window.localStorage.getItem(NOME_COOKIE)).toBe("true");
    expect(scripts()).toEqual([{ src: urlGtag(ID), async: true }]);
  });

  it("com o armazenamento local bloqueado, a escolha vale só na página, sem erro", async () => {
    janela.happyDOM.setURL("http://localhost/");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("bloqueado", "SecurityError");
      },
    });
    montarPagina();
    await carregarScript();

    clicar("[data-aceitar]");

    expect(banner().hidden).toBe(true);
    expect(scripts()).toEqual([{ src: urlGtag(ID), async: true }]);
    expect(document.cookie).not.toContain(NOME_COOKIE);
  });
});

describe("página que não liga o banner", () => {
  /** Nada aconteceu: banner e Gerenciar ocultos, nenhum comando, nenhum cookie, nenhum script. */
  async function esperarNada(pagina: Pagina): Promise<void> {
    montarPagina(pagina);
    const cookies = espiarCookies();

    await carregarScript();

    expect(janela.dataLayer).toBeUndefined();
    expect(cookies).toEqual([]);
    expect(scripts()).toEqual([]);
    expect(gerenciar().hidden).toBe(true);
    if (!pagina.semBanner) expect(banner().hidden).toBe(true);
  }

  it("controle: a mesma página com tudo no lugar liga o banner", async () => {
    montarPagina();

    await carregarScript();

    expect(comandos()).toHaveLength(1);
    expect(banner().hidden).toBe(false);
  });

  it.each(["G-ABC123456", "UA-12345678-1", ""])(
    "não faz nada com o identificador %j, fora do formato",
    async (id) => {
      await esperarNada({ id });
    },
  );

  it("não faz nada sem o atributo data-medicao", async () => {
    await esperarNada({ id: null });
  });

  it.each(["[data-aceitar]", "[data-recusar]", "[data-fechar]", "h2"] as const)(
    "não faz nada quando o banner não tem %s",
    async (sem) => {
      await esperarNada({ sem });
    },
  );

  it("não faz nada numa página sem o banner (build sem medição)", async () => {
    await esperarNada({ semBanner: true });
  });
});

describe("contrato com os componentes", () => {
  const componente = (nome: string) =>
    readFileSync(join(import.meta.dirname, "..", "componentes", nome), "utf8");

  it("o Consentimento.astro tem os ganchos que o script procura", () => {
    const fonte = componente("Consentimento.astro");

    for (const gancho of [
      "data-consentimento",
      "data-medicao={id}",
      "data-recusar>",
      "data-aceitar>",
      "data-fechar ",
      '<h2 id="consentimento-titulo" tabindex="-1">',
      'import "../scripts/consentimento";',
    ]) {
      expect(fonte).toContain(gancho);
    }
    expect(fonte).toMatch(/<section\b[^>]*\sdata-consentimento\b[^>]*\shidden\s*>/);
  });

  it("o Rodape.astro tem o botão Gerenciar cookies, oculto até o script revelá-lo", () => {
    expect(componente("Rodape.astro")).toContain(
      '<button type="button" data-gerenciar-cookies hidden>',
    );
  });
});
