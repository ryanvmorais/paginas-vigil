# Política de segurança

## O que recebe correção

Só os sites no ar recebem correção de segurança. Eles refletem a branch `main`, e a correção vai ao ar no deploy seguinte.

| O quê                                           | Suportado |
| ----------------------------------------------- | --------- |
| os sites no ar (WebVigil e MailVigil, a `main`) | sim       |
| cópias antigas e forks                          | não       |

## Como relatar uma vulnerabilidade

Relate problemas de segurança nas Páginas Vigil **em privado**, pelos avisos de segurança do GitHub: abra a aba **Security** do repositório e escolha **Report a vulnerability**. Não abra issue nem pull request público para isso.

Inclua o necessário para reproduzir: o endereço da página, o navegador, o que você fez, o que esperava e o que aconteceu, e o impacto que você enxerga.

Nós nos comprometemos a **confirmar o recebimento em até 7 dias** e a enviar uma primeira avaliação em até 14.

## Política de divulgação

Seguimos a divulgação coordenada. A correção é preparada em privado, publicada, e só então o aviso é divulgado; o prazo máximo é de **90 dias** a partir do relato, menos quando a correção ficar pronta antes. Damos o crédito ao relator no aviso, a menos que ele peça para não aparecer.

## Escopo

As Páginas Vigil são dois sites estáticos de apresentação, um para o [WebVigil](https://github.com/ryanvmorais/webvigil) e outro para o [MailVigil](https://github.com/ryanvmorais/mailvigil). Não têm servidor próprio, banco de dados, conta de usuário nem formulário que envie dados a nós. A única medição de visitas é o Google Analytics, que só roda depois que o visitante consente.

**Relate aqui** (vulnerabilidade nas Páginas Vigil): qualquer coisa que permita a um texto ou a um endereço de fora virar o site contra quem o abre, ou que quebre uma das garantias dele. Por exemplo:

- injeção de marcação ou de script numa página;
- medição de visitas que dispare antes do consentimento, ou que ignore a recusa;
- uma falha na política de segurança de conteúdo (CSP) da página ou nos cabeçalhos de segurança da hospedagem;
- um recurso de terceiros além dos documentados que a página passe a carregar;
- um segredo ou credencial exposto no código ou no resultado do build.

**Não é vulnerabilidade nas Páginas Vigil**: falha no [WebVigil](https://github.com/ryanvmorais/webvigil) ou no [MailVigil](https://github.com/ryanvmorais/mailvigil) em si (relate no repositório de cada um, também em privado), e erro de texto ou de tradução (abra uma issue comum).
