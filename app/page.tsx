"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getNick, setNick as persistNick, markHost } from "@/lib/identity";
import { makeRoomCode } from "@/lib/game";
import { supabaseConfigured } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [nick, setNickState] = useState("");
  const [code, setCode] = useState("");
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    setNickState(getNick());
  }, []);

  function criarSala() {
    if (!nick.trim()) return;
    persistNick(nick);
    const novo = makeRoomCode();
    markHost(novo);
    router.push(`/sala/${novo}`);
  }

  function entrarSala() {
    const c = code.trim().toUpperCase();
    if (!nick.trim() || c.length < 4) return;
    persistNick(nick);
    router.push(`/sala/${c}`);
  }

  const nickOk = nick.trim().length >= 2;

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="text-7xl mb-2 animate-pop select-none">🦆</div>
        <h1 className="text-4xl font-black tracking-tight text-yellow-300">
          Pato Bravo
        </h1>
        <p className="text-emerald-200/80 text-center mt-1 mb-8 text-sm">
          Chute números, blefe e diga <b>&quot;Pato Bravo!&quot;</b> na hora certa.
          Quem juntar mais cartas, perde!
        </p>

        {!supabaseConfigured && (
          <div className="w-full mb-5 rounded-xl bg-amber-500/15 border border-amber-400/40 px-4 py-3 text-amber-200 text-xs">
            ⚠️ Supabase ainda não configurado. Você consegue abrir as telas, mas o
            multiplayer online só funciona após preencher as chaves no{" "}
            <code className="font-mono">.env.local</code>.
          </div>
        )}

        <label className="w-full text-sm text-emerald-100/90 mb-1.5 font-medium">
          Seu apelido
        </label>
        <input
          value={nick}
          onChange={(e) => setNickState(e.target.value.slice(0, 16))}
          placeholder="Ex: Cilnei"
          className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-lg outline-none focus:border-yellow-300/70 placeholder:text-white/30"
        />

        <button
          onClick={criarSala}
          disabled={!nickOk}
          className="w-full mt-5 rounded-xl bg-yellow-400 text-emerald-950 font-bold text-lg py-3.5 disabled:opacity-40 active:scale-[0.98] transition"
        >
          Criar sala
        </button>

        <div className="w-full flex items-center gap-3 my-5 text-white/40 text-xs">
          <div className="h-px flex-1 bg-white/15" />
          OU ENTRE NUMA SALA
          <div className="h-px flex-1 bg-white/15" />
        </div>

        <div className="w-full flex gap-2">
          <input
            value={code}
            onChange={(e) =>
              setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))
            }
            placeholder="CÓDIGO"
            className="flex-1 rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-lg tracking-[0.3em] font-mono uppercase outline-none focus:border-yellow-300/70 placeholder:tracking-normal placeholder:text-white/30"
          />
          <button
            onClick={entrarSala}
            disabled={!nickOk || code.length < 4}
            className="rounded-xl bg-emerald-600 px-6 font-bold disabled:opacity-40 active:scale-[0.98] transition"
          >
            Entrar
          </button>
        </div>

        <button
          onClick={() => setShowRules((v) => !v)}
          className="mt-8 text-emerald-200/70 text-sm underline underline-offset-4"
        >
          {showRules ? "Esconder regras" : "Como se joga?"}
        </button>

        {showRules && (
          <div className="w-full mt-4 rounded-xl bg-black/20 border border-white/10 p-4 text-sm text-emerald-50/90 space-y-2 animate-pop">
            <p>📣 A cada rodada aparece uma <b>pergunta de resposta numérica</b>.</p>
            <p>🔢 Na sua vez, você <b>chuta um número</b> — sempre <b>maior</b> que o palpite anterior.</p>
            <p>🦆 Se achar que o último chute exagerou, grite <b>&quot;Pato Bravo!&quot;</b> e desafie.</p>
            <p>🃏 Revela-se a resposta: se o palpite era <b>menor ou igual</b>, quem desafiou leva a carta; se <b>passou</b>, quem chutou leva.</p>
            <p>🏆 No fim, quem tiver <b>mais cartas perde</b> — todos os outros vencem!</p>
          </div>
        )}
      </div>
    </main>
  );
}
