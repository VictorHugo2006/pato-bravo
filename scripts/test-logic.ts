import { applyAction, type GameState, type HostSecret } from "../lib/game";

function makeState(): { state: GameState; secret: HostSecret } {
  const state: GameState = {
    phase: "lobby",
    hostId: "A",
    players: [
      { id: "A", nick: "Ana", cards: 0, connected: true },
      { id: "B", nick: "Bia", cards: 0, connected: true },
      { id: "C", nick: "Caio", cards: 0, connected: true },
    ],
    round: 0,
    totalRounds: 10,
    question: null,
    currentGuess: null,
    lastGuesserId: null,
    turnPlayerId: null,
    roundStarterId: null,
    lastResult: null,
    deckRemaining: 0,
  };
  const secret: HostSecret = { deck: [], pos: 0, resposta: null };
  return { state, secret };
}

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
}

// 1) start exige 2+ jogadores e distribui pergunta
{
  const { state, secret } = makeState();
  const err = applyAction(state, secret, { kind: "start", actorId: "A", totalRounds: 5 });
  check("start sem erro", err === null);
  check("fase virou playing", state.phase === "playing");
  check("primeira pergunta carregada", state.question !== null);
  check("vez do primeiro jogador (A)", state.turnPlayerId === "A");
  check("resposta guardada em segredo", secret.resposta !== null);
}

// 2) não-host não pode iniciar
{
  const { state, secret } = makeState();
  const err = applyAction(state, secret, { kind: "start", actorId: "B", totalRounds: 5 });
  check("não-host bloqueado de iniciar", typeof err === "string");
}

// 3) palpite precisa ser crescente e respeitar a vez
{
  const { state, secret } = makeState();
  applyAction(state, secret, { kind: "start", actorId: "A", totalRounds: 5 });
  secret.resposta = 50; // fixa para teste determinístico

  check("B não pode chutar fora da vez", typeof applyAction(state, secret, { kind: "guess", actorId: "B", value: 10 }) === "string");
  check("A chuta 10 ok", applyAction(state, secret, { kind: "guess", actorId: "A", value: 10 }) === null);
  check("vez passou para B", state.turnPlayerId === "B");
  check("B não pode chutar valor menor", typeof applyAction(state, secret, { kind: "guess", actorId: "B", value: 5 }) === "string");
  check("B chuta 40 ok", applyAction(state, secret, { kind: "guess", actorId: "B", value: 40 }) === null);
  check("vez passou para C", state.turnPlayerId === "C");
}

// 4) DESAFIO furado: palpite (40) <= resposta (50) => quem desafiou (C) leva a carta
{
  const { state, secret } = makeState();
  applyAction(state, secret, { kind: "start", actorId: "A", totalRounds: 5 });
  secret.resposta = 50;
  applyAction(state, secret, { kind: "guess", actorId: "A", value: 10 });
  applyAction(state, secret, { kind: "guess", actorId: "B", value: 40 });
  const err = applyAction(state, secret, { kind: "challenge", actorId: "C" });
  check("challenge sem erro", err === null);
  check("fase virou reveal", state.phase === "reveal");
  check("desafio furado: C (desafiante) levou a carta", state.players.find(p => p.id === "C")!.cards === 1);
  check("razão = wrong-challenge", state.lastResult!.reason === "wrong-challenge");
}

// 5) OVERSHOOT: palpite (60) > resposta (50) => quem chutou (B) leva a carta
{
  const { state, secret } = makeState();
  applyAction(state, secret, { kind: "start", actorId: "A", totalRounds: 5 });
  secret.resposta = 50;
  applyAction(state, secret, { kind: "guess", actorId: "A", value: 10 });
  applyAction(state, secret, { kind: "guess", actorId: "B", value: 60 });
  applyAction(state, secret, { kind: "challenge", actorId: "C" });
  check("overshoot: B (chutador) levou a carta", state.players.find(p => p.id === "B")!.cards === 1);
  check("razão = overshoot", state.lastResult!.reason === "overshoot");

  // 6) quem pegou a carta começa a próxima rodada
  const err = applyAction(state, secret, { kind: "next", actorId: "A" });
  check("next sem erro", err === null);
  check("rodada 2", state.round === 2);
  check("perdedor (B) abre a próxima rodada", state.roundStarterId === "B");
}

// 7) primeiro a jogar não pode desafiar (ninguém chutou ainda)
{
  const { state, secret } = makeState();
  applyAction(state, secret, { kind: "start", actorId: "A", totalRounds: 5 });
  const err = applyAction(state, secret, { kind: "challenge", actorId: "A" });
  check("abertura não pode desafiar", typeof err === "string");
}

console.log(`\nResultado: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
