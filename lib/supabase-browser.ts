// Cliente Supabase para el navegador (anon key, RLS activado).
// Usar en componentes React del cliente.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (_client) return _client;
  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _client;
}