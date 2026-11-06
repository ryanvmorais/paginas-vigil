/**
 * @file Script de entrada do banner de consentimento: liga o núcleo ao DOM, ao cookie e ao `gtag` reais.
 *
 * É a cola fina do design (ADR-3): toda a decisão (ordem dos comandos do Consent Mode, gravação com
 * conferência, recuos do armazém) está em `consentimento.ts` e é testada sem navegador; aqui só se
 * montam os objetos reais e se ligam os eventos, e a conferência deste arquivo é a de navegador
 * (Etapa 4 da spec 003). Roda como arquivo externo empacotado pelo Astro, sem inline (RNF-01).
 *
 * Fluxo: define o estado negado, restaura a escolha gravada e, sem escolha, revela o banner. O
 * `gtag.js` só é baixado depois do aceite (ADR-1). O identificador de medição vem do atributo
 * `data-medicao` do banner, não deste arquivo (ADR-7): sem o banner (build sem medição) este script
 * nem é referenciado pela página, e, se for, não faz nada.
 */

import {
  type Armazem,
  type Escolha,
  type Meios,
  type Memoria,
  criarGtag,
  criarMedicao,
  gravarEscolha,
  lerCookie,
  lerEscolha,
  montarCookie,
  NOME_COOKIE,
} from "../consentimento";
import { validarIdMedicao } from "../medicao";

/** Classe posta no `<body>` enquanto o banner está aberto: reserva o espaço dele no fim da rolagem. */
const CLASSE_RESERVA = "reserva-consentimento";

/**
 * Propriedade CSS do `<body>` com a altura medida do cartão, em px. O `Consentimento.astro` soma a ela a
 * margem do cartão e a folga para calcular a reserva. Escrita por `style.setProperty`, que a CSP
 * `style-src 'self'` não bloqueia (spike da Etapa 0 da spec 004); o atributo `style` no HTML seria barrado.
 */
const PROPRIEDADE_ALTURA = "--altura-consentimento";

/**
 * Armazém da escolha no cookie do domínio do site principal.
 *
 * @returns o armazém sobre `document.cookie`
 */
function criarArmazemCookie(): Armazem {
  const https = window.location.protocol === "https:";
  return {
    ler: () => lerCookie(document.cookie),
    gravar: (valor) => {
      document.cookie = montarCookie(valor, https);
    },
    apagar: () => {
      document.cookie = montarCookie("", https, 0);
    },
  };
}

/**
 * Armazém da escolha no armazenamento local, o primeiro recuo.
 *
 * @returns o armazém, ou `undefined` se o navegador nega o acesso ao `localStorage`
 */
function criarArmazemLocal(): Armazem | undefined {
  try {
    const armazenamento = window.localStorage;
    return {
      ler: () => armazenamento.getItem(NOME_COOKIE) ?? undefined,
      gravar: (valor) => armazenamento.setItem(NOME_COOKIE, valor),
      apagar: () => armazenamento.removeItem(NOME_COOKIE),
    };
  } catch {
    // Só acessar `window.localStorage` já lança quando o navegador bloqueia os dados do site.
    return undefined;
  }
}

/**
 * Liga o banner de consentimento da página.
 *
 * @param secao - o elemento `[data-consentimento]`, com o identificador em `data-medicao`
 */
