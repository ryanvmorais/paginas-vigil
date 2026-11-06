/**
 * @file Acabamento do menu do celular: fecha o painel ao ativar um link, com Esc e ao clicar fora.
 *
 * Melhoria progressiva (RF-06, ADR-1): o `Cabecalho.astro` entrega o menu como um `<details>`, que
 * abre e fecha sem JavaScript. Este script só cobre o que o elemento não faz sozinho: o painel
 * ficaria aberto atrás do conteúdo depois de o visitante tocar numa seção, e não fecharia com Esc
 * nem com um toque fora dele. Roda como arquivo externo do Astro, sem inline (RNF-01).
 */

/**
 * Liga o fechamento de um menu `<details data-menu>`.
 *
 * @param menu - o `<details>` do menu, com o `<summary>` e a lista de links
 */
function ligarMenu(menu: HTMLDetailsElement): void {
  const botao = menu.querySelector("summary");

  // O link navega para a âncora (ação padrão do clique) e o painel se fecha junto.
  menu.addEventListener("click", (evento) => {
    if (evento.target instanceof Element && evento.target.closest("a")) menu.open = false;
  });

  // Esc fecha e devolve o foco ao botão, senão o foco se perde no painel que sumiu.
  menu.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape" || !menu.open) return;
    menu.open = false;
    botao?.focus();
  });

  document.addEventListener("click", (evento) => {
    if (menu.open && evento.target instanceof Node && !menu.contains(evento.target)) {
      menu.open = false;
    }
  });
}

/**
 * Liga todos os menus de um trecho do documento.
 *
 * @param raiz - onde procurar os menus; o documento inteiro na página
 */
export function ativarMenu(raiz: ParentNode): void {
  raiz.querySelectorAll<HTMLDetailsElement>("details[data-menu]").forEach(ligarMenu);
}

ativarMenu(document);
