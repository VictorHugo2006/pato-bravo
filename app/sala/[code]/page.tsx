"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoom, type PresenceMeta } from "@/lib/useRoom";
import { getClientId, getNick, setNick as persistNick, isHostOf } from "@/lib/identity";
import { ranking, type GameState, type Player } from "@/lib/game";

export default function SalaPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();
  const [nick, setNickState] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const n = getNick();
    setNickState(n);
    setDraft(n);
  }, []);

  if (nick === null) {
    return <Centered>Carregando…</Centered>;
  }

  if (!nick.trim()) {
    return (
      <Centered>
        <div className="w-full max-w-sm">
          <div className="text-5xl text-center mb-3">🦆</div>
          <h1 className="text-2xl font-bold text-center text-yellow-300 mb-1">
            Entrar na sala {code}
          </h1>
          <p className="text-emerald-200/70 text-center text-sm mb-5">
            Escolha um apelido pra jogar.
          </p>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 16))}
            placeholder="Seu apelido"
            className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-lg outline-none focus:border-yellow-300/70 placeholder:text-white/30"
          />
          <button
            onClick={() => {
              if (draft.trim().length < 2) return;
              persistNick(draft);
              setNickState(draft.trim());
            }}
            disabled={draft.trim().length < 2}
            className="w-full mt-4 rounded-xl bg-yellow-400 text-emerald-950 font-bold py-3 disabled:opacity-40 active:scale-[0.98] transition"
          >
            Entrar
          </button>
        </div>
      </Centered>
    );
  }

  return <Room code={code} nick={nick} />;
}

function Room({ code, nick }: { code: string; nick: string }) {
  const router = useRouter();
  const isHost = isHostOf(code);
  const me: PresenceMeta = useMemo(
    () => ({ id: getClientId(), nick, isHost }),
    [nick, isHost],
  );

  const { state, online, status, error, send, clearError } = useRoom(code, me, isHost);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 2500);
    return () => clearTimeout(t);
  }, [error, clearError]);

  if (status === "no-config") {
    return (
      <Centered>
        <div className="max-w-sm text-center">
          <div className="text-5xl mb-3">🔌</div>
          <h1 className="text-xl font-bold text-amber-300 mb-2">
            Multiplayer desativado
          </h1>
          <p className="text-emerald-100/80 text-sm">
            Preencha as chaves do Supabase no arquivo{" "}
            <code className="font-mono bg-black/30 px-1 rounded">.env.local</code> e
            reinicie o servidor pra jogar online.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-white/10 px-5 py-2.5 font-medium"
          >
            ← Voltar
          </button>
        </div>
      </Centered>
    );
  }

  return (
    <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 py-5">
      <TopBar code={code} status={status} onlineCount={online.length} onLeave={() => router.push("/")} />

      {error && (
        <div className="mt-3 rounded-xl bg-rose-500/20 border border-rose-400/40 px-4 py-2.5 text-rose-100 text-sm animate-pop">
          {error}
        </div>
      )}

      {!state ? (
        <Connecting isHost={me.isHost} />
      ) : state.phase === "lobby" ? (
        <Lobby state={state} me={me} send={send} />
      ) : state.phase === "playing" ? (
        <Playing state={state} me={me} send={send} />
      ) : state.phase === "reveal" ? (
        <Reveal state={state} me={me} send={send} />
      ) : (
        <GameOver state={state} me={me} send={send} />
      )}
    </main>
  );
}

/* ---------- Componentes de tela ---------- */

function TopBar({
  code,
  status,
  onlineCount,
  onLeave,
}: {
  code: string;
  status: string;
  onlineCount: number;
  onLeave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between">
      <button onClick={onLeave} className="text-emerald-200/70 text-sm">
        ← Sair
      </button>
      <button
        onClick={() => {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }
        }}
        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5"
      >
        <span className="text-xs text-emerald-200/70">Sala</span>
        <span className="font-mono font-bold tracking-[0.25em] text-yellow-300">
          {code}
        </span>
        <span className="text-xs text-emerald-200/60">{copied ? "✓ copiado" : "📋"}</span>
      </button>
      <div className="flex items-center gap-1.5 text-xs text-emerald-200/70">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            status === "connected" ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />
        {onlineCount}
      </div>
    </div>
  );
}

