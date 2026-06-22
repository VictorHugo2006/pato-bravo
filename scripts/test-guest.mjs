import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const env = readFileSync(fileURLToPath(new URL("../.env.local", import.meta.url)), "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
  realtime: { params: { eventsPerSecond: 20 } },
});

const CODE = process.argv[2] || "ZZZZ";
const guestId = "guest-node-123";
let got = false;

const ch = sb.channel(`pato:${CODE}`, {
  config: { broadcast: { self: false }, presence: { key: guestId } },
});

const t0 = Date.now();
const ts = () => `+${((Date.now() - t0) / 1000).toFixed(1)}s`;
ch.on("broadcast", { event: "state" }, ({ payload }) => {
  if (!got) console.log(`[guest ${ts()}] >>> RECEBEU 1o STATE:`, JSON.stringify(payload).slice(0, 120));
  got = true;
});
ch.on("presence", { event: "sync" }, () => {
  console.log("[guest] presence:", Object.keys(ch.presenceState()));
});

ch.subscribe((s) => {
  console.log("[guest] status:", s);
  if (s === "SUBSCRIBED") {
    ch.track({ id: guestId, nick: "ConvidadoNode", isHost: false });
    console.log("[guest] enviando hello…");
    ch.send({ type: "broadcast", event: "hello", payload: {} });
  }
});

setTimeout(() => {
  console.log("\n==== RESULTADO ====");
  console.log(
    got
      ? "✅ Convidado RECEBEU o estado (mesmo entrando antes/ sem host inicial) — recuperou sozinho."
      : "❌ Convidado NÃO recebeu o estado em 18s.",
  );
  process.exit(0);
}, 18000);
