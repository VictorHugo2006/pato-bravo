import { QUESTIONS, type Question } from "./questions";

export type Phase = "lobby" | "playing" | "reveal" | "gameover";

/** Pergunta visível para todos (SEM a resposta — o host guarda a resposta em segredo). */
export interface PublicQuestion {
  id: number;
  pergunta: string;
  categoria: string;
}

export interface Player {
  id: string;
  nick: string;
  cards: number;
  connected: boolean;
}

export interface LastResult {
  pergunta: string;
  categoria: string;
  resposta: number;
  guess: number;
  guesserId: string;
  guesserNick: string;
  challengerId: string;
  challengerNick: string;
  loserId: string;
  loserNick: string;
  /** "overshoot" = o palpite passou da resposta; "wrong-challenge" = o desafio foi furado. */
  reason: "overshoot" | "wrong-challenge";
}

/** Estado compartilhado, transmitido pelo host para todos os jogadores. */
export interface GameState {
  phase: Phase;
  hostId: string;
  players: Player[];
  round: number;
  totalRounds: number;
  question: PublicQuestion | null;
  currentGuess: number | null;
  lastGuesserId: string | null;
  turnPlayerId: string | null;
  roundStarterId: string | null;
  lastResult: LastResult | null;
  deckRemaining: number;
}

/** Estado privado que só o host conhece. */
export interface HostSecret {
  deck: number[]; // ids de perguntas, embaralhados
  pos: number; // próxima posição no deck
  resposta: number | null; // resposta da pergunta atual
}

export type Action =
  | { kind: "start"; actorId: string; totalRounds: number }
  | { kind: "guess"; actorId: string; value: number }
  | { kind: "challenge"; actorId: string }
  | { kind: "next"; actorId: string }
  | { kind: "restart"; actorId: string };

export function makeRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sem I/O para não confundir
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function questionById(id: number): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

/** Próximo jogador conectado, seguindo a ordem da lista. */
export function nextConnectedId(players: Player[], fromId: string): string {
  if (players.length === 0) return fromId;
  const order = players.map((p) => p.id);
  let i = order.indexOf(fromId);
  if (i === -1) i = 0;
  for (let k = 0; k < order.length; k++) {
    i = (i + 1) % order.length;
    const p = players[i];
    if (p.connected) return p.id;
  }
  return fromId;
}

function nickOf(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.nick ?? "?";
}

/** Sorteia a próxima pergunta do deck, atualizando o estado e o segredo do host. */
function dealQuestion(state: GameState, secret: HostSecret, starterId: string): void {
  const id = secret.deck[secret.pos];
  const q = questionById(id)!;
  secret.pos += 1;
  secret.resposta = q.resposta;
  state.question = { id: q.id, pergunta: q.pergunta, categoria: q.categoria };
  state.currentGuess = null;
  state.lastGuesserId = null;
  state.roundStarterId = starterId;
  state.turnPlayerId = starterId;
  state.lastResult = null;
  state.deckRemaining = secret.deck.length - secret.pos;
  state.phase = "playing";
}

/**
 * Aplica uma ação ao estado (mutando state/secret). Só o host roda isto.
 * Retorna uma mensagem de erro (string) quando a ação é inválida, ou null em sucesso.
 */
