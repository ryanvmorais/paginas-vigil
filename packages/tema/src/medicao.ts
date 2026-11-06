/**
 * @file Validação do identificador de medição do Google Analytics 4.
 *
 * O identificador (`PUBLIC_GA_MEASUREMENT_ID`) vem do ambiente em tempo de build. Só um valor no
 * formato `G-` mais dez maiúsculas ou dígitos liga a medição; vazio ou fora do formato desliga tudo
 * (banner, controle de cookies e script), e o build segue sem falhar (RF-06). A conferência vale
 * também como defesa: o valor vai para um atributo do HTML e para a URL do `gtag.js`, então nada
 * que fuja do formato chega lá.
 */

/** Formato do identificador de medição do GA4. */
const FORMATO_ID = /^G-[A-Z0-9]{10}$/;

/**
 * Confere o identificador de medição.
 *
 * @param valor - valor lido do ambiente; vazio e ausente são aceitos como entrada
 * @returns o identificador, se está no formato `G-XXXXXXXXXX`; `undefined` caso contrário
 */
export function validarIdMedicao(valor: string | undefined): string | undefined {
  return valor !== undefined && FORMATO_ID.test(valor) ? valor : undefined;
}
