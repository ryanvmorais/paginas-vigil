/**
 * @file Testes do script do menu do celular: cada jeito de fechar o `<details>` e o foco depois do Esc.
 *
 * O `<details>` abre e fecha sem script; aqui se confere só o que o script acrescenta. O DOM é o do
 * happy-dom, e a consulta de largura (`matchMedia`) é trocada por uma lista que o teste dispara.
 *
 * @vitest-environment happy-dom
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

/** Consulta de largura falsa: guarda o texto pedido e deixa o teste disparar a mudança. */
class ConsultaFalsa extends EventTarget {
  constructor(readonly media: string) {
    super();
  }

  /** Dispara o `change` como o navegador, com o `matches` novo. */
  mudar(matches: boolean): void {
    this.dispatchEvent(Object.assign(new Event("change"), { matches }));
  }
}

let consultas: ConsultaFalsa[];

beforeEach(() => {
  consultas = [];
  vi.spyOn(window, "matchMedia").mockImplementation((media: string) => {
    const consulta = new ConsultaFalsa(media);
    consultas.push(consulta);
    return consulta as unknown as MediaQueryList;
  });
});

/** Um menu como o do `Cabecalho.astro`, com um link que tem um `<span>` dentro. */
const marcacaoMenu = (id: string) => `
  <details data-menu id="${id}">
    <summary class="menu-botao"><span>Menu</span></summary>
    <ul class="menu-painel">
      <li><a href="#secao-1">Seção 1</a></li>
      <li><a href="#secao-2"><span>Seção 2</span></a></li>
    </ul>
  </details>`;

/** Monta a página com os menus pedidos e roda o script, que liga os menus no `import`. */
async function carregar(ids: string[] = ["menu"]): Promise<void> {
  document.body.innerHTML = `
    <header><nav class="menu">${ids.map(marcacaoMenu).join("")}</nav></header>
    <main><a href="#fora" id="fora">Fora</a><p id="texto">Texto</p></main>`;
  vi.resetModules();
  await import("./menu");
}

const el = <T extends HTMLElement>(seletor: string): T => {
  const achado = document.querySelector<T>(seletor);
  if (achado === null) throw new Error(`a página de teste não tem ${seletor}`);
  return achado;
};
const menu = (id = "menu") => el<HTMLDetailsElement>(`#${id}`);
const abrir = (id = "menu") => {
  menu(id).open = true;
};
const teclar = (alvo: HTMLElement, key: string) =>
  alvo.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

describe("menu do celular", () => {
  it("fecha ao clicar num link do painel", async () => {
    await carregar();
    abrir();

    el('#menu a[href="#secao-1"]').click();

    expect(menu().open).toBe(false);
  });

  it("fecha ao clicar em algo dentro de um link", async () => {
    await carregar();
    abrir();

    el('#menu a[href="#secao-2"] span').click();

    expect(menu().open).toBe(false);
  });

  it("continua aberto ao clicar no painel fora de um link", async () => {
    await carregar();
    abrir();

    el("#menu li").click();

    expect(menu().open).toBe(true);
  });

  it("fecha com Esc e devolve o foco ao botão do menu", async () => {
    await carregar();
    abrir();
    const link = el('#menu a[href="#secao-1"]');
    link.focus();

    teclar(link, "Escape");

    expect(menu().open).toBe(false);
    expect(document.activeElement).toBe(el("#menu summary"));
  });

  it("não mexe no foco com Esc quando o menu já está fechado", async () => {
    await carregar();
    el("#fora").focus();

    teclar(menu(), "Escape");

    expect(menu().open).toBe(false);
    expect(document.activeElement).toBe(el("#fora"));
  });

  it("continua aberto com outra tecla", async () => {
    await carregar();
    abrir();

    teclar(el('#menu a[href="#secao-1"]'), "Enter");

    expect(menu().open).toBe(true);
  });

  it("fecha ao clicar fora do menu", async () => {
    await carregar();
    abrir();

    el("#texto").click();

    expect(menu().open).toBe(false);
  });

  it("fecha quando o foco vai para fora do menu e continua aberto com o foco dentro", async () => {
    await carregar();
    abrir();

    el('#menu a[href="#secao-2"]').focus();
    expect(menu().open).toBe(true);

    el("#fora").focus();
    expect(menu().open).toBe(false);
  });

  it("fecha quando a tela passa a mostrar a navegação em linha, e só então", async () => {
    await carregar();
    abrir();

    expect(consultas.map((consulta) => consulta.media)).toEqual(["(min-width: 720px)"]);
    consultas[0]?.mudar(false);
    expect(menu().open).toBe(true);

    consultas[0]?.mudar(true);
    expect(menu().open).toBe(false);
  });

  it("liga cada menu da página", async () => {
    await carregar(["um", "dois"]);
    abrir("um");
    abrir("dois");

    el('#dois a[href="#secao-1"]').click();

    expect(menu("dois").open).toBe(false);
    expect(menu("um").open).toBe(false);
    expect(consultas).toHaveLength(2);
  });
});

describe("contrato com o Cabecalho.astro", () => {
  it("entrega o menu como <details data-menu> com o <summary>, e carrega o script", () => {
    const fonte = readFileSync(
      join(import.meta.dirname, "..", "componentes", "Cabecalho.astro"),
      "utf8",
    );

    expect(fonte).toContain("<details data-menu>");
    expect(fonte).toMatch(/<details data-menu>\s*<summary\b/);
    expect(fonte).toContain('import "../scripts/menu";');
  });
});
