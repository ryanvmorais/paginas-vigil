/**
 * @file Testes do script do botão de copiar: quando o botão aparece, o que vai para a área de
 * transferência, o que se anuncia e quando o rótulo volta.
 *
 * A área de transferência é trocada por uma que o teste controla (`navigator` substituído), e o
 * relógio é falso: o prazo do aviso corre sem espera real.
 *
 * @vitest-environment happy-dom
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** O que muda num bloco de teste. */
interface Bloco {
  comando?: string;
  /** Sem o `data-anuncio`: o aviso cai no rótulo `data-copiado`. */
  semAnuncio?: boolean;
  /** Parte do bloco que falta. */
  sem?: "code" | "button" | '[role="status"]';
}

/** Um bloco como o do `Comando.astro`. */
function marcacaoBloco({ comando = "pnpm add webvigil", semAnuncio = false }: Bloco = {}): string {
  const anuncio = semAnuncio ? "" : ' data-anuncio="Comando copiado"';
  return `
    <div class="comando" data-comando data-copiado="Copiado"${anuncio} data-falhou="Não foi possível copiar">
      <code>${comando}</code>
      <button type="button" hidden>Copiar</button>
      <span class="so-leitor" role="status"></span>
    </div>`;
}

let escritas: string[];
let falhar: boolean;

/** Troca o `navigator` por um com a área de transferência do teste, ou sem ela. */
function areaDeTransferencia(existe = true): void {
  const writeText = (texto: string) => {
    escritas.push(texto);
    return falhar
      ? Promise.reject(new DOMException("negado", "NotAllowedError"))
      : Promise.resolve();
  };
  vi.stubGlobal("navigator", existe ? { clipboard: { writeText } } : {});
}

/** Monta os blocos e roda o script, que liga os botões no `import`. */
async function carregar(blocos: Bloco[] = [{}]): Promise<void> {
  document.body.innerHTML = blocos.map(marcacaoBloco).join("");
  blocos.forEach((bloco, i) => {
    if (bloco.sem !== undefined)
      document.querySelectorAll("[data-comando]")[i]?.querySelector(bloco.sem)?.remove();
  });
  vi.resetModules();
  await import("./copiar");
}

const blocos = () => [...document.querySelectorAll<HTMLElement>("[data-comando]")];
const botao = (i = 0) => blocos()[i]?.querySelector("button") ?? null;
const status = (i = 0) => blocos()[i]?.querySelector('[role="status"]')?.textContent;

/** Clica e deixa a promessa da área de transferência terminar. */
async function copiar(i = 0): Promise<void> {
  botao(i)?.click();
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  escritas = [];
  falhar = false;
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("botão de copiar", () => {
  it("aparece quando o navegador oferece a área de transferência", async () => {
    areaDeTransferencia();
    await carregar();

    expect(botao()?.hidden).toBe(false);
  });

  it("continua oculto sem a área de transferência, e o comando segue na página", async () => {
    areaDeTransferencia(false);
    await carregar();

    expect(botao()?.hidden).toBe(true);
    expect(blocos()[0]?.querySelector("code")?.textContent).toBe("pnpm add webvigil");
  });

  it("copia o texto do comando, anuncia o aviso e troca o rótulo", async () => {
    areaDeTransferencia();
    await carregar();

    await copiar();

    expect(escritas).toEqual(["pnpm add webvigil"]);
    expect(status()).toBe("Comando copiado");
    expect(botao()?.textContent).toBe("Copiado");
  });

  it("anuncia o rótulo quando o bloco não traz o aviso", async () => {
    areaDeTransferencia();
    await carregar([{ semAnuncio: true }]);

    await copiar();

    expect(status()).toBe("Copiado");
    expect(botao()?.textContent).toBe("Copiado");
  });

  it("avisa no status e no rótulo quando a cópia falha", async () => {
    areaDeTransferencia();
    falhar = true;
    await carregar();

    await copiar();

    expect(escritas).toEqual(["pnpm add webvigil"]);
    expect(status()).toBe("Não foi possível copiar");
    expect(botao()?.textContent).toBe("Não foi possível copiar");
  });

  it("volta ao rótulo inicial e limpa o status 2 s depois", async () => {
    areaDeTransferencia();
    await carregar();
    await copiar();

    await vi.advanceTimersByTimeAsync(1999);
    expect(botao()?.textContent).toBe("Copiado");

    await vi.advanceTimersByTimeAsync(1);
    expect(botao()?.textContent).toBe("Copiar");
    expect(status()).toBe("");
  });

  it("recomeça o prazo a cada clique", async () => {
    areaDeTransferencia();
    await carregar();
    await copiar();
    await vi.advanceTimersByTimeAsync(1500);
    await copiar();

    await vi.advanceTimersByTimeAsync(1999);
    expect(botao()?.textContent).toBe("Copiado");

    await vi.advanceTimersByTimeAsync(1);
    expect(botao()?.textContent).toBe("Copiar");
  });

  it("liga cada bloco da página com o próprio comando", async () => {
    areaDeTransferencia();
    await carregar([{ comando: "um" }, { comando: "dois" }]);

    await copiar(1);

    expect(escritas).toEqual(["dois"]);
    expect(status(1)).toBe("Comando copiado");
    expect(status(0)).toBe("");
  });

  it.each(["code", '[role="status"]'] as const)(
    "deixa oculto o botão do bloco sem %s e liga os outros",
    async (sem) => {
      areaDeTransferencia();
      await carregar([{ sem }, {}]);

      expect(botao(0)?.hidden).toBe(true);
      expect(botao(1)?.hidden).toBe(false);
    },
  );

  it("ignora o bloco sem botão e liga os outros", async () => {
    areaDeTransferencia();
    await carregar([{ sem: "button" }, {}]);

    expect(botao(0)).toBeNull();
    expect(botao(1)?.hidden).toBe(false);
  });
});

describe("contrato com o Comando.astro", () => {
  it("tem o comando, o botão oculto, o status e os textos que o script lê", () => {
    const fonte = readFileSync(
      join(import.meta.dirname, "..", "componentes", "Comando.astro"),
      "utf8",
    );

    for (const gancho of [
      "data-comando",
      "data-copiado={t.copiado}",
      "data-anuncio={t.anuncio}",
      "data-falhou={t.falhou}",
      "<code>{comando}</code>",
      '<button type="button" hidden>',
      'role="status"',
      'import "../scripts/copiar";',
    ]) {
      expect(fonte).toContain(gancho);
    }
  });
});
