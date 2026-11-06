/**
 * @file Botão de copiar do bloco `Comando`: revela o botão e copia o comando para a área de transferência.
 *
 * Melhoria progressiva (RF-07): o `Comando.astro` entrega o botão com `hidden`. Este script o revela só
 * se `navigator.clipboard` existe; sem JavaScript, ou sem a API, o botão continua oculto e o comando
 * segue visível e selecionável. O resultado vai para uma região `role="status"`, que o leitor de tela
 * anuncia, e o rótulo do botão também troca por alguns segundos para quem enxerga.
 *
 * Os textos (o rótulo "Copiado", o aviso "Comando copiado" e "Não foi possível copiar o comando")
 * chegam por atributos `data-*` do bloco, escritos pelo componente a partir de `textos.ts`: o script
 * não conhece idioma. Roda como arquivo externo do Astro, sem inline (RNF-01).
 */

/** Quanto tempo o rótulo do botão fica mostrando o resultado, em milissegundos. */
const DURACAO_AVISO_MS = 2000;

/**
 * Liga o botão de copiar de um bloco `Comando`.
 *
 * @param bloco - elemento `[data-comando]` com o `<code>`, o `<button>` e o `[role=status]`
 */
function ligarBloco(bloco: HTMLElement): void {
  const codigo = bloco.querySelector("code");
  const botao = bloco.querySelector("button");
  const status = bloco.querySelector('[role="status"]');
  if (!codigo || !botao || !status) return;

  const rotuloInicial = botao.textContent ?? "";
  let temporizador: number | undefined;

  botao.hidden = false;
  botao.addEventListener("click", async () => {
    let rotulo: string;
    let anuncio: string;
    try {
      await navigator.clipboard.writeText(codigo.textContent ?? "");
      rotulo = bloco.dataset.copiado ?? "";
      anuncio = bloco.dataset.anuncio ?? rotulo;
    } catch {
      // Permissão negada ou página sem contexto seguro: avisa em vez de falhar em silêncio.
      rotulo = anuncio = bloco.dataset.falhou ?? "";
    }
    status.textContent = anuncio;
    botao.textContent = rotulo;
    window.clearTimeout(temporizador);
    temporizador = window.setTimeout(() => {
      botao.textContent = rotuloInicial;
      status.textContent = "";
    }, DURACAO_AVISO_MS);
  });
}

/**
 * Liga todos os blocos `Comando` de um trecho do documento.
 *
 * @param raiz - onde procurar os blocos; o documento inteiro na página
 */
export function ativarCopiar(raiz: ParentNode): void {
  if (!("clipboard" in navigator)) return;
  raiz.querySelectorAll<HTMLElement>("[data-comando]").forEach(ligarBloco);
}

ativarCopiar(document);
