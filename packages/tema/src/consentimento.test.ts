/**
 * @file Testes do núcleo de consentimento: escolha, estados do Consent Mode e `gtag.js`.
 *
 * Cookie, armazenamento local e `gtag` são montados aqui, sem navegador, rede nem relógio (RNF-05).
 */

import { describe, expect, it, vi } from "vitest";

import {
  criarGtag,
  criarMedicao,
  estadoAceito,
  estadoPadrao,
  estadoRevogado,
  gravarEscolha,
  lerCookie,
  lerEscolha,
  montarCookie,
  montarRemocaoCookie,
  NOME_COOKIE,
  nomesCookiesGoogle,
  urlGtag,
  type Armazem,
  type Memoria,
  type Meios,
} from "./consentimento";

/** Opções para simular um armazém que falha. */
interface Falhas {
  /** Aceita a gravação sem guardar nada (cookie bloqueado, `localhost` recusando o domínio). */
  ignoraGravacao?: boolean;
  /** Lança erro em toda operação (`localStorage` bloqueado). */
  lanca?: boolean;
}

/** Armazém em memória, com `valor` visível para o teste conferir o que ficou guardado. */
function criarArmazem(inicial?: string, falhas: Falhas = {}): Armazem & { valor?: string } {
  const armazem: Armazem & { valor?: string } = {
    valor: inicial,
    ler() {
      if (falhas.lanca) throw new Error("armazém indisponível");
      return armazem.valor;
    },
    gravar(valor) {
      if (falhas.lanca) throw new Error("armazém indisponível");
      if (!falhas.ignoraGravacao) armazem.valor = valor;
    },
    apagar() {
      if (falhas.lanca) throw new Error("armazém indisponível");
      armazem.valor = undefined;
    },
  };
  return armazem;
}