function Lobby({
  state,
  me,
  send,
}: {
  state: GameState;
  me: PresenceMeta;
  send: (a: { kind: "start"; totalRounds: number }) => void;
}) {
  const [rounds, setRounds] = useState(10);
  const connected = state.players.filter((p) => p.connected);
  const canStart = me.isHost && connected.length >= 2;

  return (
    <div className="flex-1 flex flex-col mt-6">
      <h2 className="text-2xl font-bold text-center mb-1">Sala de espera</h2>
      <p className="text-emerald-200/70 text-center text-sm mb-6">
        {connected.length < 2
          ? "Aguardando jogadores… compartilhe o código!"
          : me.isHost
            ? "Tudo pronto. Bora começar?"
            : "Aguardando o anfitrião iniciar…"}
      </p>

      <PlayerList state={state} me={me} showCards={false} />

      {me.isHost && (
        <div className="mt-6 rounded-xl bg-black/20 border border-white/10 p-4">
          <label className="text-sm text-emerald-100/90 font-medium">
            Rodadas: <span className="text-yellow-300 font-bold">{rounds}</span>
          </label>
          <input
            type="range"
            min={3}
            max={20}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full mt-2 accent-yellow-400"
          />
        </div>
      )}

      <div className="flex-1" />

      {me.isHost ? (
        <button
          onClick={() => send({ kind: "start", totalRounds: rounds })}
          disabled={!canStart}
          className="w-full mt-6 rounded-xl bg-yellow-400 text-emerald-950 font-bold text-lg py-3.5 disabled:opacity-40 active:scale-[0.98] transition"
        >
          {connected.length < 2 ? "Faltam jogadores…" : "Começar partida 🦆"}
        </button>
      ) : (
        <div className="w-full mt-6 rounded-xl bg-white/5 text-center text-emerald-200/70 py-3.5">
          Aguardando o anfitrião…
        </div>
      )}
    </div>
  );
}

