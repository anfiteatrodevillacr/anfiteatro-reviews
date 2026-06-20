// Cliente Supabase server-side con service_role (bypasea RLS).
// SOLO usar en API routes — nunca importar en componentes del cliente.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function getServerSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}