describe("estados do Consent Mode", () => {
  it("começa com os quatro campos negados", () => {
    expect(estadoPadrao).toEqual({
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  it("concede só analytics_storage ao aceitar", () => {
    expect(estadoAceito).toEqual({ analytics_storage: "granted" });
  });

  it("nega só analytics_storage ao revogar", () => {
    expect(estadoRevogado).toEqual({ analytics_storage: "denied" });
  });
});

describe("lerEscolha", () => {
  it("devolve undefined quando nada foi guardado", () => {
    const meios: Meios = { cookie: criarArmazem(), local: criarArmazem() };

    expect(lerEscolha(meios, {})).toBeUndefined();
  });

  it("lê true como aceita e false como recusada no cookie", () => {
    expect(lerEscolha({ cookie: criarArmazem("true") }, {})).toBe("aceita");
    expect(lerEscolha({ cookie: criarArmazem("false") }, {})).toBe("recusada");
  });

  it("recua para o armazenamento local quando o cookie está vazio", () => {
    const meios: Meios = { cookie: criarArmazem(), local: criarArmazem("true") };

    expect(lerEscolha(meios, {})).toBe("aceita");
  });

  it("recua para a memória da página quando os dois armazéns estão vazios", () => {
    const meios: Meios = { cookie: criarArmazem(), local: criarArmazem() };

    expect(lerEscolha(meios, { escolha: "recusada" })).toBe("recusada");
  });

  it("deixa o cookie vencer o armazenamento local", () => {
    const meios: Meios = { cookie: criarArmazem("false"), local: criarArmazem("true") };

    expect(lerEscolha(meios, { escolha: "aceita" })).toBe("recusada");
  });

  it("trata valor diferente de true e false como sem escolha", () => {
    expect(lerEscolha({ cookie: criarArmazem("yes") }, {})).toBeUndefined();
    expect(lerEscolha({ cookie: criarArmazem("TRUE") }, {})).toBeUndefined();
    expect(lerEscolha({ cookie: criarArmazem("") }, {})).toBeUndefined();
  });

  it("ignora o valor estranho do cookie e segue para o armazenamento local", () => {
    const meios: Meios = { cookie: criarArmazem("1"), local: criarArmazem("false") };

    expect(lerEscolha(meios, {})).toBe("recusada");
  });

  it("ignora o armazém que lança erro ao ler", () => {
    const meios: Meios = {
      cookie: criarArmazem(undefined, { lanca: true }),
      local: criarArmazem("true", { lanca: true }),
    };

    expect(lerEscolha(meios, { escolha: "recusada" })).toBe("recusada");
  });
});

describe("gravarEscolha", () => {
  it("grava no cookie, confirma na leitura e apaga o item antigo do armazenamento local", () => {
    const cookie = criarArmazem();
    const local = criarArmazem("false");
    const memoria: Memoria = { escolha: "recusada" };

    const onde = gravarEscolha({ cookie, local }, memoria, "aceita");

    expect(onde).toBe("cookie");
    expect(cookie.valor).toBe("true");
    expect(local.valor).toBeUndefined();
    expect(memoria.escolha).toBeUndefined();
  });

  it("grava false ao recusar", () => {
    const cookie = criarArmazem();

    gravarEscolha({ cookie }, {}, "recusada");

    expect(cookie.valor).toBe("false");
  });

  it("cai para o armazenamento local quando o cookie não confirma na leitura", () => {
    const cookie = criarArmazem(undefined, { ignoraGravacao: true });
    const local = criarArmazem();

    const onde = gravarEscolha({ cookie, local }, {}, "aceita");

    expect(onde).toBe("local");
    expect(local.valor).toBe("true");
    expect(lerEscolha({ cookie, local }, {})).toBe("aceita");
  });

  it("apaga o valor antigo do cookie que não aceita a gravação, para ele não vencer a escolha nova", () => {
    const cookie = criarArmazem("true", { ignoraGravacao: true });
    const local = criarArmazem();

    gravarEscolha({ cookie, local }, {}, "recusada");

    expect(lerEscolha({ cookie, local }, {})).toBe("recusada");
  });

  it("cai para o armazenamento local quando o cookie lança erro", () => {
    const cookie = criarArmazem(undefined, { lanca: true });
    const local = criarArmazem();

    expect(gravarEscolha({ cookie, local }, {}, "recusada")).toBe("local");
    expect(local.valor).toBe("false");
  });

  it("cai para a memória quando o armazenamento local também lança erro", () => {
    const cookie = criarArmazem(undefined, { ignoraGravacao: true });
    const local = criarArmazem(undefined, { lanca: true });
    const memoria: Memoria = {};

    const onde = gravarEscolha({ cookie, local }, memoria, "aceita");

    expect(onde).toBe("memoria");
    expect(memoria.escolha).toBe("aceita");
    expect(lerEscolha({ cookie, local }, memoria)).toBe("aceita");
  });

  it("cai para a memória quando não há armazenamento local", () => {
    const cookie = criarArmazem(undefined, { ignoraGravacao: true });
    const memoria: Memoria = {};

    expect(gravarEscolha({ cookie }, memoria, "recusada")).toBe("memoria");
    expect(memoria.escolha).toBe("recusada");
  });

  it("troca na memória a escolha antiga da página pela nova", () => {
    const cookie = criarArmazem(undefined, { ignoraGravacao: true });
    const memoria: Memoria = { escolha: "aceita" };

    gravarEscolha({ cookie }, memoria, "recusada");

    expect(lerEscolha({ cookie }, memoria)).toBe("recusada");
  });
});

describe("cookie da escolha", () => {
  it("monta o cookie de domínio com validade de 400 dias, em HTTPS", () => {
    expect(montarCookie("true", true)).toBe(
      "cookies-accepted=true; Domain=.ryanmorais.com.br; Path=/; Max-Age=34560000; SameSite=Lax; Secure",
    );
  });

  it("não marca Secure fora de HTTPS", () => {
    expect(montarCookie("false", false)).not.toContain("Secure");
    expect(montarCookie("false", false)).toContain("cookies-accepted=false;");
  });

  it("monta o cookie de remoção com validade zero e o mesmo escopo", () => {
    const texto = montarCookie("", true, 0);

    expect(texto).toContain("Max-Age=0");
    expect(texto).toContain("Domain=.ryanmorais.com.br");
    expect(texto).toContain("Path=/");
  });

  it("lê o valor do cookie da escolha no meio de outros cookies", () => {
    const cabecalho = `a=1; ${NOME_COOKIE}=true; b=2`;

    expect(lerCookie(cabecalho)).toBe("true");
  });

  it("não confunde o cookie da escolha com um de nome parecido", () => {
    expect(lerCookie("meu-cookies-accepted=true; cookies-accepted-x=false")).toBeUndefined();
    expect(lerCookie("")).toBeUndefined();
  });
});

describe("criarGtag", () => {
  it("empurra o objeto arguments no dataLayer, como o gtag.js exige", () => {
    const dataLayer: unknown[] = [];
    const gtag = criarGtag(dataLayer);

    gtag("consent", "default", { analytics_storage: "denied" });

    expect(dataLayer).toHaveLength(1);
    expect(Object.prototype.toString.call(dataLayer[0])).toBe("[object Arguments]");
    expect(Array.from(dataLayer[0] as ArrayLike<unknown>)).toEqual([
      "consent",
      "default",
      { analytics_storage: "denied" },
    ]);
  });
});

describe("urlGtag", () => {
  it("monta a URL do gtag.js com o identificador", () => {
    expect(urlGtag("G-ABC1234567")).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-ABC1234567",
    );
  });
});

describe("cookies do Google Analytics", () => {
  it("lista os cookies que começam com _ga (como _ga e _ga_<ID>), sem repetição", () => {
    const cabecalho =
      "cookies-accepted=true; _ga=GA1.1.1.2; _ga_ABC1234567=GS2.1.s1; _ga=outro; _gat=1";

    expect(nomesCookiesGoogle(cabecalho)).toEqual(["_ga", "_ga_ABC1234567", "_gat"]);
  });

  it("devolve lista vazia sem cookies do Google", () => {
    expect(nomesCookiesGoogle("")).toEqual([]);
    expect(nomesCookiesGoogle("cookies-accepted=true; tema=escuro")).toEqual([]);
  });

  it("não confunde um cookie que só contém _ga no meio do nome", () => {
    expect(nomesCookiesGoogle("meu_ga=1; x=_ga")).toEqual([]);
  });

  it("monta a remoção do cookie do host, sem Domain", () => {
    expect(montarRemocaoCookie("_ga")).toBe("_ga=; Path=/; Max-Age=0");
  });

  it("monta a remoção do cookie de um domínio", () => {
    expect(montarRemocaoCookie("_ga_ABC1234567", ".ryanmorais.com.br")).toBe(
      "_ga_ABC1234567=; Path=/; Max-Age=0; Domain=.ryanmorais.com.br",
    );
  });
});

describe("criarMedicao", () => {
  const ID = "G-ABC1234567";
  const AGORA = new Date("2026-01-01T00:00:00Z");

  /** Monta a medição com um `gtag` que anota cada chamada e um carregador que anota cada URL. */
  function montar() {
    const chamadas: unknown[][] = [];
    const carregarScript = vi.fn<(url: string) => void>();
    const apagarCookies = vi.fn<() => void>();
    const medicao = criarMedicao({
      id: ID,
      gtag: (...args) => chamadas.push(args),
      carregarScript,
      apagarCookies,
      agora: () => AGORA,
    });
    return { chamadas, carregarScript, apagarCookies, medicao };
  }

  it("define o estado negado ao iniciar e não carrega o gtag.js", () => {
    const { chamadas, carregarScript, medicao } = montar();

    medicao.iniciar();

    expect(chamadas).toEqual([["consent", "default", estadoPadrao]]);
    expect(carregarScript).not.toHaveBeenCalled();
  });

  it("ao aceitar, segue a ordem default, update, js, config e só então carrega o gtag.js", () => {
    const { chamadas, carregarScript, medicao } = montar();

    medicao.iniciar();
    medicao.aplicar("aceita");

    expect(chamadas).toEqual([
      ["consent", "default", estadoPadrao],
      ["consent", "update", estadoAceito],
      ["js", AGORA],
      ["config", ID, { allow_google_signals: false, allow_ad_personalization_signals: false }],
    ]);
    expect(carregarScript).toHaveBeenCalledOnce();
    expect(carregarScript).toHaveBeenCalledWith(urlGtag(ID));
  });

  it("ao recusar sem ter aceitado, não muda o consentimento nem carrega o gtag.js", () => {
    const { chamadas, carregarScript, medicao } = montar();

    medicao.iniciar();
    medicao.aplicar("recusada");

    expect(chamadas).toEqual([["consent", "default", estadoPadrao]]);
    expect(carregarScript).not.toHaveBeenCalled();
  });

  it("ao recusar depois de aceitar, nega analytics_storage e apaga os cookies", () => {
    const { chamadas, apagarCookies, medicao } = montar();

    medicao.iniciar();
    medicao.aplicar("aceita");
    expect(apagarCookies).not.toHaveBeenCalled();
    medicao.aplicar("recusada");

    expect(chamadas.at(-1)).toEqual(["consent", "update", estadoRevogado]);
    expect(apagarCookies).toHaveBeenCalledOnce();
  });

  it("ao restaurar uma recusa feita em outro site, apaga os cookies sem mudar o consentimento", () => {
    const { chamadas, apagarCookies, medicao } = montar();

    medicao.iniciar();
    medicao.aplicar("recusada");

    expect(chamadas).toEqual([["consent", "default", estadoPadrao]]);
    expect(apagarCookies).toHaveBeenCalledOnce();
  });

  it("ao aceitar, não apaga os cookies", () => {
    const { apagarCookies, medicao } = montar();

    medicao.iniciar();
    medicao.aplicar("aceita");

    expect(apagarCookies).not.toHaveBeenCalled();
  });

  it("mantém um único config e um único carregamento com aceitar, recusar e aceitar de novo", () => {
    const { chamadas, carregarScript, medicao } = montar();

    medicao.iniciar();
    medicao.aplicar("aceita");
    medicao.aplicar("recusada");
    medicao.aplicar("aceita");

    expect(chamadas.map((chamada) => chamada[0])).toEqual([
      "consent",
      "consent",
      "js",
      "config",
      "consent",
      "consent",
    ]);
    expect(chamadas.filter((chamada) => chamada[0] === "config")).toHaveLength(1);
    expect(chamadas.at(-1)).toEqual(["consent", "update", estadoAceito]);
    expect(carregarScript).toHaveBeenCalledOnce();
  });

  it("nunca concede publicidade, dados de usuário nem personalização", () => {
    const { chamadas, medicao } = montar();

    medicao.iniciar();
    medicao.aplicar("aceita");
    medicao.aplicar("recusada");
    medicao.aplicar("aceita");

    const concedidos = chamadas
      .filter((chamada) => chamada[0] === "consent" && chamada[1] === "update")
      .flatMap((chamada) => Object.entries(chamada[2] as Record<string, string>))
      .filter(([, valor]) => valor === "granted")
      .map(([campo]) => campo);
    expect(new Set(concedidos)).toEqual(new Set(["analytics_storage"]));
  });
});