function Playing({
  state,
  me,
  send,
}: {
  state: GameState;
  me: PresenceMeta;
  send: (a: { kind: "guess"; value: number } | { kind: "challenge" }) => void;
}) {
  const [guess, setGuess] = useState("");
  const myTurn = state.turnPlayerId === me.id;
  const turnNick =
    state.players.find((p) => p.id === state.turnPlayerId)?.nick ?? "?";
  const lastGuesserNick =
    state.players.find((p) => p.id === state.lastGuesserId)?.nick ?? null;
  const canChallenge = myTurn && state.currentGuess !== null;
  const minGuess = state.currentGuess === null ? 0 : state.currentGuess + 1;

  function chutar() {
    const v = parseInt(guess, 10);
    if (!Number.isFinite(v)) return;
    send({ kind: "guess", value: v });
    setGuess("");
  }

  return (
    <div className="flex-1 flex flex-col mt-4">
      <div className="flex items-center justify-between text-xs text-emerald-200/70 mb-3">
        <span>Rodada {state.round}/{state.totalRounds}</span>
        <span>{state.deckRemaining} cartas no monte</span>
      </div>

      {/* Carta da pergunta */}
      <div className="rounded-2xl bg-gradient-to-b from-yellow-50 to-yellow-100 text-emerald-950 p-5 shadow-xl animate-pop">
        <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-700/80">
          {state.question?.categoria}
        </div>
        <p className="text-xl font-bold leading-snug mt-1">
          {state.question?.pergunta}
        </p>
      </div>

      {/* Palpite atual */}
      <div className="mt-5 text-center">
        {state.currentGuess === null ? (
          <p className="text-emerald-200/70">Ninguém chutou ainda.</p>
        ) : (
          <>
            <p className="text-sm text-emerald-200/70">Último palpite</p>
            <p className="text-5xl font-black text-yellow-300 my-1 animate-pop" key={state.currentGuess}>
              {state.currentGuess}
            </p>
            <p className="text-sm text-emerald-200/70">por {lastGuesserNick}</p>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* Indicador de vez / controles */}
      {myTurn ? (
        <div className="mt-4 animate-pop">
          <p className="text-center text-yellow-300 font-bold mb-2">É a sua vez!</p>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={guess}
              min={minGuess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && chutar()}
              placeholder={`≥ ${minGuess}`}
              className="flex-1 rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-xl outline-none focus:border-yellow-300/70 placeholder:text-white/30"
            />
            <button
              onClick={chutar}
              disabled={guess.trim() === "" || Number(guess) < minGuess}
              className="rounded-xl bg-emerald-500 px-6 font-bold disabled:opacity-40 active:scale-[0.98] transition"
            >
              Chutar
            </button>
          </div>
          <button
            onClick={() => send({ kind: "challenge" })}
            disabled={!canChallenge}
            className="w-full mt-3 rounded-xl bg-rose-500 font-black text-lg py-3.5 disabled:opacity-30 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span className={canChallenge ? "animate-wiggle inline-block" : ""}>🦆</span>
            Pato Bravo!
          </button>
          {!canChallenge && (
            <p className="text-center text-xs text-emerald-200/50 mt-1.5">
              Você abre a rodada — só dá pra desafiar depois que alguém chuta.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-white/5 text-center py-4">
          <span className="text-emerald-200/70">Vez de </span>
          <span className="font-bold text-yellow-300">{turnNick}</span>
          <span className="text-emerald-200/70">…</span>
        </div>
      )}

      <div className="mt-5">
        <PlayerList state={state} me={me} showCards />
      </div>
    </div>
  );
}

function Reveal({
  state,
  me,
  send,
}: {
  state: GameState;
  me: PresenceMeta;
  send: (a: { kind: "next" }) => void;
}) {
  const r = state.lastResult!;
  const isLast = state.round >= state.totalRounds || state.deckRemaining <= 0;
  const iLost = r.loserId === me.id;

  return (
    <div className="flex-1 flex flex-col mt-4">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center animate-pop">
        <p className="text-sm text-emerald-200/70">{r.pergunta}</p>
        <p className="text-xs uppercase tracking-wider text-emerald-300/60 mt-3">
          Resposta certa
        </p>
        <p className="text-6xl font-black text-emerald-300 my-1">{r.resposta}</p>
        <p className="text-sm text-emerald-200/70">
          {r.guesserNick} chutou <b className="text-yellow-300">{r.guess}</b> e{" "}
          {r.challengerNick} gritou <b className="text-rose-300">Pato Bravo!</b>
        </p>

        <div className="mt-4 rounded-xl bg-black/30 p-3">
          {r.reason === "overshoot" ? (
            <p className="text-sm">
              🎯 O palpite <b>passou</b> da resposta — <b className="text-rose-300">{r.guesserNick}</b> leva a carta!
            </p>
          ) : (
            <p className="text-sm">
              😅 O palpite estava <b>dentro</b> — o desafio furou, <b className="text-rose-300">{r.challengerNick}</b> leva a carta!
            </p>
          )}
        </div>

        <div className="mt-4 text-3xl">{iLost ? "🃏 Você levou a carta!" : `🃏 ${r.loserNick} levou a carta`}</div>
      </div>

      <div className="mt-5">
        <PlayerList state={state} me={me} showCards highlightId={r.loserId} />
      </div>

      <div className="flex-1" />

      {me.isHost ? (
        <button
          onClick={() => send({ kind: "next" })}
          className="w-full mt-6 rounded-xl bg-yellow-400 text-emerald-950 font-bold text-lg py-3.5 active:scale-[0.98] transition"
        >
          {isLast ? "Ver resultado final 🏆" : "Próxima rodada →"}
        </button>
      ) : (
        <div className="w-full mt-6 rounded-xl bg-white/5 text-center text-emerald-200/70 py-3.5">
          Aguardando o anfitrião…
        </div>
      )}
    </div>
  );
}

function GameOver({
  state,
  me,
  send,
}: {
  state: GameState;
  me: PresenceMeta;
  send: (a: { kind: "restart" }) => void;
}) {
  const ordenado = ranking(state.players);
  const maxCards = Math.max(...ordenado.map((p) => p.cards));
  const perdedores = ordenado.filter((p) => p.cards === maxCards);

  return (
    <div className="flex-1 flex flex-col mt-4">
      <div className="text-center animate-pop">
        <div className="text-6xl mb-2">🏆</div>
        <h2 className="text-2xl font-black text-yellow-300">Fim de jogo!</h2>
        <p className="text-emerald-200/80 mt-1">
          {perdedores.length === 1
            ? `${perdedores[0].nick} virou o Pato Bravo 🦆`
            : "Empate na lanterna! 🦆"}
        </p>
      </div>

      <div className="mt-6 space-y-2">
        {ordenado.map((p, i) => {
          const ehPerdedor = p.cards === maxCards;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                ehPerdedor
                  ? "bg-rose-500/20 border border-rose-400/40"
                  : "bg-emerald-500/10 border border-emerald-400/20"
              }`}
            >
              <span className="text-lg w-6 text-center">
                {ehPerdedor ? "🦆" : i === 0 ? "🥇" : "✅"}
              </span>
              <span className="flex-1 font-semibold">
                {p.nick} {p.id === me.id && <span className="text-xs text-emerald-300/70">(você)</span>}
              </span>
              <span className="text-sm text-emerald-100/80">{p.cards} 🃏</span>
            </div>
          );
        })}
      </div>

      <div className="flex-1" />

      {me.isHost ? (
        <button
          onClick={() => send({ kind: "restart" })}
          className="w-full mt-6 rounded-xl bg-yellow-400 text-emerald-950 font-bold text-lg py-3.5 active:scale-[0.98] transition"
        >
          Jogar de novo 🔁
        </button>
      ) : (
        <div className="w-full mt-6 rounded-xl bg-white/5 text-center text-emerald-200/70 py-3.5">
          Aguardando o anfitrião reiniciar…
        </div>
      )}
    </div>
  );
}

/* ---------- Auxiliares ---------- */

function PlayerList({
  state,
  me,
  showCards,
  highlightId,
}: {
  state: GameState;
  me: PresenceMeta;
  showCards: boolean;
  highlightId?: string;
}) {
  return (
    <div className="space-y-2">
      {state.players.map((p: Player) => {
        const isTurn = state.turnPlayerId === p.id;
        const isHighlight = highlightId === p.id;
        return (
          <div
            key={p.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border transition ${
              isHighlight
                ? "bg-rose-500/20 border-rose-400/40"
                : isTurn
                  ? "bg-yellow-400/15 border-yellow-300/40"
                  : "bg-white/5 border-white/10"
            } ${!p.connected ? "opacity-40" : ""}`}
          >
            <span className="text-base">
              {p.id === state.hostId ? "👑" : isTurn ? "👉" : "🎮"}
            </span>
            <span className="flex-1 font-medium">
              {p.nick}
              {p.id === me.id && (
                <span className="text-xs text-emerald-300/70"> (você)</span>
              )}
              {!p.connected && (
                <span className="text-xs text-rose-300/70"> · offline</span>
              )}
            </span>
            {showCards && (
              <span className="text-sm text-emerald-100/80 tabular-nums">
                {p.cards} 🃏
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Connecting({ isHost }: { isHost: boolean }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);
  return (
    <Centered>
      <div className="max-w-xs">
        <div className="text-5xl mb-3 animate-pop">🦆</div>
        <p className="text-emerald-100/80">Conectando à sala…</p>
        {slow && !isHost && (
          <p className="mt-4 text-sm text-amber-200/80 animate-pop">
            Está demorando? Confira se o <b>código está certo</b> e peça pro
            anfitrião <b>deixar a tela do jogo aberta</b> no celular (sem trocar
            de app nem bloquear a tela enquanto vocês entram).
          </p>
        )}
        {slow && isHost && (
          <p className="mt-4 text-sm text-amber-200/80 animate-pop">
            Está demorando pra conectar. Verifique sua internet — se persistir,
            volte e crie a sala de novo.
          </p>
        )}
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex items-center justify-center px-5 text-center text-emerald-100/80">
      {children}
    </main>
  );
}