function ligarBanner(secao: HTMLElement): void {
  const id = validarIdMedicao(secao.dataset.medicao);
  const botaoAceitar = secao.querySelector<HTMLButtonElement>("[data-aceitar]");
  const botaoRecusar = secao.querySelector<HTMLButtonElement>("[data-recusar]");
  const botaoFechar = secao.querySelector<HTMLButtonElement>("[data-fechar]");
  const titulo = secao.querySelector<HTMLElement>("h2");
  const escolhaAtual = secao.querySelector<HTMLElement>("[data-escolha-atual]");
  const valorEscolha = secao.querySelector<HTMLElement>("[data-escolha-valor]");
  if (!id || !botaoAceitar || !botaoRecusar || !botaoFechar || !titulo) return;
  if (!escolhaAtual || !valorEscolha) return;

  const meios: Meios = { cookie: criarArmazemCookie(), local: criarArmazemLocal() };
  const memoria: Memoria = {};

  const dataLayer = ((window as unknown as { dataLayer?: unknown[] }).dataLayer ??= []);
  const medicao = criarMedicao({
    id,
    gtag: criarGtag(dataLayer),
    carregarScript(url) {
      const elemento = document.createElement("script");
      elemento.async = true;
      elemento.src = url;
      document.head.append(elemento);
    },
  });

  // Quem reabriu o banner, para devolver o foco a ele depois; vazio na primeira visita.
  let origem: HTMLElement | undefined;

  /** Publica no `<body>` a altura atual do cartão; o CSS faz a conta da reserva. */
  const publicarAltura = (): void => {
    const altura = Math.ceil(secao.getBoundingClientRect().height);
    document.body.style.setProperty(PROPRIEDADE_ALTURA, `${altura}px`);
  };

  // Só existe enquanto o banner está aberto. Sem `ResizeObserver` a propriedade não é escrita e o CSS
  // recua para uma reserva fixa.
  let observador: ResizeObserver | undefined;

  /** Mostra o banner e reserva o espaço dele no fim da página. */
  const abrir = (reaberto: boolean): void => {
    const escolha = reaberto ? lerEscolha(meios, memoria) : undefined;
    escolhaAtual.hidden = escolha === undefined;
    if (escolha !== undefined) {
      valorEscolha.textContent =
        (escolha === "aceita" ? secao.dataset.aceita : secao.dataset.recusada) ?? "";
    }
    secao.hidden = false;
    document.body.classList.add(CLASSE_RESERVA);
    // O cartão muda de altura com a largura da janela, a quebra do texto e o "Sua escolha atual"; por
    // isso a medida é observada, não tirada uma vez. A primeira leitura chega logo depois do `observe`.
    if (typeof ResizeObserver !== "undefined" && observador === undefined) {
      observador = new ResizeObserver(publicarAltura);
      observador.observe(secao);
    }
    // O leitor de tela anuncia o título ao reabrir; na primeira visita nada recebe foco à força.
    if (reaberto) titulo.focus();
  };

  /** Esconde o banner e devolve o foco: ao botão que o abriu, ou ao conteúdo na primeira visita. */
  const fechar = (): void => {
    secao.hidden = true;
    document.body.classList.remove(CLASSE_RESERVA);
    observador?.disconnect();
    observador = undefined;
    document.body.style.removeProperty(PROPRIEDADE_ALTURA);
    const alvo = origem ?? document.querySelector<HTMLElement>("main");
    if (alvo === null) return;
    if (origem === undefined) alvo.tabIndex = -1;
    alvo.focus({ preventScroll: true });
    origem = undefined;
  };

  /** Grava a escolha, aplica no Consent Mode e fecha o banner. */
  const escolher = (escolha: Escolha): void => {
    gravarEscolha(meios, memoria, escolha);
    medicao.aplicar(escolha);
    fechar();
  };

  botaoAceitar.addEventListener("click", () => escolher("aceita"));
  botaoRecusar.addEventListener("click", () => escolher("recusada"));
  botaoFechar.addEventListener("click", () => escolher("recusada"));

  // Esc só fecha sem mudar nada quando o banner foi reaberto (há uma escolha para manter).
  secao.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && origem !== undefined) fechar();
  });

  document.querySelectorAll<HTMLElement>("[data-gerenciar-cookies]").forEach((botao) => {
    botao.hidden = false;
    botao.addEventListener("click", () => {
      origem = botao;
      abrir(true);
    });
  });

  medicao.iniciar();
  const gravada = lerEscolha(meios, memoria);
  if (gravada === undefined) abrir(false);
  else medicao.aplicar(gravada);
}

const secao = document.querySelector<HTMLElement>("[data-consentimento]");
if (secao !== null) ligarBanner(secao);
