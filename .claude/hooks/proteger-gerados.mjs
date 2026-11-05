/**
 * @file Hook PreToolUse (Edit|Write): bloqueia a edição manual de arquivo gerado por ferramenta.
 *
 * O `pnpm-lock.yaml` é escrito pelo pnpm (editar à mão corrompe o grafo de dependências e quebra
 * a instalação reprodutível), e `dist/` e `.astro/` são saída do Astro, recriada a cada build.
 * Em violação, sai com 2 e devolve a orientação pelo stderr, que o Claude Code repassa ao agente
 * para ele seguir o caminho certo.
 */

import { lerEvento } from "./ferramentas.mjs";

// Trechos protegidos (comparados em minúsculas e com "/") e o caminho certo de cada um.
const PROTEGIDOS = {
  "pnpm-lock.yaml":
    "use `pnpm install`, `pnpm add` ou `pnpm remove`; nunca edite o lockfile à mão.",
  "/dist/": "edite o código-fonte e rode `pnpm build`; a pasta é saída do build.",
  "/.astro/":
    "rode `pnpm typecheck` ou `pnpm build` para recriar os tipos; a pasta é gerada pelo Astro.",
};

const evento = await lerEvento();
const caminho = String(evento.tool_input?.file_path ?? "")
  .replaceAll("\\", "/")
  .toLowerCase();

for (const [alvo, orientacao] of Object.entries(PROTEGIDOS)) {
  if (caminho.includes(alvo)) {
    process.stderr.write(`Edição bloqueada: '${alvo}' é arquivo gerado. ${orientacao}`);
    process.exit(2);
  }
}
