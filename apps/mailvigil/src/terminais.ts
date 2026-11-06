/**
 * @file Saída do terminal da página do MailVigil, como HTML.
 *
 * Saída real do `mailvigil verdict` 1.7.0 sobre os relatórios sintéticos do gerador da própria ferramenta
 * (ver `specs/005-pagina-mailvigil/fatos.md`), tirada num terminal UTF-8: o português vem de `--lang pt-BR`
 * e leva acentos, como no terminal do visitante. É um recorte (veredito, motivo, origem e regras): a saída
 * inteira traz ainda as notas e o próximo passo.
 * As classes `t-*` (cor) e as tags `<b>` e `<i>` são as do `terminal.css` do tema. O HTML é nosso e
 * entra por `set:html`; o comando digitado fica em `textos.ts`. Sem a linha do comando: o
 * `Terminal` a escreve.
 */

import type { Idioma } from "@paginas-vigil/tema/idiomas";

const SAIDA_PT = [
  '<b>Veredito do MailVigil para example.com:</b> <span class="t-bad t-b">NÃO PRONTO</span> para p=reject',
  "",
  "Motivo: as falhas de origens não reconhecidas são 0.8% das mensagens (56 de",
  "        7056); o limite é 0.5%.",
  "  203.0.113.5  não reconhecido: 56 mensagens com falha",
  "",
  "<b>Regras</b>",
  "  regra                       medido           necessário  resultado",
  '  1  período coberto          29 dias          &gt;= 28       <span class="t-ok">passa</span>',
  '  2  dias com relatório       29 de 29 (100%)  &gt;= 80%      <span class="t-ok">passa</span>',
  '  3  mensagens vistas         7056             &gt;= 100      <span class="t-ok">passa</span>',
  '  4  falhas reconhecidas      0                &lt;= 0        <span class="t-ok">passa</span>',
  '  5  falhas não reconhecidas  56 (0.8%)        &lt;= 0.5%     <span class="t-bad t-b">FALHA</span>',
  "",
  '<span class="t-dim">$</span> echo $?',
  "4",
].join("\n");

const SAIDA_EN = [
  '<b>MailVigil verdict for example.com:</b> <span class="t-bad t-b">NOT READY</span> for p=reject',
  "",
  "Why: failures from unrecognized sources are 0.8% of the messages (56 of 7056);",
  "     the limit is 0.5%.",
  "  203.0.113.5  unrecognized: 56 failing messages",
  "",
  "<b>Rules</b>",
  "  rule                      measured         needed   result",
  '  1  period covered         29 days          &gt;= 28    <span class="t-ok">pass</span>',
  '  2  days with a report     29 of 29 (100%)  &gt;= 80%   <span class="t-ok">pass</span>',
  '  3  messages seen          7056             &gt;= 100   <span class="t-ok">pass</span>',
  '  4  recognized failures    0                &lt;= 0     <span class="t-ok">pass</span>',
  '  5  unrecognized failures  56 (0.8%)        &lt;= 0.5%  <span class="t-bad t-b">FAIL</span>',
  "",
  '<span class="t-dim">$</span> echo $?',
  "4",
].join("\n");

/** Saída do terminal por idioma. */
export const saidaTerminal: Record<Idioma, string> = { pt: SAIDA_PT, en: SAIDA_EN };
