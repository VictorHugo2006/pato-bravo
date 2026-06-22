"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "./supabaseClient";
import {
  applyAction,
  type Action,
  type GameState,
  type HostSecret,
  type Player,
} from "./game";

export interface PresenceMeta {
  id: string;
  nick: string;
  isHost: boolean;
}

export type ConnStatus = "idle" | "connecting" | "connected" | "no-config";

interface UseRoomResult {
  state: GameState | null;
  online: PresenceMeta[];
  status: ConnStatus;
  isHost: boolean;
  error: string | null;
  send: (action: Omit<Action, "actorId">) => void;
  clearError: () => void;
}

function emptyState(hostId: string, players: Player[]): GameState {
  return {
    phase: "lobby",
    hostId,
    players,
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
}

/**
 * Gerencia uma sala multiplayer. O host (criador da sala) é a fonte da verdade:
 * mantém o estado completo, recebe as ações dos demais via broadcast, aplica a
 * lógica e re-transmite o estado para todos.
 */
export function useRoom(
  code: string,
  me: PresenceMeta,
  initialIsHost: boolean,
): UseRoomResult {
  const [state, setState] = useState<GameState | null>(null);
  const [online, setOnline] = useState<PresenceMeta[]>([]);
  const [status, setStatus] = useState<ConnStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isHostRef = useRef(initialIsHost);
  const hostStateRef = useRef<GameState | null>(null);
  const secretRef = useRef<HostSecret>({ deck: [], pos: 0, resposta: null });
  const meRef = useRef(me);
  meRef.current = me;

  const broadcastState = useCallback((s: GameState) => {
    hostStateRef.current = s;
    setState(s);
    channelRef.current?.send({ type: "broadcast", event: "state", payload: s });
  }, []);

  // Host: reconcilia a lista de jogadores com quem está presente (só no lobby).
  const reconcilePlayers = useCallback((presences: PresenceMeta[]) => {
    if (!isHostRef.current) return;
    let s = hostStateRef.current;
    if (!s) {
      s = emptyState(meRef.current.id, []);
      hostStateRef.current = s;
    }

    const onlineIds = new Set(presences.map((p) => p.id));
    let players = s.players.map((p) => ({
      ...p,
      connected: onlineIds.has(p.id),
    }));

    if (s.phase === "lobby") {
      // No lobby, adiciona novos jogadores na ordem de chegada.
      for (const pr of presences) {
        if (!players.some((p) => p.id === pr.id)) {
          players.push({ id: pr.id, nick: pr.nick, cards: 0, connected: true });
        }
      }
      // Atualiza nicks que possam ter mudado.
      players = players.map((p) => {
        const pr = presences.find((x) => x.id === p.id);
        return pr ? { ...p, nick: pr.nick } : p;
      });
    }

    broadcastState({ ...s, players });
  }, [broadcastState]);

  const handleAction = useCallback(
    (action: Action) => {
      if (!isHostRef.current) return;
      const s = hostStateRef.current;
      if (!s) return;
      const next: GameState = JSON.parse(JSON.stringify(s));
      const err = applyAction(next, secretRef.current, action);
      if (err) {
        // Devolve o erro só para quem disparou a ação.
        channelRef.current?.send({
          type: "broadcast",
          event: "error",
          payload: { to: action.actorId, message: err },
        });
        return;
      }
      broadcastState(next);
    },
    [broadcastState],
  );

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("no-config");
      return;
    }
    setStatus("connecting");

    const channel = supabase.channel(`pato:${code}`, {
      config: {
        broadcast: { self: false },
        presence: { key: meRef.current.id },
      },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "state" }, ({ payload }) => {
      if (isHostRef.current) return; // host usa o próprio estado
      setState(payload as GameState);
    });

    channel.on("broadcast", { event: "action" }, ({ payload }) => {
      handleAction(payload as Action);
    });

    channel.on("broadcast", { event: "error" }, ({ payload }) => {
      const p = payload as { to: string; message: string };
      if (p.to === meRef.current.id) setError(p.message);
    });

    // Cliente novo pede o estado atual; host responde transmitindo.
    channel.on("broadcast", { event: "hello" }, () => {
      if (isHostRef.current && hostStateRef.current) {
        channelRef.current?.send({
          type: "broadcast",
          event: "state",
          payload: hostStateRef.current,
        });
      }
    });

    channel.on("presence", { event: "sync" }, () => {
      const stateMap = channel.presenceState<PresenceMeta>();
      const list: PresenceMeta[] = [];
      for (const key of Object.keys(stateMap)) {
        const metas = stateMap[key];
        if (metas && metas[0]) list.push(metas[0]);
      }
      setOnline(list);
      reconcilePlayers(list);
    });

    channel.subscribe(async (subStatus) => {
      if (subStatus === "SUBSCRIBED") {
        setStatus("connected");
        await channel.track(meRef.current);
        if (isHostRef.current) {
          if (!hostStateRef.current) {
            hostStateRef.current = emptyState(meRef.current.id, [
              { id: meRef.current.id, nick: meRef.current.nick, cards: 0, connected: true },
            ]);
          }
          broadcastState(hostStateRef.current);
        } else {
          // Pede o estado atual ao host.
          channel.send({ type: "broadcast", event: "hello", payload: {} });
        }
      }
    });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const send = useCallback((action: Omit<Action, "actorId">) => {
    const full = { ...action, actorId: meRef.current.id } as Action;
    if (isHostRef.current) {
      handleAction(full);
    } else {
      channelRef.current?.send({ type: "broadcast", event: "action", payload: full });
    }
  }, [handleAction]);

  const clearError = useCallback(() => setError(null), []);

  return {
    state,
    online,
    status,
    isHost: initialIsHost,
    error,
    send,
    clearError,
  };
}
