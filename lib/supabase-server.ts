// Cliente Supabase server-side con service_role (bypasea RLS).
// SOLO usar en API routes — nunca importar en componentes del cliente.
//
// Nota: las tablas y funciones viven en `public` (este proyecto es
// dedicado al Centro de Resenas, no comparte DB con el ERP).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getServerSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}