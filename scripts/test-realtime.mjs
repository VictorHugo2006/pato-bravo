import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Lê as chaves do .env.local
const env = readFileSync(fileURLToPath(new URL("../.env.local", import.meta.url)), "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const URL_ = get("NEXT_PUBLIC_SUPABASE_URL");
const KEY = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
console.log("URL:", URL_);
console.log("KEY presente:", Boolean(KEY), KEY ? `(${KEY.slice(0, 12)}…)` : "");

const ROOM = "pato:TESTXY";
const host = createClient(URL_, KEY, { realtime: { params: { eventsPerSecond: 20 } } });
const guest = createClient(URL_, KEY, { realtime: { params: { eventsPerSecond: 20 } } });

let guestGotState = false;
let hostSawGuest = false;

// ---- HOST ----
const hc = host.channel(ROOM, { config: { broadcast: { self: false }, presence: { key: "host" } } });
hc.on("broadcast", { event: "hello" }, () => {
  console.log("[host] recebeu hello → respondendo com state");
  hc.send({ type: "broadcast", event: "state", payload: { phase: "lobby", from: "host" } });
});
hc.on("presence", { event: "sync" }, () => {
  const keys = Object.keys(hc.presenceState());
  console.log("[host] presence sync:", keys);
  if (keys.includes("guest")) hostSawGuest = true;
});
hc.subscribe((s) => {
  console.log("[host] status:", s);
  if (s === "SUBSCRIBED") hc.track({ id: "host" });
});

// ---- GUEST (entra 1.5s depois) ----
setTimeout(() => {
  const gc = guest.channel(ROOM, { config: { broadcast: { self: false }, presence: { key: "guest" } } });
  gc.on("broadcast", { event: "state" }, ({ payload }) => {
    console.log("[guest] >>> RECEBEU STATE:", JSON.stringify(payload));
    guestGotState = true;
  });
  gc.on("presence", { event: "sync" }, () => {
    console.log("[guest] presence sync:", Object.keys(gc.presenceState()));
  });
  gc.subscribe((s) => {
    console.log("[guest] status:", s);
    if (s === "SUBSCRIBED") {
      gc.track({ id: "guest" });
      console.log("[guest] enviando hello…");
      gc.send({ type: "broadcast", event: "hello", payload: {} });
    }
  });
}, 1500);

// ---- Veredito ----
setTimeout(() => {
  console.log("\n==== RESULTADO ====");
  console.log("Host enxergou o convidado (presence):", hostSawGuest ? "SIM ✓" : "NÃO ✗");
  console.log("Convidado recebeu o estado (broadcast):", guestGotState ? "SIM ✓" : "NÃO ✗");
  console.log(
    guestGotState && hostSawGuest
      ? "\n✅ Backend OK — o problema é no app/UI, não no Supabase."
      : "\n❌ Backend NÃO está repassando — problema de configuração do Realtime no Supabase.",
  );
  process.exit(0);
}, 6000);
