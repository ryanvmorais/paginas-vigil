# Contribuindo com as Páginas Vigil

Obrigado pelo interesse em melhorar as Páginas Vigil. Ao participar, você concorda em seguir o [Código de Conduta](CODE_OF_CONDUCT.md).

Contribuições são bem-vindas: correções de erros, textos e traduções que podem ficar mais claros e ideias novas. Se for algo grande, abra uma issue antes de escrever código, para combinarmos o caminho.

## Desenvolvimento

O projeto é um workspace [pnpm](https://pnpm.io/pt/) com três pacotes: `packages/tema` (tema e utilidades compartilhados), `apps/webvigil` e `apps/mailvigil` (os dois sites, feitos em [Astro](https://astro.build/)). O código é TypeScript, e cada site existe em português e em inglês.

Como instalar e ativar o hook de pre-commit está na seção [Desenvolvimento do README](README.md#desenvolvimento). A visão da arquitetura e das convenções para quem usa o Claude Code está no [CLAUDE.md](CLAUDE.md).

## Antes de abrir um pull request

Rode o portão de qualidade inteiro (formatação, lint, tipos, testes e build, listados na seção [Desenvolvimento do README](README.md#desenvolvimento)) e confira que ele está verde. O CI roda esta mesma sequência, e o hook de pre-commit roda as quatro primeiras etapas.

## Convenções

- **Idioma:** código, comentários, mensagens de commit e documentação são em português; o texto que o visitante lê segue o idioma da página (português ou inglês).
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). Os pull requests são integrados com squash.
- **Issues e PRs:** um bug ou uma ideia começa como issue (os formulários estão em `.github/ISSUE_TEMPLATE/`); o PR que a resolve diz `Closes #N`, para a issue fechar no merge. Uma correção trivial pode ir direto para um PR.
- **Textos nos dois idiomas:** todo texto da página tem versão em português e em inglês, e um teste confere que nenhuma chave falta em um dos lados.

## Relatando problemas de segurança

Não abra issue pública para vulnerabilidade nas Páginas Vigil: veja o [SECURITY.md](SECURITY.md).
