import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Retorna o client do Supabase, ou null caso as chaves ainda não estejam
 * configuradas no .env.local. O app abre normalmente sem chaves — apenas o
 * multiplayer (Realtime) fica desativado até elas serem preenchidas.
 */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return client;
}

export const supabaseConfigured = Boolean(url && anonKey);