export function applyAction(
  state: GameState,
  secret: HostSecret,
  action: Action,
): string | null {
  switch (action.kind) {
    case "start": {
      if (action.actorId !== state.hostId) return "Só o anfitrião pode iniciar.";
      if (state.phase !== "lobby" && state.phase !== "gameover")
        return "A partida já começou.";
      const connected = state.players.filter((p) => p.connected);
      if (connected.length < 2) return "Precisa de pelo menos 2 jogadores.";

      state.players = state.players.map((p) => ({ ...p, cards: 0 }));
      secret.deck = shuffle(QUESTIONS.map((q) => q.id));
      secret.pos = 0;
      state.round = 1;
      state.totalRounds = Math.min(action.totalRounds, secret.deck.length);
      dealQuestion(state, secret, connected[0].id);
      return null;
    }

    case "guess": {
      if (state.phase !== "playing") return "Não é hora de chutar.";
      if (action.actorId !== state.turnPlayerId) return "Não é a sua vez.";
      if (!Number.isFinite(action.value)) return "Palpite inválido.";
      const value = Math.round(action.value);
      if (value < 0) return "O palpite não pode ser negativo.";
      if (state.currentGuess !== null && value <= state.currentGuess)
        return `O palpite precisa ser maior que ${state.currentGuess}.`;

      state.currentGuess = value;
      state.lastGuesserId = action.actorId;
      state.turnPlayerId = nextConnectedId(state.players, action.actorId);
      return null;
    }

    case "challenge": {
      if (state.phase !== "playing") return "Não é hora de desafiar.";
      if (action.actorId !== state.turnPlayerId) return "Não é a sua vez.";
      if (state.currentGuess === null || state.lastGuesserId === null)
        return "Ninguém chutou ainda para você desafiar.";
      if (secret.resposta === null) return "Erro interno: sem resposta.";

      const resposta = secret.resposta;
      const guess = state.currentGuess;
      const guesserId = state.lastGuesserId;
      const challengerId = action.actorId;

      // Regra: se o palpite for MENOR OU IGUAL à resposta, o palpite era "seguro"
      // → quem desafiou errou e leva a carta. Se passou da resposta, quem chutou leva.
      let loserId: string;
      let reason: LastResult["reason"];
      if (guess <= resposta) {
        loserId = challengerId;
        reason = "wrong-challenge";
      } else {
        loserId = guesserId;
        reason = "overshoot";
      }

      state.players = state.players.map((p) =>
        p.id === loserId ? { ...p, cards: p.cards + 1 } : p,
      );

      state.lastResult = {
        pergunta: state.question!.pergunta,
        categoria: state.question!.categoria,
        resposta,
        guess,
        guesserId,
        guesserNick: nickOf(state.players, guesserId),
        challengerId,
        challengerNick: nickOf(state.players, challengerId),
        loserId,
        loserNick: nickOf(state.players, loserId),
        reason,
      };
      state.phase = "reveal";
      state.turnPlayerId = null;
      return null;
    }

    case "next": {
      if (action.actorId !== state.hostId) return "Só o anfitrião avança a rodada.";
      if (state.phase !== "reveal") return "Não é hora de avançar.";

      const loserId = state.lastResult?.loserId ?? state.players[0].id;
      const fimDoDeck = secret.pos >= secret.deck.length;
      const fimDasRodadas = state.round >= state.totalRounds;
      if (fimDoDeck || fimDasRodadas) {
        state.phase = "gameover";
        state.turnPlayerId = null;
        state.question = null;
        state.currentGuess = null;
        return null;
      }

      state.round += 1;
      // Quem pegou a carta começa a próxima rodada.
      const starter = state.players.find((p) => p.id === loserId && p.connected)
        ? loserId
        : nextConnectedId(state.players, loserId);
      dealQuestion(state, secret, starter);
      return null;
    }

    case "restart": {
      if (action.actorId !== state.hostId) return "Só o anfitrião reinicia.";
      state.phase = "lobby";
      state.round = 0;
      state.question = null;
      state.currentGuess = null;
      state.lastGuesserId = null;
      state.turnPlayerId = null;
      state.roundStarterId = null;
      state.lastResult = null;
      state.deckRemaining = 0;
      state.players = state.players.map((p) => ({ ...p, cards: 0 }));
      secret.resposta = null;
      secret.pos = 0;
      return null;
    }
  }
}

/** Ranking final: mais cartas = perdedor. */
export function ranking(players: Player[]): Player[] {
  return [...players].sort((a, b) => a.cards - b.cards);
}
