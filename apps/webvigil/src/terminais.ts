/**
 * @file Saída do terminal da página do WebVigil, como HTML.
 *
 * Saída real da ferramenta, tirada do mockup aprovado da spec 002. A do WebVigil só existe em
 * inglês, então as duas versões da página mostram a mesma.
 * As classes `t-*` (cor) e as tags `<b>` e `<i>` são as do `terminal.css` do tema. O HTML é nosso e
 * entra por `set:html`; o comando digitado fica em `textos.ts`. Sem a linha do comando: o
 * `Terminal` a escreve.
 */

import type { Idioma } from "@paginas-vigil/tema/idiomas";

const SAIDA_EN = [
  '<span class="t-med t-b">Active Mode</span> — sending crafted requests. Only scan systems you are authorized to test.',
  "Authorization on record: <i>trying WebVigil</i>",
  "<b>WebVigil</b> — http://127.0.0.1:9100/",
  "┏━━━━━━━━━━┳━━━━━━━┓",
  "┃ <b>Severity</b> ┃ <b>Count</b> ┃",
  "┡━━━━━━━━━━╇━━━━━━━┩",
  '│ <span class="t-crit t-b">CRITICAL</span> │     4 │',
  '│ <span class="t-high t-b">HIGH</span>     │    15 │',
  '│ <span class="t-med t-b">MEDIUM</span>   │     9 │',
  '│ <span class="t-low t-b">LOW</span>      │    15 │',
  '│ <span class="t-dim t-b">INFO</span>     │     2 │',
  "└──────────┴───────┘",
  '<span class="t-dim">…</span>',
  '      <span class="t-high t-b">HIGH</span>  Werkzeug interactive debugger exposed  http://127.0.0.1:9100/boom',
  '    <span class="t-med t-b">MEDIUM</span>  Content-Security-Policy header is missing  http://127.0.0.1:9100/',
  '    <span class="t-med t-b">MEDIUM</span>  jquery 1.7.1 has known vulnerabilities  http://127.0.0.1:9100/static/jquery-1.7.1.min.js',
  "       <span class=\"t-low t-b\">LOW</span>  Cookie 'session' is set without the HttpOnly attribute",
].join("\n");

/** Saída do terminal por idioma. */
export const saidaTerminal: Record<Idioma, string> = { pt: SAIDA_EN, en: SAIDA_EN };
