# Páginas Vigil

**Português (Brasil)** · [English](README.en.md)

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)
![deps](https://img.shields.io/badge/deps-pnpm-F69220?logo=pnpm&logoColor=white)
[![CI](https://github.com/ryanvmorais/paginas-vigil/actions/workflows/ci.yml/badge.svg)](https://github.com/ryanvmorais/paginas-vigil/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-Apache%202.0-blue)

**Este repositório guarda os dois sites estáticos, feitos em Astro, que apresentam o [WebVigil](https://github.com/ryanvmorais/webvigil), um scanner de vulnerabilidades web de código aberto, e o [MailVigil](https://github.com/ryanvmorais/mailvigil), um analisador de relatórios DMARC que diz se o domínio já está pronto para `p=reject`.**

Cada site é publicado no próprio subdomínio, em português e em inglês: o texto em português fica na raiz e o em inglês em `/en/`. As páginas são HTML estático gerado pelo Astro, sem framework de interface e sem servidor.

> **Status:** em construção. As páginas ainda não estão no ar.

## O que tem aqui

- **`apps/webvigil`**: o site do WebVigil.
- **`apps/mailvigil`**: o site do MailVigil.
- **`packages/tema`**: o tema que os dois sites compartilham: fontes, estilos, layout bilíngue, blocos de interface e a conferência de que todo texto existe nos dois idiomas.

## Desenvolvimento

Pré-requisitos: [Node](https://nodejs.org/) 26 ou mais novo e [pnpm](https://pnpm.io/pt/) 12.

```bash
# Instale as dependências
pnpm install

# Ative o hook de pre-commit (uma vez por clone)
git config core.hooksPath .githooks

# Rode um site em modo de desenvolvimento
pnpm --filter webvigil dev
pnpm --filter mailvigil dev
```

O portão de qualidade, o mesmo do CI e do pre-commit:

```bash
# Confere a formatação
pnpm format:check

# Lint
pnpm lint

# Checagem de tipos
pnpm typecheck

# Testes
pnpm test

# Build estático de cada site
pnpm build
```

O mapa de cada tecnologia da stack, com o porquê de cada escolha, está em [docs/stack.md](docs/stack.md), e as especificações de cada funcionalidade estão em [specs/](specs/README.md). Para contribuir, veja o [CONTRIBUTING.md](CONTRIBUTING.md). Para relatar um problema de segurança, veja o [SECURITY.md](SECURITY.md).

## Licença

[Apache-2.0](LICENSE).
