# Fontes do tema

Três arquivos `woff2`, versionados aqui porque a política de segurança de conteúdo (CSP) do deploy não
permite buscar fonte em CDN de terceiros (spec `002-tema`, ADR-3). Cada um é um **subconjunto** da fonte
original, só com os caracteres que as páginas usam.

| Arquivo                    | Fonte e peso           | Origem                                                                      | Uso                          |
| -------------------------- | ---------------------- | --------------------------------------------------------------------------- | ---------------------------- |
| `sora-800.woff2`           | Sora ExtraBold (800)   | `ofl/sora/Sora[wght].ttf` do repositório `google/fonts`, instanciada em 800 | títulos e nome do produto    |
| `jetbrains-mono-400.woff2` | JetBrains Mono Regular | `JetBrainsMono-Regular.ttf` da versão 2.304 do JetBrains Mono               | comandos e saída do terminal |
| `jetbrains-mono-700.woff2` | JetBrains Mono Bold    | `JetBrainsMono-Bold.ttf` da versão 2.304 do JetBrains Mono                  | destaques no terminal        |

O corpo do texto usa `system-ui` e não tem arquivo. A licença das duas famílias (SIL Open Font License 1.1)
está em [OFL.txt](OFL.txt).

## O que cada subconjunto cobre

- Latim básico (`U+0020-007E`) e latim-1 (`U+00A0-00FF`): inclui todos os acentos do português.
- Pontuação geral (`U+2000-206F`), o euro (`U+20AC`) e a marca registrada (`U+2122`).
- Só na JetBrains Mono: os caracteres de moldura (`U+2500-257F`), para a tabela do terminal alinhar.

Um caractere fora dessa lista (por exemplo `≤`, `≥`, `✓`, `✕`) não está nos arquivos e cai na fonte de
reserva do sistema. Se uma página passar a precisar de um desses, acrescente o intervalo e regere.

## Como regerar

Precisa do [uv](https://docs.astral.sh/uv/). Baixe as fontes originais para uma pasta temporária (nunca para
dentro do repositório), entre nela e rode:

```bash
BASE="U+0020-007E,U+00A0-00FF,U+2000-206F,U+20AC,U+2122"
MOLDURA="$BASE,U+2500-257F"

# Sora: fixa o peso variável em 800 e recorta.
uv run --with fonttools --with brotli fonttools varLib.instancer "Sora[wght].ttf" wght=800 -o Sora-800.ttf
uv run --with fonttools --with brotli pyftsubset Sora-800.ttf --unicodes="$BASE" \
  --flavor=woff2 --no-hinting --output-file=sora-800.woff2

# JetBrains Mono: dois pesos estáticos, com a moldura.
uv run --with fonttools --with brotli pyftsubset JetBrainsMono-Regular.ttf --unicodes="$MOLDURA" \
  --flavor=woff2 --no-hinting --output-file=jetbrains-mono-400.woff2
uv run --with fonttools --with brotli pyftsubset JetBrainsMono-Bold.ttf --unicodes="$MOLDURA" \
  --flavor=woff2 --no-hinting --output-file=jetbrains-mono-700.woff2
```

Confira o resultado antes de commitar: os três arquivos devem ter entre 10 e 25 KB cada, e a JetBrains Mono
deve conter os 128 caracteres de moldura. Se mudar o nome ou o peso de um arquivo, atualize também
`../estilos/fontes.css`.
